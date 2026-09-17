import { useState } from "react";

function getViewImage(asset, view) {
  const viewData = asset?.views?.[view];

  if (!viewData) {
    return "";
  }

  if (viewData.imageUrl) {
    return viewData.imageUrl;
  }

  if (viewData.base64) {
    return `data:image/png;base64,${viewData.base64}`;
  }

  return "";
}

export default function GeneratedAssetCard({
  asset,
  onAddToCanvas,
}) {
  const [selectedView, setSelectedView] =
    useState("front");

  const selectedImage =
    getViewImage(asset, selectedView);

  const displayName =
    asset?.koreanName ||
    asset?.name ||
    "이름 없는 소품";

  const handleAdd = () => {
    if (!selectedImage) {
      return;
    }

    onAddToCanvas?.({
      assetGroupId: asset.id,
      categoryId: asset.categoryId,
      name: displayName,
      imageUrl: selectedImage,
      selectedView,
    });
  };

  return (
    <article style={styles.card}>
      <button
        type="button"
        style={{
          ...styles.imageButton,
          cursor: selectedImage
            ? "pointer"
            : "not-allowed",
        }}
        disabled={!selectedImage}
        onClick={handleAdd}
      >
        {selectedImage ? (
          <img
            src={selectedImage}
            alt={displayName}
            style={styles.image}
          />
        ) : (
          <span style={styles.placeholder}>
            이미지 없음
          </span>
        )}
      </button>

      <div style={styles.content}>
        <p style={styles.name}>{displayName}</p>

        <div style={styles.viewTabs}>
          <button
            type="button"
            onClick={() =>
              setSelectedView("front")
            }
            style={{
              ...styles.viewButton,
              ...(selectedView === "front"
                ? styles.viewButtonActive
                : {}),
            }}
          >
            정면
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedView("perspective")
            }
            style={{
              ...styles.viewButton,
              ...(selectedView === "perspective"
                ? styles.viewButtonActive
                : {}),
            }}
          >
            원근
          </button>
        </div>
      </div>
    </article>
  );
}

const styles = {
  card: {
    width: 100,
    backgroundColor: "#FFFFFF",
  },

  imageButton: {
    width: 100,
    height: 100,
    padding: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },

  placeholder: {
    fontSize: 11,
    color: "#999999",
  },

  content: {
    marginTop: 6,
  },

  name: {
    margin: 0,
    fontSize: 12,
    lineHeight: "16px",
    color: "#666666",
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  viewTabs: {
    marginTop: 5,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
  },

  viewButton: {
    height: 22,
    padding: 0,
    borderRadius: 5,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    color: "#666666",
    fontSize: 10,
    cursor: "pointer",
  },

  viewButtonActive: {
    borderColor: "#5B6CFF",
    backgroundColor: "#D8E6FF",
    color: "#1A1A22",
  },
};