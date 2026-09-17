import { GripVertical } from "lucide-react";

export default function LayerItem({
  object,
  selected = false,
  dragging = false,
  onSelect,
  onPointerDown,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onSelect?.();
        }
      }}
      style={{
        ...styles.item,
        ...(selected ? styles.selected : {}),
        ...(dragging ? styles.dragging : {}),
      }}
    >
      <img
        src={object.imageUrl}
        alt={object.name}
        style={styles.thumb}
        draggable={false}
      />

      <span style={styles.name}>
        {object.name}
      </span>

      <button
        type="button"
        aria-label="레이어 순서 변경"
        style={styles.dragHandle}
        onPointerDown={(event) => {
          event.stopPropagation();
          onPointerDown?.(event);
        }}
      >
        <GripVertical
          size={16}
          strokeWidth={1.8}
        />
      </button>
    </div>
  );
}

const styles = {
  item: {
    width: "100%",
    minHeight: 35,

    padding: "4px 8px",

    borderRadius: 8,

    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",

    backgroundColor: "#FFFFFF",

    display: "flex",
    alignItems: "center",

    gap: 8,

    boxSizing: "border-box",

    userSelect: "none",
  },

  selected: {
    backgroundColor: "#D8E6FF",
    borderColor: "#5B6CFF",
  },

  dragging: {
    opacity: 0.55,
  },

  thumb: {
    width: 26,
    height: 26,

    borderRadius: 4,

    objectFit: "contain",

    backgroundColor: "#F5F6F8",

    flexShrink: 0,

    pointerEvents: "none",
  },

  name: {
    minWidth: 0,
    flex: 1,

    fontSize: 12,

    color: "#1A1A22",

    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",

    pointerEvents: "none",
  },

  dragHandle: {
    width: 26,
    height: 26,

    padding: 0,

    border: "none",

    backgroundColor: "transparent",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    color: "#666666",

    cursor: "grab",

    touchAction: "none",

    flexShrink: 0,
  },
};