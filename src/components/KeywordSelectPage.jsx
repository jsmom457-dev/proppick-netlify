import {
  ArrowLeft,
  ArrowRight,
  Hash,
} from "lucide-react";

import TopBar from "./TopBar";
import Stepper from "./Stepper";
import Chip from "./Chip";
import Button from "./Button";
import KeywordOption from "./KeywordOption";

export default function KeywordSelectPage({
  step,
  title,
  description,

  options = [],

  selected = "",
  selectedSummary = [],

  multiple = false,
  optional = false,

  onSelect,
  onPrev,
  onNext,
}) {
  const selectedValues =
    multiple && Array.isArray(selected)
      ? selected
      : [];

  const isSelected = (option) => {
    if (multiple) {
      return selectedValues.includes(option);
    }

    return selected === option;
  };

  const canNext = optional
    ? true
    : multiple
      ? selectedValues.length > 0
      : Boolean(selected);

  return (
    <div style={styles.page}>
      <TopBar />

      <Stepper currentStep={step} />

      {/* 키워드 선택 카드 */}
      <main style={styles.card}>
        <section style={styles.heading}>
          <h1 style={styles.title}>
            {title}
          </h1>

          <p style={styles.description}>
            {description}
          </p>
        </section>

        <div style={styles.keywordGrid}>
          {options.map((option) => (
            <KeywordOption
              key={option}
              label={option}
              active={isSelected(option)}
              onClick={() =>
                onSelect?.(option)
              }
            />
          ))}
        </div>
      </main>

      {/* 선택된 키워드 */}
      <section style={styles.selectedBox}>
        <div style={styles.selectedTitle}>
          <Hash
            size={16}
            strokeWidth={2}
          />

          <span>
            선택된 키워드
          </span>
        </div>

        {selectedSummary.length > 0 && (
          <div style={styles.selectedList}>
            {selectedSummary.map((item) => (
              <Chip
                key={item}
                label={item}
                summary
              />
            ))}
          </div>
        )}
      </section>

      {/* 이전 / 다음 */}
      <div style={styles.nav}>
        <Button
          variant="secondary"
          onClick={onPrev}
          icon={
            <ArrowLeft size={20} />
          }
        >
          이전
        </Button>

        <Button
          onClick={onNext}
          disabled={!canNext}
          icon={
            <ArrowRight size={20} />
          }
        >
          다음
        </Button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",

    backgroundColor: "#FFFFFF",

    fontFamily:
      "'Pretendard', sans-serif",

    color: "#1A1A22",

    overflowX: "hidden",
  },

  /*
   * Figma
   * x: 274
   * width: 964
   * height: 349
   */
  card: {
    width:
      "min(964px, calc(100% - 48px))",

    minHeight: 349,

    margin: "0 auto",

    borderRadius: 12,

    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",

    backgroundColor: "#FFFFFF",

    padding: "28px 40px 40px",

    boxSizing: "border-box",
  },

  heading: {
    width: "100%",
  },

  title: {
    margin: 0,

    fontSize: 24,
    fontWeight: 600,
    lineHeight: "29px",

    color: "#1A1A22",
  },

  description: {
    margin: "8px 0 0",

    fontSize: 16,
    fontWeight: 400,
    lineHeight: "19px",

    color: "#1A1A22",
  },

  /*
   * Figma 카드
   * 270px × 90px
   *
   * 3 column
   * horizontal gap ≈ 24px
   * vertical gap = 16px
   */
  keywordGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",

    columnGap: 24,
    rowGap: 16,

    marginTop: 28,
  },

  /*
   * Figma
   * width: 964
   * height: 88
   */
  selectedBox: {
    width:
      "min(964px, calc(100% - 48px))",

    minHeight: 88,

    margin: "16px auto 0",

    borderRadius: 12,

    backgroundColor: "#F6F7FF",

    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",

    padding: "10px 14px 12px",

    boxSizing: "border-box",
  },

  selectedTitle: {
    height: 18,

    display: "flex",
    alignItems: "center",

    gap: 8,

    fontSize: 14,
    fontWeight: 400,

    lineHeight: "17px",

    color: "#666666",
  },

  selectedList: {
    display: "flex",
    alignItems: "center",

    flexWrap: "wrap",

    gap: 8,

    marginTop: 12,
  },

  nav: {
    width:
      "min(964px, calc(100% - 48px))",

    margin: "26px auto 56px",

    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",
  },
};