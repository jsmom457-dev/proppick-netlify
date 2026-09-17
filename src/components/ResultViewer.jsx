import { useState } from "react";

export default function ResultViewer({ results }) {
  const [activeView, setActiveView] = useState("front");

  const views = [
    { id: "front", title: "메인 앵글", label: "front" },
    { id: "side", title: "사이드 앵글", label: "side" },
    { id: "top", title: "탑 뷰", label: "top" },
  ];

  return (
    <div style={styles.wrap}>
      <div style={styles.mainImageWrap}>
        <img src={results[activeView]} alt={activeView} style={styles.mainImage} />
      </div>

      <aside style={styles.sideList}>
        {views.map((view) => (
          <button
            key={view.id}
            style={{
              ...styles.viewCard,
              ...(activeView === view.id ? styles.viewCardActive : {}),
            }}
            onClick={() => setActiveView(view.id)}
          >
            <img src={results[view.id]} alt={view.title} style={styles.thumb} />
            <p style={styles.viewTitle}>{view.title}</p>
            <p style={styles.viewLabel}>{view.label}</p>
          </button>
        ))}
      </aside>

      <p style={styles.caption}>클릭하여 상세 보기</p>
      <p style={styles.count}>{views.findIndex((v) => v.id === activeView) + 1} / 3</p>
    </div>
  );
}

const styles = {
  wrap: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1fr 168px",
    gap: 20,
  },
  mainImageWrap: {
    width: 1256,
    height: 688,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F5F6F8",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  sideList: {
    width: 168,
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  viewCard: {
    width: 168,
    height: 188,
    border: "1px solid transparent",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 0,
    cursor: "pointer",
  },
  viewCardActive: {
    borderColor: "#5B6CFF",
  },
  thumb: {
    width: 168,
    height: 116,
    borderRadius: 8,
    objectFit: "cover",
    backgroundColor: "#F5F6F8",
  },
  viewTitle: {
    margin: "12px 0 0",
    fontSize: 16,
    color: "#1A1A22",
    textAlign: "center",
  },
  viewLabel: {
    margin: "4px 0 0",
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  caption: {
    position: "absolute",
    left: 0,
    top: 704,
    fontSize: 16,
    color: "#1A1A22",
  },
  count: {
    position: "absolute",
    left: 1150,
    top: 704,
    fontSize: 16,
    color: "#1A1A22",
  },
};