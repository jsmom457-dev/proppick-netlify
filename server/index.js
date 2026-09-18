import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI, { toFile } from "openai";

import {
  buildFrontPrompt,
  buildSidePrompt,
  buildTopPrompt,
} from "./promptBuilder.js";


dotenv.config();


/* =========================================================
   APP
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
      if (!origin) {
        return callback(null, true);
      }

      const isLocalhost =
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

      const isNetlify =
        /^https:\/\/[a-zA-Z0-9-]+\.netlify\.app$/.test(origin);

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


app.use(
  express.json({
    limit: "80mb",
  })
);


/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "proppick-api",
  });
});


/* =========================================================
   BODY NORMALIZER
========================================================= */

function normalizeRequestBody(body) {
  try {
    /*
     * 이미 정상적인 객체
     */
    if (
      body &&
      typeof body === "object" &&
      !Buffer.isBuffer(body) &&
      !Array.isArray(body) &&
      (
        body.project ||
        body.frontImage
      )
    ) {
      return body;
    }


    /*
     * 문자열
     */
    if (typeof body === "string") {
      return JSON.parse(body);
    }


    /*
     * Buffer
     */
    if (Buffer.isBuffer(body)) {
      return JSON.parse(
        body.toString("utf8")
      );
    }


    /*
     * Uint8Array
     */
    if (body instanceof Uint8Array) {
      return JSON.parse(
        Buffer
          .from(body)
          .toString("utf8")
      );
    }


    /*
     * Netlify/serverless-http에서
     * 숫자 key 객체로 들어오는 경우
     */
    if (
      body &&
      typeof body === "object" &&
      !Array.isArray(body)
    ) {
      const keys = Object.keys(body);

      const numericKeys =
        keys.length > 0 &&
        keys.every((key) =>
          /^\d+$/.test(key)
        );

      if (numericKeys) {
        const sortedKeys = keys.sort(
          (a, b) =>
            Number(a) - Number(b)
        );

        const values = sortedKeys.map(
          (key) => body[key]
        );

        let text = "";


        if (
          values.every(
            (value) =>
              typeof value === "number"
          )
        ) {
          text = Buffer
            .from(values)
            .toString("utf8");
        }

        else if (
          values.every(
            (value) =>
              typeof value === "string"
          )
        ) {
          const byteStrings =
            values.every(
              (value) =>
                /^\d+$/.test(value) &&
                Number(value) >= 0 &&
                Number(value) <= 255
            );

          if (byteStrings) {
            text = Buffer
              .from(
                values.map(Number)
              )
              .toString("utf8");
          } else {
            text = values.join("");
          }
        }

        else {
          text = values
            .map((value) => {
              if (
                typeof value === "number"
              ) {
                return String.fromCharCode(
                  value
                );
              }

              return String(
                value ?? ""
              );
            })
            .join("");
        }


        return JSON.parse(text);
      }
    }


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
   IMAGE HELPERS
========================================================= */

function dataUrlToBuffer(dataUrl) {
  const match =
    dataUrl?.match(
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
 * URL 또는 Data URL
 * →
 * OpenAI 업로드 파일
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
      `이미지가 없습니다: ${name}`
    );
  }


  /*
   * Cloudinary 등 URL
   */
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);

    if (!response.ok) {
      throw new Error(
        `이미지를 불러오지 못했습니다: ${response.status}`
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

    return toFile(
      buffer,
      `${name}.${extensionForMime(mimeType)}`,
      {
        type: mimeType,
      }
    );
  }


  /*
   * Data URL
   */
  const {
    mimeType,
    buffer,
  } = dataUrlToBuffer(source);


  return toFile(
    buffer,
    `${name}.${extensionForMime(mimeType)}`,
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


  const formData = new FormData();

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
      `Cloudinary 업로드 실패: ${response.status} ${message}`
    );
  }


  const result =
    await response.json();


  if (!result?.secure_url) {
    throw new Error(
      "Cloudinary URL이 반환되지 않았습니다."
    );
  }


  return result.secure_url;
}


/* =========================================================
   OPENAI IMAGE GENERATION
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
      `${resultName} 생성에 사용할 이미지가 없습니다.`
    );
  }


  console.log(
    `[AI Render] ${resultName}: 이미지 준비 시작`
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
    `[AI Render] ${resultName}: OpenAI 요청 시작 (${uploads.length} refs)`
  );


  const startedAt = Date.now();


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
    `[AI Render] ${resultName}: OpenAI 완료 ${(
      (Date.now() - startedAt) /
      1000
    ).toFixed(1)}초`
  );


  const base64 =
    response.data?.[0]?.b64_json;


  if (!base64) {
    throw new Error(
      `${resultName} 이미지 결과가 없습니다.`
    );
  }


  const dataUrl =
    `data:image/png;base64,${base64}`;


  console.log(
    `[AI Render] ${resultName}: Cloudinary 업로드 시작`
  );


  const imageUrl =
    await uploadGeneratedImageToCloudinary(
      dataUrl,
      `${resultName}-${Date.now()}`
    );


  console.log(
    `[AI Render] ${resultName}: 완료`
  );


  return imageUrl;
}


/* =========================================================
   COMMON VALIDATION
========================================================= */

