# PROPICK Netlify deployment

Netlify > Project configuration > Environment variables 에 다음 값을 등록하세요.

- OPENAI_API_KEY
- VITE_CLOUDINARY_CLOUD_NAME
- VITE_CLOUDINARY_UPLOAD_PRESET

`SERVER_PORT`는 로컬 개발용입니다. Netlify 배포에서는 필요하지 않습니다.

이 프로젝트에는 `netlify.toml`이 포함되어 있으므로 Build command는 `npm run build`, Publish directory는 `dist`, Functions directory는 `netlify/functions`로 자동 설정됩니다.

로컬 개발은 `.env.example`을 복사해 `.env`를 만든 뒤 기존처럼 `npm install`, `npm run dev:all`을 사용합니다.

주의: 최종 무대 렌더는 여러 번의 이미지 생성/편집 호출을 수행합니다. Netlify 동기 Function 제한을 넘는 렌더는 별도 장시간 실행 백엔드 또는 API 분리가 필요할 수 있습니다.
