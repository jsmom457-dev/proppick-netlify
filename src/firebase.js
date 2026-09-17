// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDivVZd2o01ufw9pnDErnEXqvu9NgFBmVQ",
  authDomain: "proppick-5c26b.firebaseapp.com",
  projectId: "proppick-5c26b",

  // Firebase Console에서 실제 Storage bucket 주소가 다르면
  // .env의 VITE_FIREBASE_STORAGE_BUCKET 값으로 덮어쓸 수 있습니다.
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "proppick-5c26b.firebasestorage.app",

  messagingSenderId: "86648825051",
  appId: "1:86648825051:web:04ea38b7bedc0f570a18fe",
  measurementId: "G-X6G27SYPQ0",
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const storage = getStorage(app);

/**
 * Firebase 프로젝트 생성 시점에 따라
 * Storage bucket 주소가 두 형식 중 하나일 수 있습니다.
 *
 * - project-id.firebasestorage.app
 * - project-id.appspot.com
 *
 * 저장할 때 실제 동작하는 bucket을 자동 확인하기 위해 사용합니다.
 */
export function getFirebaseStorageBucketCandidates() {
  const projectId = firebaseConfig.projectId;

  return [
    firebaseConfig.storageBucket,
    `${projectId}.firebasestorage.app`,
    `${projectId}.appspot.com`,
  ].filter(
    (bucket, index, array) =>
      bucket && array.indexOf(bucket) === index
  );
}

export { firebaseConfig };

export default app;