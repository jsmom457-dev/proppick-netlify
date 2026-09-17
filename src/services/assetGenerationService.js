const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:3001");

export async function generateCategoryAssets({
  projectId,
  categoryId,
  keywords,
}) {
  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/assets/generate-category`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          categoryId,
          keywords,
        }),
      }
    );
  } catch (error) {
    throw new Error(
      "AI 생성 서버에 연결할 수 없습니다. npm run server가 실행 중인지 확인해주세요."
    );
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.detail ||
        result.error ||
        "소품 이미지 생성에 실패했습니다."
    );
  }

  return result;
}