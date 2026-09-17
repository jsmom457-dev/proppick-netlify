export async function imageUrlToDataUrl(url) {
  if (!url) return null;

  if (url.startsWith("data:image/")) {
    return url;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `이미지를 불러오지 못했습니다: ${url}`
    );
  }

  const blob = await response.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () =>
      resolve(reader.result);

    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
}
