import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

export default function StageDropdown({
  stageTypes = [],
  selectedStage,
  onSelect,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={styles.wrap}
    >
      <button
        type="button"
        style={styles.trigger}
        onClick={() =>
          setOpen((previous) => !previous)
        }
      >
        <span>
          {selectedStage?.shortName || "Stage"}
        </span>

        {open ? (
          <ChevronUp size={20} />
        ) : (
          <ChevronDown size={20} />
        )}
      </button>

      {open && (
        <div style={styles.menu}>
          <div style={styles.scrollArea}>
            {stageTypes.map((stage) => {
              const selected =
                selectedStage?.id === stage.id;

              return (
                <button
                  key={stage.id}
                  type="button"
                  style={{
                    ...styles.option,
                    ...(selected
                      ? styles.optionSelected
                      : {}),
                  }}
                  onClick={() => {
                    onSelect?.(stage);
                    setOpen(false);
                  }}
                >
                  <img
                    src={stage.imageUrl}
                    alt={stage.name}
                    style={styles.thumb}
                  />

                  <div style={styles.optionText}>
                    <p style={styles.optionTitle}>
                      {stage.shortName ||
                        stage.name}
                    </p>

                    <p style={styles.optionDesc}>
                      {stage.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    position: "relative",
  },

  trigger: {
    minWidth: 128,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "10px 16px",
    fontFamily: "'Pretendard', sans-serif",
    fontSize: 18,
    color: "#1A1A22",
    cursor: "pointer",
  },

  menu: {
    position: "absolute",
    top: 54,
    right: 0,
    width: 340,
    maxHeight: 325,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    zIndex: 200,
    boxSizing: "border-box",
    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
  },

  scrollArea: {
    maxHeight: 299,
    overflowY: "auto",
  },

  option: {
    width: "100%",
    minHeight: 64,
    padding: 8,
    border: "none",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    textAlign: "left",
  },

  optionSelected: {
    backgroundColor: "#F5F6F8",
  },

  thumb: {
    width: 72,
    height: 48,
    borderRadius: 6,
    objectFit: "cover",
    backgroundColor: "#F5F6F8",
    flexShrink: 0,
  },

  optionText: {
    minWidth: 0,
  },

  optionTitle: {
    margin: 0,
    fontSize: 14,
    color: "#1A1A22",
  },

  optionDesc: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "#666666",
  },
};