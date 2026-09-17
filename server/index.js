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

app.post("/api/render-stage", async (req, res) => {
  const validationError = validateRenderRequest(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
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

app.post("/api/assets/generate-category", async (req, res) => {
  const validationError = validateAssetRequest(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const { projectId, categoryId, keywords } = req.body;

  try {
    const assetPlans = await createAssetPlan({ categoryId, keywords });
    const assetGroups = [];

    for (const assetPlan of assetPlans) {
      const [front, perspective] = await Promise.all([
        generateAssetView({ categoryId, keywords, assetPlan, view: "front" }),
        generateAssetView({ categoryId, keywords, assetPlan, view: "perspective" }),
      ]);

      assetGroups.push({
        id: `asset-group-${categoryId}-${Date.now()}-${assetPlan.id}`,
        projectId,
        categoryId,
        categoryName: getCategoryName(categoryId),
        name: assetPlan.name,
        koreanName: assetPlan.koreanName,
        description: assetPlan.description,
        keywords,
        views: {
          front: { base64: front.base64, prompt: front.prompt },
          perspective: { base64: perspective.base64, prompt: perspective.prompt },
        },
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(201).json({
      categoryId,
      assetTypeCount: assetGroups.length,
      imageCount: assetGroups.length * 2,
      assets: assetGroups,
    });
  } catch (error) {
    console.error("Asset generation error:", error);
    return res.status(typeof error.status === "number" ? error.status : 500).json({
      error: error?.message || "카테고리 소품 생성 중 오류가 발생했습니다.",
    });
  }
});

if (!process.env.NETLIFY) {
  app.listen(PORT, () => {
    console.log(`PROPICK API server: http://localhost:${PORT}`);
  });
}

export default app;
