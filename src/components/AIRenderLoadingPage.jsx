import { useEffect, useState } from "react";

const MESSAGES = [
  "선택한 콘셉트를 분석하고 있어요",
  "무대 구성을 렌더링하고 있어요",
  "다른 시점의 무대를 생성하고 있어요",
  "결과 이미지를 정리하고 있어요",
];

export default function AIRenderLoadingPage({ projectTitle = "" }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((current) =>
        current < MESSAGES.length - 1 ? current + 1 : current
      );
    }, 7000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div style={styles.page} role="status" aria-live="polite" aria-busy="true">
      <style>{`
        @keyframes proppick-render-dot {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-9px); }
        }
        @keyframes proppick-render-fade {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .proppick-render-dot { animation: none !important; }
          .proppick-render-message { animation: none !important; }
        }
      `}</style>

      <div style={styles.content}>
        {projectTitle ? (
          <div style={styles.projectName}>{projectTitle}</div>
        ) : null}

        <div style={styles.dots} aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className="proppick-render-dot"
              style={{
                ...styles.dot,
                animationDelay: `${index * 0.14}s`,
              }}
            />
          ))}
        </div>

        <h1 style={styles.title}>무대를 생성하고 있어요</h1>

        <p
          key={messageIndex}
          className="proppick-render-message"
          style={styles.message}
        >
          {MESSAGES[messageIndex]}
        </p>

        <div style={styles.divider} />
        <div style={styles.renderingLabel}>AI RENDERING</div>
        <p style={styles.notice}>
          생성이 완료되면 결과 화면으로 자동 이동합니다.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    backgroundColor: "#F5F5F5",
    color: "#1A1A22",
    fontFamily: "'Pretendard', sans-serif",
  },
  content: {
    width: "100%",
    maxWidth: 520,
    textAlign: "center",
  },
  projectName: {
    marginBottom: 52,
    color: "#8A8A91",
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.02em",
  },
  dots: {
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 28,
  },
  dot: {
    display: "block",
    width: 9,
    height: 9,
    borderRadius: "50%",
    backgroundColor: "#5B6CFF",
    animation: "proppick-render-dot 1.25s ease-in-out infinite",
  },
  title: {
    margin: 0,
    fontSize: 26,
    lineHeight: 1.35,
    fontWeight: 700,
    letterSpacing: "-0.03em",
  },
  message: {
    minHeight: 24,
    margin: "14px 0 0",
    color: "#6F6F76",
    fontSize: 15,
    lineHeight: 1.6,
    fontWeight: 400,
    animation: "proppick-render-fade 0.35s ease-out",
  },
  divider: {
    width: 28,
    height: 1,
    margin: "34px auto 18px",
    backgroundColor: "#D7D7DA",
  },
  renderingLabel: {
    color: "#9A9AA0",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.18em",
  },
  notice: {
    margin: "10px 0 0",
    color: "#AAAAAF",
    fontSize: 12,
    lineHeight: 1.5,
  },
};
