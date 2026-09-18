const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:3001");


async function postRenderRequest(path, payload) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[AI Render] Network error:", error);

    throw new Error(
      "AI 렌더 서버에 연결할 수 없습니다."
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
      data?.error ||
      `AI 무대 렌더링에 실패했습니다. (${response.status})`
    );
  }

  return data;
}


export async function renderStageWithAI(payload) {
  console.log("[AI Render] 1/3 FRONT 요청 시작");

  /*
   * 1. FRONT
   */
  const frontData = await postRenderRequest(
    "/api/render-stage/front",
    payload
  );

  const front = frontData?.result;

  if (!front) {
    throw new Error(
      "Front 이미지가 반환되지 않았습니다."
    );
  }

  console.log("[AI Render] 1/3 FRONT 완료");


  /*
   * 2. SIDE / TOP
   *
   * Front가 완성된 후,
   * Side와 Top은 각각 별도 HTTP 요청으로 실행합니다.
   */
  console.log("[AI Render] 2/3 SIDE 요청 시작");
  console.log("[AI Render] 3/3 TOP 요청 시작");

  const [sideData, topData] = await Promise.all([
    postRenderRequest(
      "/api/render-stage/side",
      {
        ...payload,
        frontImage: front,
      }
    ),

    postRenderRequest(
      "/api/render-stage/top",
      {
        ...payload,
        frontImage: front,
      }
    ),
  ]);

  const side = sideData?.result;
  const top = topData?.result;

  if (!side) {
    throw new Error(
      "Side 이미지가 반환되지 않았습니다."
    );
  }

  if (!top) {
    throw new Error(
      "Top 이미지가 반환되지 않았습니다."
    );
  }

  console.log("[AI Render] SIDE 완료");
  console.log("[AI Render] TOP 완료");
  console.log("[AI Render] 전체 렌더 완료");

  /*
   * 기존 화면 코드가 기대하는 데이터 형태 유지
   */
  return {
    results: {
      front,
      side,
      top,
    },

    prompts: {
      front: frontData?.prompt || "",
      side: sideData?.prompt || "",
      top: topData?.prompt || "",
    },

    generatedAt: new Date().toISOString(),
  };
}