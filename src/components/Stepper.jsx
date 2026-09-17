import { Check } from "lucide-react";

const steps = [
  "프로젝트명",
  "공간",
  "분위기",
  "조형 스타일",
  "세계관",
  "무대 형태",
];

export default function Stepper({ currentStep }) {
  return (
    <div style={styles.wrapper}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;

        const completed = stepNumber < currentStep;
        const active = stepNumber === currentStep;
        const lineActive = stepNumber < currentStep;

        return (
          <div key={step} style={styles.stepGroup}>
            <div style={styles.stepItem}>
              <div
                style={{
                  ...styles.circle,

                  ...(completed
                    ? styles.completedCircle
                    : {}),

                  ...(active
                    ? styles.activeCircle
                    : {}),
                }}
              >
                {completed ? (
                  <Check
                    size={22}
                    strokeWidth={2.5}
                    color="#5B6CFF"
                  />
                ) : (
                  stepNumber
                )}
              </div>

              <div
                style={{
                  ...styles.label,

                  ...(completed
                    ? styles.completedLabel
                    : {}),

                  ...(active
                    ? styles.activeLabel
                    : {}),
                }}
              >
                {step}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div
                style={{
                  ...styles.line,

                  ...(lineActive
                    ? styles.activeLine
                    : {}),
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 18,

    marginTop: 48,
    marginBottom: 48,
  },

  stepGroup: {
    display: "flex",
    alignItems: "center",
    gap: 18,
  },

  stepItem: {
    width: 88,

    display: "flex",
    flexDirection: "column",
    alignItems: "center",

    gap: 10,
  },

  // 기본 상태
  circle: {
    width: 48,
    height: 48,

    borderRadius: "50%",

    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontFamily: "'Pretendard', sans-serif",
    fontSize: 20,
    fontWeight: 500,
  },

  // 완료된 단계
  completedCircle: {
    backgroundColor: "#D8E6FF",
    color: "#5B6CFF",
  },

  // 현재 단계
  activeCircle: {
    backgroundColor: "#5B6CFF",
    color: "#FFFFFF",
  },

  // 기본 라벨
  label: {
    fontFamily: "'Pretendard', sans-serif",
    fontSize: 16,
    fontWeight: 500,

    color: "#666666",

    whiteSpace: "nowrap",
  },

  // 완료된 단계 라벨
  completedLabel: {
    color: "#1A1A22",
  },

  // 현재 단계 라벨
  activeLabel: {
    color: "#1A1A22",
  },

  // 기본 연결선
  line: {
    width: 74,
    height: 2,

    backgroundColor: "#F3F3F3",

    marginTop: -28,
  },

  // 완료된 연결선
  activeLine: {
    backgroundColor: "#5B6CFF",
  },
};