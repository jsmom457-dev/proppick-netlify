import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI, { toFile } from "openai";

import {
  buildAssetPlanningPrompt,
  buildSingleViewPrompt,
  getCategoryName,
} from "./prompts/assetPrompts.js";

import {
  buildFrontPrompt,
  buildSidePrompt,
  buildTopPrompt,
} from "./promptBuilder.js";

dotenv.config();


const app = express();
const PORT = Number(process.env.SERVER_PORT || 3001);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


app.use(
  cors({
    origin(origin, callback) {
      // origin이 없는 서버 요청 허용
      if (!origin) {
        return callback(null, true);
      }

      // 로컬 개발 환경 허용
      const isLocalhost =
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

      // Netlify 배포 주소 허용
      const isNetlify =
        /^https:\/\/[a-zA-Z0-9-]+\.netlify\.app$/.test(origin);

      // 별도로 지정한 배포 주소 허용
      const isConfiguredOrigin =
        process.env.CLIENT_ORIGIN &&
        origin === process.env.CLIENT_ORIGIN;

      if (isLocalhost || isNetlify || isConfiguredOrigin) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// Render payloads contain multiple data-URL images.
app.use(express.json({ limit: "80mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "proppick-api" });
});

function dataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") {
    throw new Error("이미지 데이터가 없습니다.");
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("지원하지 않는 이미지 데이터 형식입니다.");
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function extensionForMime(mimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

async function imageSourceToUpload(source, name) {
  if (!source || typeof source !== "string") {
    throw new Error("이미지 데이터가 없습니다.");
  }

  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`원격 이미지를 불러오지 못했습니다: ${response.status}`);
    }

    const mimeType =
      response.headers.get("content-type")?.split(";")[0] || "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());
    const extension = extensionForMime(mimeType);

    return toFile(buffer, `${name}.${extension}`, { type: mimeType });
  }

  const { mimeType, buffer } = dataUrlToBuffer(source);
  const extension = extensionForMime(mimeType);
  return toFile(buffer, `${name}.${extension}`, { type: mimeType });
}

async function uploadGeneratedImageToCloudinary(dataUrl, publicId) {
  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Netlify Cloudinary 환경변수가 설정되지 않았습니다.");
  }

  const formData = new FormData();
  formData.append("file", dataUrl);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "proppick/netlify-render-results");
  formData.append("public_id", publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`AI 결과 Cloudinary 업로드 실패: ${response.status} ${message}`);
  }

  const result = await response.json();
  return result.secure_url;
}

async function generateEditedImage({ prompt, imageDataUrls, resultName }) {
  const validImages = imageDataUrls.filter(Boolean).slice(0, 16);

  if (!validImages.length) {
    throw new Error("AI 렌더링에 사용할 기준 이미지가 없습니다.");
  }

  const uploads = await Promise.all(
    validImages.map((source, index) =>
      imageSourceToUpload(source, `render-input-${index + 1}`)
    )
  );

  console.log(
    `[AI Render] Sending ${uploads.length} reference image(s) to gpt-image-2`
  );

  const response = await openai.images.edit({
    model: "gpt-image-2",
    image: uploads,
    prompt,
    size: "1024x1024",
    quality: "low",
    output_format: "png",
    background: "opaque",
    n: 1,
  });

  const base64 = response.data?.[0]?.b64_json;
  if (!base64) {
    console.error("[AI Render] Empty image response:", response);
    throw new Error("AI 이미지 결과가 반환되지 않았습니다.");
  }

  // Netlify 응답에도 Base64를 싣지 않습니다. 결과를 Cloudinary에
  // 저장한 뒤 URL만 브라우저로 반환하여 6MB response 제한을 피합니다.
  const dataUrl = `data:image/png;base64,${base64}`;
  return uploadGeneratedImageToCloudinary(
    dataUrl,
    `${resultName || "render"}-${Date.now()}`
  );
}

function validateRenderRequest(body) {
  if (!body?.project) return "프로젝트 데이터가 필요합니다.";
  if (!body?.images?.compositionImage) return "사용자가 구성한 무대 이미지가 필요합니다.";
  if (!body?.images?.stageTypeImage) return "무대 유형 이미지가 필요합니다.";
  return null;
}

