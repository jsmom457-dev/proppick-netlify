import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI, { toFile } from "openai";

import {
  buildAssetPlanningPrompt,
  buildSingleViewPrompt,
} from "./prompts/assetPrompts.js";

import {
  buildFrontPrompt,
  buildSidePrompt,
  buildTopPrompt,
} from "./promptBuilder.js";

dotenv.config();

/* =========================================================
   APP / SERVER
========================================================= */

const app = express();

const PORT = Number(
  process.env.PORT ||
  process.env.SERVER_PORT ||
  3001
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin(origin, callback) {
      // 서버 간 요청 / Postman 등
      if (!origin) {
        return callback(null, true);
      }

      // 로컬 개발
      const isLocalhost =
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

      // Netlify 배포 주소
      const isNetlify =
        /^https:\/\/[a-zA-Z0-9-]+\.netlify\.app$/.test(origin);

      // 환경변수로 직접 지정한 프론트 주소
      const isConfiguredOrigin =
        process.env.CLIENT_ORIGIN &&
        origin === process.env.CLIENT_ORIGIN;

      if (
        isLocalhost ||
        isNetlify ||
        isConfiguredOrigin
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `CORS blocked for origin: ${origin}`
        )
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

/*
 * 렌더 요청에는 여러 이미지 URL/Data URL이 포함될 수 있음
 */
app.use(
  express.json({
    limit: "80mb",
  })
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "proppick-api",
  });
});

/* =========================================================
   IMAGE HELPERS
========================================================= */

function dataUrlToBuffer(dataUrl) {
  if (
    !dataUrl ||
    typeof dataUrl !== "string"
  ) {
    throw new Error(
      "이미지 데이터가 없습니다."
    );
  }

  const match = dataUrl.match(
    /^data:([^;]+);base64,(.+)$/
  );

  if (!match) {
    throw new Error(
      "지원하지 않는 이미지 데이터 형식입니다."
    );
  }

  return {
    mimeType: match[1],

    buffer: Buffer.from(
      match[2],
      "base64"
    ),
  };
}

function extensionForMime(mimeType) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "png";
}

/*
 * Cloudinary URL 또는 Data URL을
 * OpenAI 업로드 파일 형식으로 변환
 */
async function imageSourceToUpload(
  source,
  name
) {
  if (
    !source ||
    typeof source !== "string"
  ) {
    throw new Error(
      "이미지 데이터가 없습니다."
    );
  }

  /* -------------------------
     HTTP / HTTPS IMAGE
  ------------------------- */

  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);

    if (!response.ok) {
      throw new Error(
        `원격 이미지를 불러오지 못했습니다: ${response.status}`
      );
    }

    const mimeType =
      response.headers
        .get("content-type")
        ?.split(";")[0] ||
      "image/png";

    const buffer = Buffer.from(
      await response.arrayBuffer()
    );

    const extension =
      extensionForMime(mimeType);

    return toFile(
      buffer,
      `${name}.${extension}`,
      {
        type: mimeType,
      }
    );
  }

  /* -------------------------
     DATA URL
  ------------------------- */

  const {
    mimeType,
    buffer,
  } = dataUrlToBuffer(source);

  const extension =
    extensionForMime(mimeType);

  return toFile(
    buffer,
    `${name}.${extension}`,
    {
      type: mimeType,
    }
  );
}

/* =========================================================
   CLOUDINARY
========================================================= */

async function uploadGeneratedImageToCloudinary(
  dataUrl,
  publicId
) {
  const cloudName =
    process.env.VITE_CLOUDINARY_CLOUD_NAME;

  const uploadPreset =
    process.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (
    !cloudName ||
    !uploadPreset
  ) {
    throw new Error(
      "Cloudinary 환경변수가 설정되지 않았습니다."
    );
  }

  const formData =
    new FormData();

  formData.append(
    "file",
    dataUrl
  );

  formData.append(
    "upload_preset",
    uploadPreset
  );

  formData.append(
    "folder",
    "proppick/netlify-render-results"
  );

  formData.append(
    "public_id",
    publicId
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const message =
      await response.text();

    throw new Error(
      `AI 결과 Cloudinary 업로드 실패: ${response.status} ${message}`
    );
  }

  const result =
    await response.json();

  if (!result?.secure_url) {
    throw new Error(
      "Cloudinary 이미지 URL이 반환되지 않았습니다."
    );
  }

  return result.secure_url;
}

/* =========================================================
   OPENAI IMAGE EDIT
========================================================= */

