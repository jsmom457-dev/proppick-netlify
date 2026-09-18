const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:3001");

export async function renderStageWithAI(payload) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/render-stage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(
      `AI 렌더 서버에 연결할 수 없습니다. 서버가 ${API_BASE_URL || "현재 사이트"}에서 실행 중인지 확인해주세요.`
    );
  }

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.error || `AI 무대 렌더링에 실패했습니다. (${response.status})`
    );
  }

  return data;
}