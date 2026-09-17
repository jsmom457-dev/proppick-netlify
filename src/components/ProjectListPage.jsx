import { useState } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";

import TopBar from "./TopBar";
import Button from "./Button";
import ProjectCard from "./ProjectCard";

const filters = [
  "전체",
  "플랫 월형",
  "커브드 월형",
  "U-랩핑형",
  "멀티 패널형",
  "게이트 포털형",
  "아치형 포털형",
];

export default function ProjectListPage({
  projects = [],
  onCreate,
  onSelectProject,
  onLogoClick,
}) {
  const [selectedFilter, setSelectedFilter] = useState("전체");
  const [searchValue, setSearchValue] = useState("");

  // 검색 + 무대 유형 필터링
  // 반드시 ProjectListPage 함수 안에 있어야 함
  const filteredProjects = projects.filter((project) => {
    const keyword = searchValue.trim().toLowerCase();

    const projectTitle = project.title?.toLowerCase() || "";
    const projectStageType = project.stageType?.toLowerCase() || "";

    const projectKeywords = Array.isArray(project.keywords)
      ? project.keywords
      : [];

    const matchesSearch =
      !keyword ||
      projectTitle.includes(keyword) ||
      projectStageType.includes(keyword) ||
      projectKeywords.some((item) =>
        item.toLowerCase().includes(keyword)
      );

    const matchesFilter =
      selectedFilter === "전체" ||
      project.stageType === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div style={styles.page}>
      <TopBar onLogoClick={onLogoClick} />

      <main style={styles.main}>
        <section style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Projects</h1>

            <p style={styles.count}>
              총 {projects.length}개의 프로젝트
            </p>
          </div>

          <Button
            icon={<Plus size={24} />}
            onClick={onCreate}
          >
            프로젝트 생성
          </Button>
        </section>

        <section style={styles.toolbar}>
          {/* 검색창 */}

          <div style={styles.searchBox}>
            <Search
              size={20}
              strokeWidth={2}
              color="#666666"
            />

            <input
              type="text"
              value={searchValue}
              onChange={(e) =>
                setSearchValue(e.target.value)
              }
              placeholder="프로젝트명, 컨셉, 공간으로 검색..."
              style={styles.searchInput}
            />
          </div>

          {/* 무대 유형 카테고리 */}

          <div style={styles.filterBox}>
            {filters.map((filter) => {
              const active =
                selectedFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() =>
                    setSelectedFilter(filter)
                  }
                  style={{
                    ...styles.filterButton,

                    ...(active
                      ? styles.filterButtonActive
                      : {}),
                  }}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {/* 정렬 */}

          <button
            type="button"
            style={styles.sortButton}
          >
            <SlidersHorizontal
              size={20}
              strokeWidth={2}
            />

            최근 수정순
          </button>
        </section>

        {/* 프로젝트 카드 */}

        <section style={styles.grid}>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() =>
                onSelectProject?.(project)
              }
            />
          ))}
        </section>

        {/* 검색 결과 없음 */}

        {filteredProjects.length === 0 && (
          <div style={styles.empty}>
            
          </div>
        )}
      </main>
    </div>
  );
}

function formatProjectTime(value) {
  if (!value) {
    return "";
  }

  let date;

  // Firestore Timestamp 대응
  if (value?.toDate) {
    date = value.toDate();
  } else {
    date = new Date(value);
  }

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const now = new Date();

  const diffMs =
    now.getTime() -
    date.getTime();

  const diffSeconds =
    Math.floor(
      diffMs / 1000
    );

  const diffMinutes =
    Math.floor(
      diffSeconds / 60
    );

  const diffHours =
    Math.floor(
      diffMinutes / 60
    );

  // 미래 시간이 들어온 경우
  if (diffSeconds < 0) {
    return "방금 저장됨";
  }

  // 10초 미만
  if (diffSeconds < 10) {
    return "방금 저장됨";
  }

  // 1분 미만
  if (diffSeconds < 60) {
    return `${diffSeconds}초 전`;
  }

  // 1시간 미만
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  // 24시간 미만
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  // 24시간 이후
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}.${month}.${day}`;
}

const styles = {
  page: {
    width: "100vw",
    minHeight: "100vh",

    backgroundColor: "#FFFFFF",
    color: "#1A1A22",

    fontFamily: "'Pretendard', sans-serif",

    overflowX: "hidden",
  },

  main: {
    width: "100%",

    padding: "40px 32px 63px",

    boxSizing: "border-box",
  },

  headerRow: {
    width: "100%",

    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  title: {
    margin: 0,

    fontSize: 28,
    fontWeight: 600,
    lineHeight: "33px",

    color: "#1A1A22",
  },

  count: {
    margin: "8px 0 0",

    fontSize: 20,
    fontWeight: 400,
    lineHeight: "24px",

    color: "#1A1A22",
  },

  toolbar: {
    width: "100%",

    marginTop: 22,

    display: "flex",
    alignItems: "center",

    gap: 16,
  },

  searchBox: {
    width: 373,
    height: 43,

    padding: "0 10px",

    borderRadius: 8,

    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",

    backgroundColor: "#F5F6F8",

    display: "flex",
    alignItems: "center",

    gap: 8,

    boxSizing: "border-box",

    flexShrink: 0,
  },

  searchInput: {
    width: "100%",
    height: "100%",

    padding: 0,

    borderWidth: 0,
    outline: "none",

    backgroundColor: "transparent",

    fontFamily: "'Pretendard', sans-serif",

    fontSize: 16,
    fontWeight: 400,
    lineHeight: "19px",

    color: "#1A1A22",
  },

  filterBox: {
    padding: "8px 14px",
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    gap: 8,
    boxSizing: "border-box",
  },

  filterButton: {
    padding: "5px 12px",
    borderWidth: 0,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    color: "#666666",
    fontFamily: "'Pretendard', sans-serif",
    fontSize: 18,
    fontWeight: 500,
    lineHeight: "21px",
    whiteSpace: "nowrap",
    cursor: "pointer",
    boxSizing: "border-box",
  },

  filterButtonActive: {
    backgroundColor: "#1A1A22",
    color: "#FFFFFF",
    fontWeight: 600,
  },

  sortButton: {
    padding: "8px 14px",
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'Pretendard', sans-serif",
    fontSize: 18,
    fontWeight: 500,
    color: "#1A1A22",
    whiteSpace: "nowrap",
    cursor: "pointer",
    boxSizing: "border-box",
    flexShrink: 0,
  },

  grid: {
    width: "100%",
    marginTop: 20,
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(347px, 1fr))",
    gap: 20,
  },

  empty: {
    width: "100%",
    padding: "80px 0",
    textAlign: "center",
    fontSize: 16,
    fontWeight: 400,
    color: "#666666",
  },
};