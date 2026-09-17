import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI, { toFile } from "openai";
import { fileURLToPath } from "node:url";

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

// Always load the root .env even when the server is launched from /server.
dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
});

const app = express();
const PORT = Number(process.env.SERVER_PORT || 3001);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


app.use(
  cors({
    origin(origin, callback) {
      // curl, Postman 등 origin이 없는 요청 허용
      if (!origin) {
        return callback(null, true);
      }

      // 개발 중 localhost의 모든 포트 허용
      const isLocalhost =
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

      if (isLocalhost) {
        return callback(null, true);
      }

      // 실제 배포 주소가 있다면 허용
      if (
        process.env.CLIENT_ORIGIN &&
        origin === process.env.CLIENT_ORIGIN
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

async function dataUrlToUpload(dataUrl, name) {
  const { mimeType, buffer } = dataUrlToBuffer(dataUrl);
  const extension = extensionForMime(mimeType);

  return toFile(buffer, `${name}.${extension}`, {
    type: mimeType,
  });
}

async function generateEditedImage({ prompt, imageDataUrls }) {
  const validImages = imageDataUrls.filter(Boolean).slice(0, 16);

  if (!validImages.length) {
    throw new Error("AI 렌더링에 사용할 기준 이미지가 없습니다.");
  }

  const uploads = await Promise.all(
    validImages.map((dataUrl, index) =>
      dataUrlToUpload(dataUrl, `render-input-${index + 1}`)
    )
  );

  console.log(
    `[AI Render] Sending ${uploads.length} reference image(s) to gpt-image-2`
  );

  const response = await openai.images.edit({
    model: "gpt-image-2",
    image: uploads,
    prompt,
    // 전시/프로토타입용 빠른 렌더 설정.
    // 화면 표시 크기는 프론트엔드 레이아웃이 결정하므로,
    // 생성 원본만 1024px로 낮춰 생성 시간을 줄입니다.
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

  return `data:image/png;base64,${base64}`;
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
        imageDataUrls: [
          front,
          images.compositionImage,
          images.stageTypeImage,
          ...referenceImages,
        ],
      }),
      generateEditedImage({
        prompt: topPrompt,
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