async function generateEditedImage({
  prompt,
  imageDataUrls,
  resultName,
}) {
  const validImages =
    imageDataUrls
      .filter(Boolean)
      .slice(0, 16);

  if (!validImages.length) {
    throw new Error(
      "AI 렌더링에 사용할 기준 이미지가 없습니다."
    );
  }

  console.log(
    `[AI Render] Preparing ${resultName} image...`
  );

  const uploads =
    await Promise.all(
      validImages.map(
        (source, index) =>
          imageSourceToUpload(
            source,
            `${resultName}-input-${index + 1}`
          )
      )
    );

  console.log(
    `[AI Render] ${resultName}: Sending ${uploads.length} reference image(s) to gpt-image-2`
  );

  const startedAt =
    Date.now();

  const response =
    await openai.images.edit({
      model: "gpt-image-2",

      image: uploads,

      prompt,

      size: "1024x1024",

      quality: "low",

      output_format: "png",

      background: "opaque",

      n: 1,
    });

  console.log(
    `[AI Render] ${resultName}: OpenAI finished in ${(
      (Date.now() - startedAt) /
      1000
    ).toFixed(1)}s`
  );

  const base64 =
    response.data?.[0]?.b64_json;

  if (!base64) {
    console.error(
      `[AI Render] ${resultName}: Empty image response`,
      response
    );

    throw new Error(
      "AI 이미지 결과가 반환되지 않았습니다."
    );
  }

  /*
   * Base64를 브라우저에 직접 반환하지 않고
   * Cloudinary에 저장한 후 URL만 반환
   */

  const dataUrl =
    `data:image/png;base64,${base64}`;

  console.log(
    `[AI Render] ${resultName}: Uploading to Cloudinary...`
  );

  const imageUrl =
    await uploadGeneratedImageToCloudinary(
      dataUrl,
      `${resultName}-${Date.now()}`
    );

  console.log(
    `[AI Render] ${resultName}: Cloudinary upload complete`
  );

  return imageUrl;
}

/* =========================================================
   REQUEST VALIDATION
========================================================= */

function validateRenderRequest(body) {
  if (!body?.project) {
    return "프로젝트 데이터가 필요합니다.";
  }

  if (
    !body?.images?.compositionImage
  ) {
    return "사용자가 구성한 무대 이미지가 필요합니다.";
  }

  if (
    !body?.images?.stageTypeImage
  ) {
    return "무대 유형 이미지가 필요합니다.";
  }

  return null;
}

/* =========================================================
   BODY NORMALIZER
========================================================= */

