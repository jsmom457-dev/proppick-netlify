import { Clock, MoreHorizontal } from "lucide-react";
import Chip from "./Chip";

export default function ProjectCard({
  project,
  onClick,
}) {
  /*
   * 메인 카드 전용 키워드:
   * App.jsx에서 괄호 안 영문을 제거한 displayKeywords를 전달합니다.
   *
   * 원본 project.keywords는 건드리지 않기 때문에
   * 상세 페이지에서는 "지하철 (SUBWAY)" 형태가 그대로 유지됩니다.
   */
  const cardKeywords =
    Array.isArray(
      project.displayKeywords
    )
      ? project.displayKeywords
      : Array.isArray(
          project.keywords
        )
      ? project.keywords
      : [];

  return (
    <article
      style={styles.card}
      onClick={onClick}
    >
      <div style={styles.imageWrap}>
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.title}
            style={styles.image}
          />
        ) : (
          <div
            style={styles.imagePlaceholder}
          />
        )}
      </div>

      <button
        type="button"
        style={styles.moreButton}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <MoreHorizontal
          size={16}
          color="#B0B3C0"
        />
      </button>

      <div style={styles.content}>
        <h3 style={styles.title}>
          {project.title}
        </h3>

        <p style={styles.stageType}>
          {project.stageType}
        </p>

        <div style={styles.chips}>
          {cardKeywords.map(
            (keyword) => (
              <Chip
                key={keyword}
                label={keyword}
                variant="project"
              />
            )
          )}
        </div>

        <div style={styles.dateRow}>
          <Clock
            size={12}
            color="#666666"
          />

          <span>
            {project.updatedAt}
          </span>
        </div>
      </div>
    </article>
  );
}

const styles = {
  card: {
    position: "relative",
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",
    borderRadius: 16,
    overflow: "hidden",
    cursor: "pointer",
  },

  imageWrap: {
    position: "relative",
    width: "100%",
    height: 159,
    overflow: "hidden",
    backgroundColor: "#F5F6F8",
  },

  image: {
    width: "100%",
    height: 194,
    objectFit: "cover",
    transform: "translateY(-35px)",
    display: "block",
  },

  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F6F8",
  },

  moreButton: {
    position: "absolute",
    right: 12,
    top: 170,
    width: 24,
    height: 24,
    border: "none",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  content: {
    padding: "12px 12px 20px 16px",
  },

  title: {
    margin: 0,
    fontFamily:
      "'Pretendard', sans-serif",
    fontSize: 20,
    fontWeight: 600,
    color: "#1A1A22",
    textAlign: "left",
  },

  stageType: {
    margin: "6px 0 16px",
    fontFamily:
      "'Pretendard', sans-serif",
    fontSize: 16,
    fontWeight: 400,
    color: "#666666",
    textAlign: "left",
  },

  chips: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  dateRow: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily:
      "'Pretendard', sans-serif",
    fontSize: 12,
    fontWeight: 400,
    lineHeight: "14px",
    color: "#666666",
  },
};