function normalizeRequestBody(body) {
  try {
    // 1. 이미 정상적인 JSON 객체
    if (
      body &&
      typeof body === "object" &&
      !Buffer.isBuffer(body) &&
      !Array.isArray(body) &&
      body.project
    ) {
      console.log("[Body Normalize] already normal JSON");
      return body;
    }

    // 2. 일반 문자열
    if (typeof body === "string") {
      console.log("[Body Normalize] parsing string");

      return JSON.parse(body);
    }

    // 3. Node Buffer
    if (Buffer.isBuffer(body)) {
      console.log("[Body Normalize] parsing Buffer");

      const text = body.toString("utf8");

      return JSON.parse(text);
    }

    // 4. Uint8Array
    if (body instanceof Uint8Array) {
      console.log("[Body Normalize] parsing Uint8Array");

      const text = Buffer.from(body).toString("utf8");

      return JSON.parse(text);
    }

    // 5. Netlify/serverless-http가 만든
    // { "0": ..., "1": ..., "2": ... } 형태
    if (
      body &&
      typeof body === "object" &&
      !Array.isArray(body)
    ) {
      const keys = Object.keys(body);

      const numericKeys =
        keys.length > 0 &&
        keys.every((key) => /^\d+$/.test(key));

      if (numericKeys) {
        console.log(
          "[Body Normalize] numeric-key body detected:",
          keys.length
        );

        const sortedKeys = keys.sort(
          (a, b) => Number(a) - Number(b)
        );

        const values = sortedKeys.map(
          (key) => body[key]
        );

        console.log(
          "[Body Normalize] first value type:",
          typeof values[0]
        );

        console.log(
          "[Body Normalize] first values:",
          values.slice(0, 20)
        );

        let text = "";

        // 값이 byte 숫자인 경우
        if (
          values.every(
            (value) =>
              typeof value === "number" &&
              Number.isFinite(value)
          )
        ) {
          text = Buffer.from(values).toString("utf8");
        }

        // 값이 문자열인 경우
        else if (
          values.every(
            (value) => typeof value === "string"
          )
        ) {
          // "123", "34" 같은 byte 문자열인지 확인
          const allByteStrings = values.every(
            (value) =>
              /^\d+$/.test(value) &&
              Number(value) >= 0 &&
              Number(value) <= 255
          );

          if (allByteStrings) {
            text = Buffer.from(
              values.map(Number)
            ).toString("utf8");
          } else {
            // "{", "\"", "p", "r"...처럼
            // 문자 단위로 쪼개진 경우
            text = values.join("");
          }
        }

        // { type: "Buffer", data: [...] } 같은 값이 섞인 경우
        else {
          text = values
            .map((value) => {
              if (typeof value === "number") {
                return String.fromCharCode(value);
              }

              return String(value ?? "");
            })
            .join("");
        }

        console.log(
          "[Body Normalize] reconstructed length:",
          text.length
        );

        console.log(
          "[Body Normalize] preview:",
          text.slice(0, 200)
        );

        const parsed = JSON.parse(text);

        console.log(
          "[Body Normalize] SUCCESS:",
          Object.keys(parsed)
        );

        return parsed;
      }
    }

    console.warn(
      "[Body Normalize] unsupported body format"
    );

    return body;
  } catch (error) {
    console.error(
      "[Body Normalize] FAILED:",
      error
    );

    return body;
  }
}