function normalizeRequestBody(body) {
  try {
    /*
     * 1. 이미 정상적인 JSON 객체
     */

    if (
      body &&
      typeof body === "object" &&
      !Buffer.isBuffer(body) &&
      !Array.isArray(body) &&
      body.project
    ) {
      console.log(
        "[Body Normalize] already normal JSON"
      );

      return body;
    }

    /*
     * 2. 문자열
     */

    if (
      typeof body === "string"
    ) {
      console.log(
        "[Body Normalize] parsing string"
      );

      return JSON.parse(body);
    }

    /*
     * 3. Buffer
     */

    if (
      Buffer.isBuffer(body)
    ) {
      console.log(
        "[Body Normalize] parsing Buffer"
      );

      const text =
        body.toString("utf8");

      return JSON.parse(text);
    }

    /*
     * 4. Uint8Array
     */

    if (
      body instanceof Uint8Array
    ) {
      console.log(
        "[Body Normalize] parsing Uint8Array"
      );

      const text =
        Buffer
          .from(body)
          .toString("utf8");

      return JSON.parse(text);
    }

    /*
     * 5. serverless-http / Netlify
     *
     * {
     *   "0": ...,
     *   "1": ...,
     *   "2": ...
     * }
     */

    if (
      body &&
      typeof body === "object" &&
      !Array.isArray(body)
    ) {
      const keys =
        Object.keys(body);

      const numericKeys =
        keys.length > 0 &&
        keys.every(
          (key) =>
            /^\d+$/.test(key)
        );

      if (numericKeys) {
        console.log(
          "[Body Normalize] numeric-key body detected:",
          keys.length
        );

        const sortedKeys =
          keys.sort(
            (a, b) =>
              Number(a) -
              Number(b)
          );

        const values =
          sortedKeys.map(
            (key) =>
              body[key]
          );

        let text = "";

        /*
         * byte 숫자
         */

        if (
          values.every(
            (value) =>
              typeof value ===
                "number" &&
              Number.isFinite(value)
          )
        ) {
          text =
            Buffer
              .from(values)
              .toString("utf8");
        }

        /*
         * 문자열
         */

        else if (
          values.every(
            (value) =>
              typeof value ===
              "string"
          )
        ) {
          const allByteStrings =
            values.every(
              (value) =>
                /^\d+$/.test(
                  value
                ) &&
                Number(value) >=
                  0 &&
                Number(value) <=
                  255
            );

          if (allByteStrings) {
            text =
              Buffer
                .from(
                  values.map(
                    Number
                  )
                )
                .toString(
                  "utf8"
                );
          } else {
            text =
              values.join("");
          }
        }

        /*
         * 혼합 형태
         */

        else {
          text =
            values
              .map(
                (value) => {
                  if (
                    typeof value ===
                    "number"
                  ) {
                    return String.fromCharCode(
                      value
                    );
                  }

                  return String(
                    value ?? ""
                  );
                }
              )
              .join("");
        }

        console.log(
          "[Body Normalize] reconstructed length:",
          text.length
        );

        const parsed =
          JSON.parse(text);

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

/* =========================================================
   STAGE RENDER API
========================================================= */

app.post(
  "/api/render-stage",
  async (req, res) => {
    /*
     * Netlify/serverless-http에서 body가
     * 숫자 key 객체로 들어오는 경우 복구
     */

    req.body =
      normalizeRequestBody(
        req.body
      );

    console.log(
      "\n========== RENDER REQUEST =========="
    );

    console.log(
      "method:",
      req.method
    );

    console.log(
      "content-type:",
      req.headers[
        "content-type"
      ]
    );

    console.log(
      "body keys:",
      Object.keys(
        req.body || {}
      )
    );

    console.log(
      "project:",
      Boolean(
        req.body?.project
      )
    );

    console.log(
      "settings:",
      Boolean(
        req.body?.settings
      )
    );

    console.log(
      "objects:",
      Array.isArray(
        req.body?.objects
      )
    );

    console.log(
      "images:",
      Boolean(
        req.body?.images
      )
    );

    console.log(
      "====================================\n"
    );

    const validationError =
      validateRenderRequest(
        req.body
      );

    if (validationError) {
      console.error(
        "[Render Validation]",
        validationError
      );

      return res
        .status(400)
        .json({
          error:
            validationError,
        });
    }

    const {
      project = {},
      settings = {},
      objects = [],
      images = {},
    } = req.body;

    const referenceImages =
      Array.isArray(
        images.referenceImages
      )
        ? images.referenceImages.filter(
            Boolean
          )
        : [];

    try {
      console.log(
        "[AI Render] artistCount:",
        settings.artistCount ??
          null
      );

      /* =====================================================
         1. FRONT
      ===================================================== */

      const frontPrompt =
        buildFrontPrompt({
          project,
          settings,
          objects,

          referenceCount:
            referenceImages.length,
        });

      console.log(
        "\n========== FRONT GENERATION =========="
      );

      console.log(
        "artistCount:",
        settings.artistCount
      );

      console.log(
        "[AI Render] Starting FRONT..."
      );

      const front =
        await generateEditedImage({
          prompt:
            frontPrompt,

          resultName:
            "front",

          imageDataUrls: [
            images.compositionImage,
            images.stageTypeImage,
            ...referenceImages,
          ],
        });

      console.log(
        "[AI Render] FRONT complete:",
        front
      );

      /*
       * Front 결과가 이후 Side / Top의
       * canonical design이 됨.
       */

      /* =====================================================
         2. SIDE / TOP PROMPTS
      ===================================================== */

      const sidePrompt =
        buildSidePrompt({
          project,
          settings,
          objects,

          referenceCount:
            referenceImages.length,
        });

      const topPrompt =
        buildTopPrompt({
          project,
          settings,
          objects,

          referenceCount:
            referenceImages.length,
        });

      console.log(
        "\n========== SIDE + TOP GENERATION =========="
      );

      console.log(
        "[AI Render] Starting SIDE and TOP in parallel..."
      );

      /* =====================================================
         3. SIDE + TOP
      ===================================================== */

      const [
        side,
        top,
      ] =
        await Promise.all([
          generateEditedImage({
            prompt:
              sidePrompt,

            resultName:
              "side",

            imageDataUrls: [
              front,
              images.compositionImage,
              images.stageTypeImage,
              ...referenceImages,
            ],
          }),

          generateEditedImage({
            prompt:
              topPrompt,

            resultName:
              "top",

            imageDataUrls: [
              front,
              images.compositionImage,
              images.stageTypeImage,
              ...referenceImages,
            ],
          }),
        ]);

      console.log(
        "[AI Render] SIDE complete:",
        side
      );

      console.log(
        "[AI Render] TOP complete:",
        top
      );

      console.log(
        "\n========== RENDER COMPLETE ==========\n"
      );

      /* =====================================================
         RESPONSE
      ===================================================== */

      return res
        .status(201)
        .json({
          results: {
            front,
            side,
            top,
          },

          prompts: {
            front:
              frontPrompt,

            side:
              sidePrompt,

            top:
              topPrompt,
          },

          generatedAt:
            new Date()
              .toISOString(),
        });
    } catch (error) {
      console.error(
        "\n========== STAGE RENDER ERROR =========="
      );

      console.error(
        error
      );

      console.error(
        "message:",
        error?.message
      );

      console.error(
        "status:",
        error?.status
      );

      console.error(
        "========================================\n"
      );

      return res
        .status(
          typeof error?.status ===
            "number"
            ? error.status
            : 500
        )
        .json({
          error:
            error?.message ||
            "AI 무대 렌더링 중 오류가 발생했습니다.",
        });
    }
  }
);

/* =========================================================
   ASSET GENERATION
========================================================= */

function validateAssetRequest(
  body
) {
  if (!body?.projectId) {
    return "projectId가 필요합니다.";
  }

  if (!body?.categoryId) {
    return "categoryId가 필요합니다.";
  }

  if (
    !body?.keywords?.space
  ) {
    return "공간 키워드가 필요합니다.";
  }

  if (
    !body?.keywords?.mood
  ) {
    return "분위기 키워드가 필요합니다.";
  }

  if (
    !body?.keywords?.style
  ) {
    return "조형 스타일 키워드가 필요합니다.";
  }

  return null;
}

async function createAssetPlan({
  categoryId,
  keywords,
}) {
  const prompt =
    buildAssetPlanningPrompt({
      categoryId,
      keywords,
    });

  const response =
    await openai.responses.create({
      model: "gpt-5.6",

      input: prompt,

      text: {
        format: {
          type: "json_schema",

          name: "asset_plan",

          strict: true,

          schema: {
            type: "object",

            additionalProperties:
              false,

            properties: {
              assets: {
                type: "array",

                minItems: 1,

                maxItems: 1,

                items: {
                  type:
                    "object",

                  additionalProperties:
                    false,

                  properties: {
                    id: {
                      type:
                        "string",
                    },

                    name: {
                      type:
                        "string",
                    },

                    koreanName: {
                      type:
                        "string",
                    },

                    description: {
                      type:
                        "string",
                    },

                    promptDetail: {
                      type:
                        "string",
                    },
                  },

                  required: [
                    "id",
                    "name",
                    "koreanName",
                    "description",
                    "promptDetail",
                  ],
                },
              },
            },

            required: [
              "assets",
            ],
          },
        },
      },
    });

  const parsed =
    JSON.parse(
      response.output_text
    );

  if (
    !Array.isArray(
      parsed.assets
    ) ||
    parsed.assets.length !==
      1
  ) {
    throw new Error(
      "AI 소품 계획 결과 형식이 올바르지 않습니다."
    );
  }

  return parsed.assets;
}

async function generateAssetView({
  categoryId,
  keywords,
  assetPlan,
  view,
}) {
  const prompt =
    buildSingleViewPrompt({
      categoryId,
      keywords,
      assetPlan,
      view,
    });

  const result =
    await openai.images.generate({
      model:
        "gpt-image-2",

      prompt,

      size:
        "1024x1024",

      quality:
        "low",

      output_format:
        "png",

      background:
        "opaque",

      n: 1,
    });

  const base64 =
    result.data?.[0]?.b64_json;

  if (!base64) {
    throw new Error(
      `${assetPlan.name}의 ${view} 이미지가 반환되지 않았습니다.`
    );
  }

  return {
    view,
    prompt,
    base64,
  };
}

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (
    error,
    _req,
    res,
    _next
  ) => {
    console.error(
      "[Express Error]",
      error
    );

    if (
      res.headersSent
    ) {
      return;
    }

    res
      .status(500)
      .json({
        error:
          error?.message ||
          "서버 오류가 발생했습니다.",
      });
  }
);

/* =========================================================
   SERVER START
========================================================= */

/*
 * 로컬 / Render에서는 서버 실행.
 * Netlify Function에서는 serverless-http가 app을 사용하므로
 * 직접 listen하지 않음.
 */

if (!process.env.NETLIFY) {
  app.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `PROPICK API server running on port ${PORT}`
      );
    }
  );
}

export default app;