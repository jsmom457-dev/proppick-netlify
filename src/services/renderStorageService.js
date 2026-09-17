// src/services/renderStorageService.js

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase";

const CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;


/**
 * Firestore에 undefined 값이 들어가지 않도록 제거
 */
function removeUndefined(value) {
  if (Array.isArray(value)) {
    return value
      .map(removeUndefined)
      .filter((item) => item !== undefined);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([, item]) =>
            item !== undefined
        )
        .map(
          ([key, item]) => [
            key,
            removeUndefined(item),
          ]
        )
    );
  }

  return value;
}


/**
 * Cloudinary 환경변수 확인
 */
function validateCloudinaryConfig() {
  if (!CLOUD_NAME) {
    throw new Error(
      "VITE_CLOUDINARY_CLOUD_NAME이 설정되지 않았습니다."
    );
  }

  if (!UPLOAD_PRESET) {
    throw new Error(
      "VITE_CLOUDINARY_UPLOAD_PRESET이 설정되지 않았습니다."
    );
  }
}


/**
 * data URL 이미지를 Cloudinary에 업로드
 *
 * data:image/png;base64,...
 * 형식을 그대로 Cloudinary file 필드로 전송할 수 있습니다.
 */
export async function uploadImageToCloudinary({
  dataUrl,
  folder,
  publicId,
}) {
  if (!dataUrl) {
    throw new Error(
      `Cloudinary에 업로드할 이미지가 없습니다: ${publicId}`
    );
  }

  // 이미 Cloudinary에 올라간 이미지는 다시 업로드하지 않습니다.
  // Netlify 배포에서는 AI 요청/응답을 URL 기반으로 유지해
  // Function의 6MB payload 제한을 피합니다.
  if (
    typeof dataUrl === "string" &&
    /^https:\/\/res\.cloudinary\.com\//i.test(dataUrl)
  ) {
    return {
      url: dataUrl,
      publicId: publicId || null,
      width: null,
      height: null,
      format: null,
      bytes: null,
    };
  }

  validateCloudinaryConfig();

  const formData =
    new FormData();

  formData.append(
    "file",
    dataUrl
  );

  formData.append(
    "upload_preset",
    UPLOAD_PRESET
  );

  /**
   * Cloudinary에서 프로젝트별 폴더 분리
   */
  if (folder) {
    formData.append(
      "folder",
      folder
    );
  }

  /**
   * 파일명을 일정하게 관리
   */
  if (publicId) {
    formData.append(
      "public_id",
      publicId
    );
  }

  console.log(
    `[Cloudinary] 업로드 시작: ${publicId}`
  );

  const response =
    await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "[Cloudinary] 업로드 실패:",
      errorText
    );

    throw new Error(
      `Cloudinary 이미지 업로드 실패: ${response.status} ${errorText}`
    );
  }

  const result =
    await response.json();

  console.log(
    `[Cloudinary] 업로드 완료: ${publicId}`
  );

  return {
    url:
      result.secure_url,

    publicId:
      result.public_id,

    width:
      result.width,

    height:
      result.height,

    format:
      result.format,

    bytes:
      result.bytes,

    resourceType:
      result.resource_type,
  };
}


/**
 * 로컬 reference image metadata 정리
 *
 * base64는 Firestore에 저장하지 않고
 * Cloudinary URL만 저장
 */
function stripReferenceData(
  referenceImages = []
) {
  return referenceImages.map(
    (image, index) => ({
      id:
        image?.id ||
        `reference-${index + 1}`,

      name:
        image?.name ||
        `reference-${index + 1}`,
    })
  );
}


/**
 * PROPICK AI 렌더 결과 저장
 *
 * 이미지:
 * Cloudinary
 *
 * 텍스트 / 설정 / URL:
 * Firebase Firestore
 */
