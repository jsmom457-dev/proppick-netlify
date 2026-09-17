# PROPICK 전시 실행 메모

## 권장
- 전시장 iMac의 macOS를 임의 변경하지 말고 졸준위/업체 승인 절차를 따르세요.
- 가능하면 개인 노트북에서 Chrome/Edge 최신 버전으로 PROPICK을 실행하고 iMac은 영상/보조 디스플레이로 쓰는 구성이 가장 안전합니다.
- iMac을 직접 쓸 경우 OS 업데이트가 허가된 뒤, 해당 iMac이 지원하는 범위에서 최신 macOS + 최신 브라우저로 올린 다음 실제 전시 네트워크에서 사전 테스트하세요.

## Sierra 10.12.6 그대로일 때
- Safari 12.1.2까지 제공되지만 현재 프로젝트의 Vite 8 기본 production target은 Safari 16.4 이상입니다.
- 따라서 현재 구성 그대로의 production build를 Sierra Safari에서 안정적으로 지원한다고 볼 수 없습니다.
- Firebase/Cloudinary/OpenAI 서버 통신은 인터넷 연결과 브라우저의 TLS/CORS/JS 지원 상태에도 영향을 받습니다.

## 실행
1. `npm install`
2. 프론트: `npm run dev`
3. AI 렌더까지 사용: 별도 터미널에서 `npm run server` 또는 `npm run dev:all`
4. `.env`의 Firebase/Cloudinary/OpenAI 관련 설정을 유지합니다.

## 이번 수정
- 에디터 에셋은 Firestore `assetSets`에서 `space + worldview + category` 조합으로 읽습니다.
- AI 소품 생성 버튼을 제거했습니다.
- 레이어 이름은 좌측 에셋 목록의 이름과 동일한 이름을 사용합니다.
- 최종 AI 렌더 저장 로직은 기존대로 유지합니다. 결과 Front/Side/Top은 Cloudinary URL로 변환 후 Firestore에 저장됩니다.
