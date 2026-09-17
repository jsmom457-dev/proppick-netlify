import { ArrowLeft, ArrowRight, Hash } from "lucide-react";
import TopBar from "./TopBar";
import Stepper from "./Stepper";
import Chip from "./Chip";
import Button from "./Button";
import { stageTypes } from "../data";

export default function StageTypeSelectPage({
  selectedStageType,
  selectedSummary = [],
  onSelect,
  onPrev,
  onNext,
  onLogoClick,
}) {
  const canNext = Boolean(selectedStageType);

  return (
    <div style={styles.page}>
      <TopBar onLogoClick={onLogoClick} />
      <Stepper currentStep={6} />

      <main style={styles.card}>
        <div>
          <h1 style={styles.title}>무대 형태를 선택해주세요</h1>
          <p style={styles.desc}>무대의 구조와 형태를 선택하세요.</p>
        </div>

        <div style={styles.grid}>
          {stageTypes.map((type) => {
            const selected = selectedStageType?.id === type.id;

            return (
              <button
                key={type.id}
                onClick={() => onSelect(type)}
                style={{
                  ...styles.stageCard,
                  ...(selected ? styles.stageCardSelected : {}),
                }}
              >
                <img src={type.imageUrl} alt={type.name} style={styles.stageImage} />

                <div style={styles.stageInfo}>
                  <p style={styles.stageTitle}>{type.name}</p>
                  <p style={styles.stageDesc}>{type.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      <section style={styles.selectedBox}>
        <div style={styles.selectedTitle}>
          <Hash size={16} />
          선택된 키워드
        </div>

        <div style={styles.selectedList}>
          {selectedSummary.map((item) => (
            <Chip key={item} label={item} summary />
          ))}
        </div>
      </section>

      <div style={styles.nav}>
        <Button variant="secondary" onClick={onPrev} icon={<ArrowLeft size={20} />}>
          이전
        </Button>

        <Button onClick={onNext} disabled={!canNext} icon={<ArrowRight size={20} />}>
          다음
        </Button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100vw",
    minHeight: "100vh",
    backgroundColor: "#FFFFFF",
    color: "#1A1A22",
    fontFamily: "Pretendard, sans-serif",
    overflowX: "hidden",
  },
  card: {
    width: "63.75vw",
    maxWidth: 964,
    minWidth: 964,
    height: 606,
    margin: "0 auto",
    padding: "36px 40px",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",
    boxSizing: "border-box",
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
    lineHeight: "29px",
    color: "#1A1A22",
    textAlign: "left",
  },
  desc: {
    margin: "8px 0 0",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: "19px",
    color: "#666666",
    textAlign: "left",
  },
  grid: {
    marginTop: 24,
    display: "grid",
    gridTemplateColumns: "repeat(3, 286px)",
    gap: "12px 14px",
  },
  stageCard: {
    width: 286,
    height: 228,
    padding: 0,
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    cursor: "pointer",
    textAlign: "left",
    boxSizing: "border-box",
  },
  stageCardSelected: {
    borderColor: "#5B6CFF",
    boxShadow: "0 0 0 2px #5B6CFF inset",
  },
  stageImage: {
    width: 286,
    height: 161,
    objectFit: "cover",
    display: "block",
    backgroundColor: "#F5F6F8",
  },
  stageInfo: {
    padding: "12px",
  },
  stageTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 500,
    lineHeight: "19px",
    color: "#1A1A22",
    textAlign: "left",
  },
  stageDesc: {
    margin: "4px 0 0",
    fontSize: 14,
    fontWeight: 400,
    lineHeight: "17px",
    color: "#666666",
    textAlign: "left",
  },
  selectedBox: {
    width: "63.75vw",
    maxWidth: 964,
    minWidth: 964,
    height: 88,
    margin: "16px auto 0",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",
    backgroundColor: "#F6F7FF",
    padding: "12px 15px",
    boxSizing: "border-box",
  },
  selectedTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 400,
    color: "#6B7280",
  },
  selectedList: {
    marginTop: 12,
    display: "flex",
    gap: 8,
  },
  nav: {
    width: "63.75vw",
    maxWidth: 964,
    minWidth: 964,
    margin: "26px auto 56px",
    display: "flex",
    justifyContent: "space-between",
  },
};