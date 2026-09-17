export default function Chip({
  label,
  active = false,
  summary = false,
  variant = "keyword",
  onClick,
}) {
  let chipStyle = styles.keyword;

  if (variant === "project") {
    chipStyle = styles.project;
  }

  if (variant === "workspace") {
    chipStyle = styles.workspace;
  }

  if (active) {
    chipStyle = styles.active;
  }

  if (summary) {
    chipStyle = styles.summary;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        ...styles.base,
        ...chipStyle,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {label}
    </button>
  );
}

const styles = {
  base: {
    padding: "8px 12px",
    borderRadius: 12,
    borderWidth: 0.8,
    borderStyle: "solid",
    fontFamily: "'Pretendard', sans-serif",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
  },

  keyword: {
    backgroundColor: "#F3F3F3",
    borderColor: "#F3F3F3",
    color: "#1A1A22",
  },

  active: {
    backgroundColor: "#5B6CFF",
    borderColor: "#5B6CFF",
    color: "#FFFFFF",
  },

  summary: {
    padding: "6px 12px",
    backgroundColor: "#D8E6FF",
    borderColor: "#5B6CFF",
    color: "#1A1A22",
    fontSize: 14,
  },

  project: {
    padding: "6px 12px",
    borderColor: "#B0B3C0",
    backgroundColor: "#FFFFFF",
    color: "#1A1A22",
    fontSize: 12,
  },

  workspace: {
    padding: "6px 18px",
    borderColor: "#D8E6FF",
    backgroundColor: "#D8E6FF",
    color: "#1A1A22",
    fontSize: 14,
  },
};