export async function saveCompleteRenderProject({
  projectId,
  project,
  objects,
  renderPayload,
  apiResponse,
}) {
  if (!projectId) {
    throw new Error(
      "프로젝트 ID가 없습니다."
    );
  }

  validateCloudinaryConfig();

  const results =
    apiResponse?.results || {};

  const inputImages =
    renderPayload?.images || {};

  /**
   * 최종 렌더 확인
   */
  if (
    !results.front ||
    !results.side ||
    !results.top
  ) {
    throw new Error(
      "Front / Side / Top 렌더 이미지가 모두 필요합니다."
    );
  }

  const renderId =
    `render-${Date.now()}`;

  const cloudinaryFolder =
    `proppick/projects/${projectId}/${renderId}`;

  console.log(
    `[PROPICK] ${renderId} 저장 시작`
  );


  /**
   * =========================
   * 1. 결과 이미지 업로드
   * =========================
   */
  const [
    front,
    side,
    top,
  ] =
    await Promise.all([
      uploadImageToCloudinary({
        dataUrl:
          results.front,

        folder:
          `${cloudinaryFolder}/results`,

        publicId:
          "front",
      }),

      uploadImageToCloudinary({
        dataUrl:
          results.side,

        folder:
          `${cloudinaryFolder}/results`,

        publicId:
          "side",
      }),

      uploadImageToCloudinary({
        dataUrl:
          results.top,

        folder:
          `${cloudinaryFolder}/results`,

        publicId:
          "top",
      }),
    ]);


  /**
   * =========================
   * 2. 입력 이미지 저장
   * =========================
   */

  let composition = null;
  let stageType = null;

  const extraUploads = [];


  if (
    inputImages.compositionImage
  ) {
    extraUploads.push(
      uploadImageToCloudinary({
        dataUrl:
          inputImages.compositionImage,

        folder:
          `${cloudinaryFolder}/inputs`,

        publicId:
          "composition",
      }).then(
        (result) => {
          composition =
            result;

          return result;
        }
      )
    );
  }


  if (
    inputImages.stageTypeImage
  ) {
    extraUploads.push(
      uploadImageToCloudinary({
        dataUrl:
          inputImages.stageTypeImage,

        folder:
          `${cloudinaryFolder}/inputs`,

        publicId:
          "stage-type",
      }).then(
        (result) => {
          stageType =
            result;

          return result;
        }
      )
    );
  }


  await Promise.all(
    extraUploads
  );


  /**
   * =========================
   * 3. Reference 이미지 저장
   * =========================
   */

  const referenceInputs =
    Array.isArray(
      inputImages.referenceImages
    )
      ? inputImages
          .referenceImages
          .filter(Boolean)
      : [];


  const savedReferences =
    await Promise.all(
      referenceInputs.map(
        (
          dataUrl,
          index
        ) =>
          uploadImageToCloudinary({
            dataUrl,

            folder:
              `${cloudinaryFolder}/references`,

            publicId:
              `reference-${
                index + 1
              }`,
          })
      )
    );


  /**
   * 기존 reference metadata
   */
  const originalReferenceMeta =
    stripReferenceData(
      renderPayload
        ?.settings
        ?.referenceImages ||
        []
    );


  const referenceImages =
    savedReferences.map(
      (
        saved,
        index
      ) => ({
        ...(
          originalReferenceMeta[
            index
          ] || {
            id:
              `reference-${
                index + 1
              }`,
          }
        ),

        url:
          saved.url,

        publicId:
          saved.publicId,
      })
    );


  /**
   * =========================
   * 4. Firestore용 결과 URL
   * =========================
   */

  const savedResults = {
    front:
      front.url,

    side:
      side.url,

    top:
      top.url,
  };


  /**
   * 상세페이지 설정
   */
  const savedRenderSettings = {
    ...(
      renderPayload
        ?.settings ||
      {}
    ),

    referenceImages,
  };


  /**
   * =========================
   * 5. Firestore 저장
   * =========================
   */

  const projectRef =
    doc(
      db,
      "projects",
      projectId
    );


  const firestoreData =
    removeUndefined({

      title:
        project?.title ||
        "",

      keywords:
        project?.keywords ||
        {},

      stageType:
        project?.stageType ||
        null,

      /**
       * 에디터에서 배치한 소품
       */
      canvasObjects:
        Array.isArray(
          objects
        )
          ? objects
          : [],


      /**
       * 상세 페이지 설정값
       */
      renderSettings:
        savedRenderSettings,


      /**
       * 결과 페이지에서 바로 사용
       */
      renderResults:
        savedResults,


      notes:
        project?.notes ||
        "",


      /**
       * 가장 최근 AI 렌더 정보
       */
      latestRender: {

        id:
          renderId,

        storageProvider:
          "cloudinary",

        generatedAt:
          apiResponse
            ?.generatedAt ||
          new Date()
            .toISOString(),


        results: {

          front: {
            url:
              front.url,

            publicId:
              front.publicId,

            width:
              front.width,

            height:
              front.height,
          },

          side: {
            url:
              side.url,

            publicId:
              side.publicId,

            width:
              side.width,

            height:
              side.height,
          },

          top: {
            url:
              top.url,

            publicId:
              top.publicId,

            width:
              top.width,

            height:
              top.height,
          },
        },


        inputs: {

          composition:
            composition
              ? {
                  url:
                    composition.url,

                  publicId:
                    composition.publicId,
                }
              : null,


          stageType:
            stageType
              ? {
                  url:
                    stageType.url,

                  publicId:
                    stageType.publicId,
                }
              : null,


          referenceImages,
        },


        /**
         * OpenAI 렌더 Prompt 기록
         */
        prompts:
          apiResponse
            ?.prompts ||
          {},


        /**
         * 렌더 당시 프로젝트 정보
         */
        projectSnapshot:
          renderPayload
            ?.project ||
          {},


        /**
         * 렌더 당시 상세페이지 정보
         */
        settingsSnapshot:
          savedRenderSettings,


        /**
         * 렌더 당시 콜라주 정보
         */
        objectsSnapshot:
          Array.isArray(
            renderPayload?.objects
          )
            ? renderPayload.objects
            : [],
      },
    });


  await setDoc(
    projectRef,

    {
      ...firestoreData,

      updatedAt:
        serverTimestamp(),
    },

    {
      merge: true,
    }
  );


  console.log(
    `[PROPICK] ${renderId} 저장 완료`
  );


  /**
   * App.jsx에서 기존처럼
   * saveCompleteRenderProject 결과를 사용할 수 있도록
   * 같은 구조 유지
   */
  return {

    renderId,

    results:
      savedResults,

    renderSettings:
      savedRenderSettings,

    latestRender: {

      id:
        renderId,

      storageProvider:
        "cloudinary",

      generatedAt:
        apiResponse
          ?.generatedAt ||
        new Date()
          .toISOString(),

      inputs: {

        compositionUrl:
          composition?.url ||
          null,

        stageTypeUrl:
          stageType?.url ||
          null,

        referenceImages,
      },
    },
  };
}