aapp.post("/api/render-stage", async (req, res) => {
  // Netlify에서 숫자 key 객체로 들어온 body를 정상 JSON으로 복구
  req.body = normalizeRequestBody(req.body);

  console.log("\n========== RENDER REQUEST DEBUG ==========");
  console.log("method:", req.method);
  console.log("content-type:", req.headers["content-type"]);
  console.log("body type:", typeof req.body);
  console.log("body keys:", Object.keys(req.body || {}));
  console.log("project:", Boolean(req.body?.project));
  console.log("settings:", Boolean(req.body?.settings));
  console.log("objects:", Array.isArray(req.body?.objects));
  console.log("images:", Boolean(req.body?.images));
  console.log(
    "compositionImage type:",
    typeof req.body?.images?.compositionImage
  );
  console.log(
    "stageTypeImage type:",
    typeof req.body?.images?.stageTypeImage
  );
  console.log("==========================================\n");

  const validationError = validateRenderRequest(req.body);

  if (validationError) {
    return res.status(400).json({
      error: validationError,
    });
  }

  const {
    project = {},
    settings = {},
    objects = [],
    images = {},
  } = req.body;

  console.log("\n========== ARTIST DEBUG ==========");
  console.log("settings 전체:", settings);
  console.log("artistCount:", settings.artistCount);
  console.log(
    "artistCount 타입:",
    typeof settings.artistCount
  );
  console.log("==================================\n");

  const referenceImages = Array.isArray(
    images.referenceImages
  )
    ? images.referenceImages.filter(Boolean)
    : [];

  try {
    console.log(
      "[AI Render] artistCount received:",
      settings.artistCount ?? null
    );

    const frontPrompt = buildFrontPrompt({
      project,
      settings,
      objects,
      referenceCount: referenceImages.length,
    });

    // 여기부터 기존 코드 그대로 계속
  // FRONT 프롬프트 확인
  console.log("\n========== FRONT PROMPT DEBUG ==========");
  console.log("artistCount:", settings.artistCount);
  console.log(frontPrompt);
  console.log("========================================\n");

  const front = await generateEditedImage({
    prompt: frontPrompt,
    resultName: "front",
    imageDataUrls: [
      images.compositionImage,
      images.stageTypeImage,
      ...referenceImages,
    ],
  });

    // Front becomes the canonical design. Side and top only change camera position.
    const sidePrompt = buildSidePrompt({
      project,
      settings,
      objects,
      referenceCount: referenceImages.length,
    });

    const topPrompt = buildTopPrompt({
      project,
      settings,
      objects,
      referenceCount: referenceImages.length,
    });

    const [side, top] = await Promise.all([
      generateEditedImage({
        prompt: sidePrompt,
        resultName: "side",
        imageDataUrls: [
          front,
          images.compositionImage,
          images.stageTypeImage,
          ...referenceImages,
        ],
      }),
      generateEditedImage({
        prompt: topPrompt,
        resultName: "top",
        imageDataUrls: [
          front,
          images.compositionImage,
          images.stageTypeImage,
          ...referenceImages,
        ],
      }),
    ]);

    return res.status(201).json({
      results: { front, side, top },
      prompts: {
        front: frontPrompt,
        side: sidePrompt,
        top: topPrompt,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stage render error:", error);

    return res.status(typeof error.status === "number" ? error.status : 500).json({
      error: error?.message || "AI 무대 렌더링 중 오류가 발생했습니다.",
    });
  }
});

// Existing prop-generation API is kept for the next implementation step.
function validateAssetRequest(body) {
  if (!body?.projectId) return "projectId가 필요합니다.";
  if (!body?.categoryId) return "categoryId가 필요합니다.";
  if (!body?.keywords?.space) return "공간 키워드가 필요합니다.";
  if (!body?.keywords?.mood) return "분위기 키워드가 필요합니다.";
  if (!body?.keywords?.style) return "조형 스타일 키워드가 필요합니다.";
  return null;
}

async function createAssetPlan({ categoryId, keywords }) {
  const prompt = buildAssetPlanningPrompt({ categoryId, keywords });

  const response = await openai.responses.create({
    model: "gpt-5.6",
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "asset_plan",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            assets: {
              type: "array",
              minItems: 1,
              maxItems: 1,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  koreanName: { type: "string" },
                  description: { type: "string" },
                  promptDetail: { type: "string" },
                },
                required: ["id", "name", "koreanName", "description", "promptDetail"],
              },
            },
          },
          required: ["assets"],
        },
      },
    },
  });

  const parsed = JSON.parse(response.output_text);
  if (!Array.isArray(parsed.assets) || parsed.assets.length !== 1) {
    throw new Error("AI 소품 계획 결과 형식이 올바르지 않습니다.");
  }

  return parsed.assets;
}