function validateBaseRequest(body) {
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
   FRONT
========================================================= */

app.post(
  "/api/render-stage/front",
  async (req, res) => {
    req.body =
      normalizeRequestBody(
        req.body
      );


    const validationError =
      validateBaseRequest(
        req.body
      );


    if (validationError) {
      return res
        .status(400)
        .json({
          error: validationError,
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
        ? images.referenceImages.filter(Boolean)
        : [];


    try {
      console.log(
        "\n========== FRONT REQUEST =========="
      );

      console.log(
        "artistCount:",
        settings.artistCount
      );


      const prompt =
        buildFrontPrompt({
          project,
          settings,
          objects,

          referenceCount:
            referenceImages.length,
        });


      const result =
        await generateEditedImage({
          prompt,

          resultName: "front",

          imageDataUrls: [
            images.compositionImage,
            images.stageTypeImage,
            ...referenceImages,
          ],
        });


      console.log(
        "========== FRONT COMPLETE ==========\n"
      );


      return res
        .status(201)
        .json({
          result,
          prompt,
          view: "front",
        });

    } catch (error) {
      console.error(
        "[FRONT ERROR]",
        error
      );


      return res
        .status(
          typeof error?.status === "number"
            ? error.status
            : 500
        )
        .json({
          error:
            error?.message ||
            "Front 생성에 실패했습니다.",
        });
    }
  }
);


/* =========================================================
   SIDE
========================================================= */

app.post(
  "/api/render-stage/side",
  async (req, res) => {
    req.body =
      normalizeRequestBody(
        req.body
      );


    const validationError =
      validateBaseRequest(
        req.body
      );


    if (validationError) {
      return res
        .status(400)
        .json({
          error: validationError,
        });
    }


    const {
      project = {},
      settings = {},
      objects = [],
      images = {},
      frontImage,
    } = req.body;


    if (!frontImage) {
      return res
        .status(400)
        .json({
          error:
            "Side 생성에는 Front 이미지가 필요합니다.",
        });
    }


    const referenceImages =
      Array.isArray(
        images.referenceImages
      )
        ? images.referenceImages.filter(Boolean)
        : [];


    try {
      console.log(
        "\n========== SIDE REQUEST =========="
      );


      const prompt =
        buildSidePrompt({
          project,
          settings,
          objects,

          referenceCount:
            referenceImages.length,
        });


      const result =
        await generateEditedImage({
          prompt,

          resultName: "side",

          imageDataUrls: [
            frontImage,
            images.compositionImage,
            images.stageTypeImage,
            ...referenceImages,
          ],
        });


      console.log(
        "========== SIDE COMPLETE ==========\n"
      );


      return res
        .status(201)
        .json({
          result,
          prompt,
          view: "side",
        });

    } catch (error) {
      console.error(
        "[SIDE ERROR]",
        error
      );


      return res
        .status(
          typeof error?.status === "number"
            ? error.status
            : 500
        )
        .json({
          error:
            error?.message ||
            "Side 생성에 실패했습니다.",
        });
    }
  }
);


/* =========================================================
   TOP
========================================================= */

app.post(
  "/api/render-stage/top",
  async (req, res) => {
    req.body =
      normalizeRequestBody(
        req.body
      );


    const validationError =
      validateBaseRequest(
        req.body
      );


    if (validationError) {
      return res
        .status(400)
        .json({
          error: validationError,
        });
    }


    const {
      project = {},
      settings = {},
      objects = [],
      images = {},
      frontImage,
    } = req.body;


    if (!frontImage) {
      return res
        .status(400)
        .json({
          error:
            "Top 생성에는 Front 이미지가 필요합니다.",
        });
    }


    const referenceImages =
      Array.isArray(
        images.referenceImages
      )
        ? images.referenceImages.filter(Boolean)
        : [];


    try {
      console.log(
        "\n========== TOP REQUEST =========="
      );


      const prompt =
        buildTopPrompt({
          project,
          settings,
          objects,

          referenceCount:
            referenceImages.length,
        });


      const result =
        await generateEditedImage({
          prompt,

          resultName: "top",

          imageDataUrls: [
            frontImage,
            images.compositionImage,
            images.stageTypeImage,
            ...referenceImages,
          ],
        });


      console.log(
        "========== TOP COMPLETE ==========\n"
      );


      return res
        .status(201)
        .json({
          result,
          prompt,
          view: "top",
        });

    } catch (error) {
      console.error(
        "[TOP ERROR]",
        error
      );


      return res
        .status(
          typeof error?.status === "number"
            ? error.status
            : 500
        )
        .json({
          error:
            error?.message ||
            "Top 생성에 실패했습니다.",
        });
    }
  }
);


/* =========================================================
   EXPRESS ERROR
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


    if (res.headersSent) {
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
   START
========================================================= */

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