export default function KeywordOption({
  label,
  active = false,
  onClick,
}) {
  const getKeywordParts = (value) => {
    const match = value.match(/^(.*?)\s*\((.*?)\)$/);

    if (!match) {
      return {
        korean: value,
        english: "",
      };
    }

    return {
      korean: match[1].trim(),
      english: match[2].trim(),
    };
  };

  const { korean, english } = getKeywordParts(label);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.button,
        ...(active ? styles.active : {}),
      }}
    >
      <span
        style={{
          ...styles.korean,
          ...(active ? styles.activeText : {}),
        }}
      >
        {korean}
      </span>

      {english && (
        <span
          style={{
            ...styles.english,
            ...(active ? styles.activeSubText : {}),
          }}
        >
          {english}
        </span>
      )}
    </button>
  );
}

const styles = {
  button: {
    width: "100%",
    height: 90,

    padding: 0,

    borderRadius: 12,

    borderWidth: 1,
   
border: "none",
backgroundColor: "#F3F3F3",

    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",

    gap: 4,

    boxSizing: "border-box",

    cursor: "pointer",

    transition:
      "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease",
  },

  active: {
    backgroundColor: "#5B6CFF",
    borderColor: "#5B6CFF",
  },

  korean: {
    fontFamily: "'Pretendard', sans-serif",
    fontSize: 16,
    fontWeight: 500,
    lineHeight: "19px",

    color: "#1A1A22",
  },

  english: {
    fontFamily: "'Pretendard', sans-serif",
    fontSize: 14,
    fontWeight: 400,
    lineHeight: "17px",

    color: "#666666",
  },

  activeText: {
    color: "#FFFFFF",
  },

  activeSubText: {
    color: "#FFFFFF",
  },
};