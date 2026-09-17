import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

const PROJECT_COLLECTION = "projects";

/**
 * 새로운 프로젝트 생성
 */
export async function createProject(projectData) {
  try {
    const docRef = await addDoc(
      collection(db, PROJECT_COLLECTION),
      {
        ...projectData,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    return docRef.id;
  } catch (error) {
    console.error(
      "프로젝트 생성 오류:",
      error
    );

    throw error;
  }
}

/**
 * 프로젝트에 사용된 소품 추가
 */
export async function addUsedAssetToProject({
  projectId,
  asset,
}) {
  if (!projectId) {
    throw new Error(
      "projectId가 없습니다."
    );
  }

  if (!asset) {
    throw new Error(
      "저장할 소품 정보가 없습니다."
    );
  }

  try {
    const projectRef = doc(
      db,
      PROJECT_COLLECTION,
      projectId
    );

    await updateDoc(projectRef, {
      usedAssets: arrayUnion({
        assetGroupId:
          asset.assetGroupId || "",

        categoryId:
          asset.categoryId || "",

        name:
          asset.name || "",

        imageUrl:
          asset.imageUrl || "",

        selectedView:
          asset.selectedView || "front",
      }),

      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(
      "사용 소품 저장 오류:",
      error
    );

    throw error;
  }
}

/**
 * 전체 프로젝트 목록 불러오기
 *
 * 최근 저장/수정된 프로젝트가
 * 가장 먼저 나오도록 updatedAt 내림차순 정렬
 */
export async function getProjects() {
  try {
    const projectsQuery = query(
      collection(
        db,
        PROJECT_COLLECTION
      ),

      orderBy(
        "updatedAt",
        "desc"
      )
    );

    const querySnapshot =
      await getDocs(
        projectsQuery
      );

    return querySnapshot.docs.map(
      (document) => {
        const data =
          document.data();

        return {
          id: document.id,
          ...data,

          /**
           * 메인 페이지에서 사용할 대표 이미지
           *
           * 1순위:
           * renderResults.front
           *
           * 2순위:
           * latestRender.results.front.url
           */
          imageUrl:
            data
              ?.renderResults
              ?.front ||
            data
              ?.latestRender
              ?.results
              ?.front
              ?.url ||
            "",

          /**
           * ProjectListPage에서
           * 사용하기 편하도록 키워드를 배열로도 제공
           */
          keywordList:
            Array.isArray(
              data?.keywords
            )
              ? data.keywords
              : [
                  data
                    ?.keywords
                    ?.space,

                  data
                    ?.keywords
                    ?.mood,

                  data
                    ?.keywords
                    ?.style,

                  data
                    ?.keywords
                    ?.worldview,
                ].filter(Boolean),
        };
      }
    );
  } catch (error) {
    console.error(
      "프로젝트 불러오기 오류:",
      error
    );

    throw error;
  }
}

/**
 * 특정 프로젝트 불러오기
 */
export async function getProject(
  projectId
) {
  if (!projectId) {
    throw new Error(
      "projectId가 없습니다."
    );
  }

  try {
    const projectRef = doc(
      db,
      PROJECT_COLLECTION,
      projectId
    );

    const projectSnapshot =
      await getDoc(
        projectRef
      );

    if (
      !projectSnapshot.exists()
    ) {
      return null;
    }

    return {
      id:
        projectSnapshot.id,

      ...projectSnapshot.data(),
    };
  } catch (error) {
    console.error(
      "프로젝트 상세 불러오기 오류:",
      error
    );

    throw error;
  }
}

/**
 * 프로젝트 정보 수정
 */
export async function updateProject(
  projectId,
  projectData
) {
  if (!projectId) {
    throw new Error(
      "projectId가 없습니다."
    );
  }

  try {
    const projectRef = doc(
      db,
      PROJECT_COLLECTION,
      projectId
    );

    await updateDoc(
      projectRef,
      {
        ...projectData,

        updatedAt:
          serverTimestamp(),
      }
    );
  } catch (error) {
    console.error(
      "프로젝트 수정 오류:",
      error
    );

    throw error;
  }
}