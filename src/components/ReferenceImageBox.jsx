import { Plus, X } from "lucide-react";
import { useState } from "react";

export default function ReferenceImageBox({ images, onAdd, onRemove }) {
  const [hoveredId, setHoveredId] = useState(null);

  if (!images.length) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyText}>
          <p style={styles.emptyTitle}>레퍼런스 이미지가 없습니다</p>
          <p style={styles.emptyDesc}>원하는 분위기의 레퍼런스 이미지를 추가하면 AI가 참고하여 생성합니다</p>
        </div>

        <button style={styles.addButton} onClick={onAdd}>
          <Plus size={20} />
          이미지 추가
        </button>
      </div>
    );
  }

  return (
    <div style={styles.imageList}>
      {images.map((image) => (
        <div
          key={image.id}
          style={styles.imageCard}
          onMouseEnter={() => setHoveredId(image.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <img src={image.url} alt="" style={styles.image} />

          {hoveredId === image.id && (
            <button style={styles.removeButton} onClick={() => onRemove(image.id)}>
              <X size={18} />
            </button>
          )}
        </div>
      ))}

      <button style={styles.addButtonSmall} onClick={onAdd}>
        <Plus size={20} />
        이미지 추가
      </button>
    </div>
  );
}

const styles = {
  empty: {
    height: 153,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emptyText: {
    textAlign: "center",
  },
  emptyTitle: {
    margin: 0,
    fontSize: 16,
    color: "#1A1A22",
  },
  emptyDesc: {
    margin: "8px 0 0",
    fontSize: 14,
    color: "#666666",
  },
  addButton: {
    width: 151,
    height: 41,
    borderRadius: 12,
    border: "1px solid #E8E8E8",
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 18,
    color: "#1A1A22",
    cursor: "pointer",
  },
  imageList: {
    display: "flex",
    gap: 24,
    alignItems: "center",
  },
  imageCard: {
    position: "relative",
    width: 128,
    height: 128,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F5F6F8",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#1A1A22",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  addButtonSmall: {
    width: 151,
    height: 41,
    borderRadius: 12,
    border: "1px solid #E8E8E8",
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 18,
    cursor: "pointer",
  },
};