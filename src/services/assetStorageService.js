import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { db, storage } from "../firebase";

function base64ToBlob(
  base64,
  mimeType = "image/png"
) {
  const byteCharacters = atob(base64);

  const byteNumbers = new Array(
    byteCharacters.length
  );

  for (
    let index = 0;
    index < byteCharacters.length;
    index += 1
  ) {
    byteNumbers[index] =
      byteCharacters.charCodeAt(index);
  }

  return new Blob(
    [new Uint8Array(byteNumbers)],
    {
      type: mimeType,
    }
  );
}

async function uploadAssetView({
  projectId,
  assetGroupId,
  view,
  base64,
}) {
  const blob = base64ToBlob(base64);

  const storagePath =
    `projects/${projectId}/generated-assets/` +
    `${assetGroupId}/${view}.png`;

  const storageRef = ref(
    storage,
    storagePath
  );

  await uploadBytes(storageRef, blob, {
    contentType: "image/png",
  });

  const imageUrl =
    await getDownloadURL(storageRef);

  return {
    imageUrl,
    storagePath,
  };
}

export async function saveGeneratedAssetGroup({
  projectId,
  assetGroup,
}) {
  const [front, perspective] =
    await Promise.all([
      uploadAssetView({
        projectId,
        assetGroupId: assetGroup.id,
        view: "front",
        base64:
          assetGroup.views.front.base64,
      }),

      uploadAssetView({
        projectId,
        assetGroupId: assetGroup.id,
        view: "perspective",
        base64:
          assetGroup.views.perspective
            .base64,
      }),
    ]);

  const savedAsset = {
    id: assetGroup.id,
    projectId,

    categoryId:
      assetGroup.categoryId,

    categoryName:
      assetGroup.categoryName,

    name:
      assetGroup.name,

    koreanName:
      assetGroup.koreanName,

    description:
      assetGroup.description,

    keywords:
      assetGroup.keywords,

    views: {
      front: {
        ...front,
        prompt:
          assetGroup.views.front.prompt,
      },

      perspective: {
        ...perspective,
        prompt:
          assetGroup.views.perspective
            .prompt,
      },
    },

    createdAt:
      serverTimestamp(),
  };

  const assetRef = doc(
    collection(
      db,
      "projects",
      projectId,
      "generatedAssets"
    ),
    assetGroup.id
  );

  await setDoc(assetRef, savedAsset);

  return {
    ...savedAsset,
    createdAt:
      new Date().toISOString(),
  };
}

export async function saveGeneratedAssetGroups({
  projectId,
  assetGroups,
}) {
  return Promise.all(
    assetGroups.map((assetGroup) =>
      saveGeneratedAssetGroup({
        projectId,
        assetGroup,
      })
    )
  );
}