async function generateAssetView({ categoryId, keywords, assetPlan, view }) {
  const prompt = buildSingleViewPrompt({ categoryId, keywords, assetPlan, view });
  const result = await openai.images.generate({
    model: "gpt-image-2",
    prompt,
    size: "1024x1024",
    quality: "low",
    output_format: "png",
    background: "opaque",
    n: 1,
  });

  const base64 = result.data?.[0]?.b64_json;
  if (!base64) throw new Error(`${assetPlan.name}의 ${view} 이미지가 반환되지 않았습니다.`);
  return { view, prompt, base64 };
}

app.post("/api/render-stage", async (req, res) => {
  // Netlify/serverless-http에서 숫자 key 객체로 들어온 body를
  // 정상적인 JSON 객체로 복구
  req.body = normalizeRequestBody(req.body);

  console.log("\n========== RENDER REQUEST DEBUG ==========");
  console.log("method:", req.method);
  console.log("content-type:", req.headers["content-type"]);
  console.log("body type:", typeof req.body);
  console.log("body keys:", Object.keys(req.body || {}));
  console.log("project:", Boolean(req.body?.project));
  console.log("settings:", Boolean(req.body?.settings));
  console.log("objects:", Array.isArray(req.body?.objects));
  console.log("images:", Boolean(req.body?.images));
  console.log(
    "compositionImage type:",
    typeof req.body?.images?.compositionImage
  );
  console.log(
    "stageTypeImage type:",
    typeof req.body?.images?.stageTypeImage
  );
  console.log("==========================================\n");

  const validationError = validateRenderRequest(req.body);

  if (validationError) {
    console.error("[Render Validation]", validationError);

    return res.status(400).json({
      error: validationError,
    });
  }

  const {
    project = {},
    settings = {},
    objects = [],
    images = {},
  } = req.body;

  console.log("\n========== ARTIST DEBUG ==========");
  console.log("settings 전체:", settings);
  console.log("artistCount:", settings.artistCount);
  console.log("artistCount 타입:", typeof settings.artistCount);
  console.log("==================================\n");

  const referenceImages = Array.isArray(images.referenceImages)
    ? images.referenceImages.filter(Boolean)
    : [];

  try {
    console.log(
      "[AI Render] artistCount received:",
      settings.artistCount ?? null
    );

    const frontPrompt = buildFrontPrompt({
      project,
      settings,
      objects,
      referenceCount: referenceImages.length,
    });

    console.log("\n========== FRONT PROMPT DEBUG ==========");
    console.log("artistCount:", settings.artistCount);
    console.log(frontPrompt);
    console.log("========================================\n");

    const front = await generateEditedImage({
      prompt: frontPrompt,
      resultName: "front",
      imageDataUrls: [
        images.compositionImage,
        images.stageTypeImage,
        ...referenceImages,
      ],
    });

    // Front를 기준 디자인으로 사용
    const sidePrompt = buildSidePrompt({
      project,
      settings,
      objects,
      referenceCount: referenceImages.length,
    });

    const topPrompt = buildTopPrompt({
      project,
      settings,
      objects,
      referenceCount: referenceImages.length,
    });

    const [side, top] = await Promise.all([
      generateEditedImage({
        prompt: sidePrompt,
        resultName: "side",
        imageDataUrls: [
          front,
          images.compositionImage,
          images.stageTypeImage,
          ...referenceImages,
        ],
      }),

      generateEditedImage({
        prompt: topPrompt,
        resultName: "top",
        imageDataUrls: [
          front,
          images.compositionImage,
          images.stageTypeImage,
          ...referenceImages,
        ],
      }),
    ]);

    return res.status(201).json({
      results: {
        front,
        side,
        top,
      },

      prompts: {
        front: frontPrompt,
        side: sidePrompt,
        top: topPrompt,
      },

      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stage render error:", error);

    return res
      .status(
        typeof error.status === "number"
          ? error.status
          : 500
      )
      .json({
        error:
          error?.message ||
          "AI 무대 렌더링 중 오류가 발생했습니다.",
      });
  }
});

if (!process.env.NETLIFY) {
  app.listen(PORT, () => {
    console.log(`PROPICK API server: http://localhost:${PORT}`);
  });
}

export default app;
