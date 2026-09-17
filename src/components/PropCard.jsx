import { MoreHorizontal, Clock } from "lucide-react";
import Chip from "./Chip";

export default function ProjectCard({ project }) {
  return (
    <article style={styles.card}>
      <div style={styles.thumbnailWrap}>
        <img src={project.imageUrl} alt={project.title} style={styles.thumbnail} />
      </div>

      <button style={styles.moreButton}>
        <MoreHorizontal size={16} color="#B0B3C0" />
      </button>

      <div style={styles.content}>
        <h3 style={styles.title}>{project.title}</h3>
        <p style={styles.stageType}>{project.stageType}</p>

        <div style={styles.chips}>
          {project.keywords.map((keyword) => (
            <Chip key={keyword} label={keyword} small />
          ))}
        </div>

        <div style={styles.date}>
          <Clock size={12} />
          <span>{project.updatedAt}</span>
        </div>
      </div>
    </article>
  );
}

const styles = {
  card: {
    position: "relative",
    width: 347,
    height: 316,
    backgroundColor: "#FFFFFF",
    border: "0.941px solid #E8E8E8",
    borderRadius: 15,
    overflow: "hidden",
    boxSizing: "border-box",
  },
  thumbnailWrap: {
    width: "100%",
    height: 159,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: 194,
    objectFit: "cover",
    transform: "translateY(-35px)",
  },
  moreButton: {
    position: "absolute",
    top: 172,
    right: 12,
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  content: {
    padding: "18px 16px 0",
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: "#1A1A22",
  },
  stageType: {
    margin: "6px 0 12px",
    fontSize: 16,
    color: "#666666",
  },
  chips: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  date: {
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#666666",
  },
};