import { Bell, Settings } from "lucide-react";

export default function TopBar({ onLogoClick }) {
  return (
    <header style={styles.header}>
      <button
        type="button"
        onClick={onLogoClick}
        aria-label="메인 페이지로 이동"
        style={styles.logoButton}
      >
        <div style={styles.logoWrap}>
          <img
            src="/logo.svg"
            alt="PROPPICK"
            style={styles.logo}
          />
          <span style={styles.logoText}>
            PROPPICK
          </span>
        </div>
      </button>

      <div style={styles.rightIcons}>
        <button
          type="button"
          aria-label="설정"
          style={styles.iconButton}
        >
          <Settings size={20} strokeWidth={1.8} />
        </button>

        <button
          type="button"
          aria-label="알림"
          style={styles.iconButton}
        >
          <Bell size={20} strokeWidth={1.8} />
        </button>

        <div style={styles.avatar} />
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    width: "100%",
    height: 72,
    padding: "0 32px",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },

  logoButton: {
    padding: 0,
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
  },

  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  logo: {
    width: 28,
    height: "auto",
    display: "block",
    objectFit: "contain",
  },

  logoText: {
    fontFamily:
      "'General Sans', 'Pretendard', sans-serif",
    fontSize: 20,
    fontWeight: 600,
    color: "#1A1A22",
  },

  rightIcons: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  iconButton: {
    width: 32,
    height: 32,
    padding: 0,
    border: "none",
    backgroundColor: "transparent",
    color: "#1A1A22",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    backgroundColor: "#D9D9D9",
  },
};