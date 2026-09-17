import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";

import "./index.css";


/*
 * ==========================================
 * GLOBAL MOUSE FOCUS PREVENTION
 * ==========================================
 *
 * 버튼을 마우스로 클릭했을 때 브라우저가
 * focus ring / 검정 outline을 남기는 현상을 방지합니다.
 *
 * 키보드 Tab 접근은 그대로 사용할 수 있고,
 * 마우스/펜으로 눌렀을 때만 focus 생성을 막습니다.
 */

document.addEventListener(
  "pointerdown",
  (event) => {
    const interactive =
      event.target.closest(
        `
        button,
        [role="button"],
        input[type="button"],
        input[type="submit"],
        input[type="reset"]
        `
      );


    if (!interactive) {
      return;
    }


    /*
     * 마우스 또는 펜 클릭일 때만
     * 기본 focus 동작 방지
     */

    if (
      event.pointerType === "mouse" ||
      event.pointerType === "pen"
    ) {
      event.preventDefault();
    }
  }
);


ReactDOM
  .createRoot(
    document.getElementById(
      "root"
    )
  )
  .render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );