import { useState } from "react";

export default function Button({
  children,
  icon,
  onClick,
  variant = "primary",
  disabled = false,
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...styles.base,
        ...(variant === "primary"
          ? styles.primary
          : styles.secondary),
        ...(hover && !disabled ? styles.hover : {}),
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

const styles = {
  base: {
    height: 44,
    padding: "10px 20px",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 12,

    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    fontFamily: "'Pretendard', sans-serif",
    fontSize: 18,
    fontWeight: 600,
    transition: "0.15s ease",
  },

  primary: {
    backgroundColor: "#5B6CFF",
    borderColor: "#5B6CFF",
    color: "#FFFFFF",
  },

  secondary: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E8E8",
    color: "#1A1A22",
  },

  hover: {
    filter: "brightness(0.96)",
  },
};