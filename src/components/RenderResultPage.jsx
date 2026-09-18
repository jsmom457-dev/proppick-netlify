import {
  Check,
  Pencil,
  RefreshCw,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import TopBar from "./TopBar";
import Chip from "./Chip";


const VIEW_OPTIONS = [
  {
    id: "front",
    title: "메인 앵글",
    subtitle: "Front",
  },
  {
    id: "side",
    title: "사이드 앵글",
    subtitle: "Side",
  },
  {
    id: "top",
    title: "탑 뷰",
    subtitle: "Top",
  },
];


export default function RenderResultPage({
  project,
  results = {},
  onBack,
  onRegenerate,
  onSave,
  onLogoClick,
}) {
  const [
    activeView,
    setActiveView,
  ] = useState("front");


  const keywords =
    useMemo(() => {
      const values = [
        project?.keywords?.space,
        project?.keywords?.mood,
        project?.keywords?.style,
        project?.keywords?.worldview,
      ];

      return values.filter(
        (keyword) =>
          keyword &&
          !keyword.includes("없음") &&
          !keyword
            .toUpperCase()
            .includes("NONE")
      );
    }, [project]);


  const activeImage =
    results?.[activeView] ||
    null;


  const activeIndex =
    VIEW_OPTIONS.findIndex(
      (view) =>
        view.id ===
        activeView
    );


  const handleSave = () => {
    if (onSave) {
      onSave({
        project,
        results,
        activeView,
      });

      return;
    }

    if (!activeImage) {
      return;
    }

    const link =
      document.createElement(
        "a"
      );

    link.href =
      activeImage;

    link.download =
      `${
        project?.title ||
        "PROPPICK"
      }-${activeView}.png`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );
  };


  return (
    <div
      style={
        styles.page
      }
    >
      <TopBar onLogoClick={onLogoClick} />


      {/* ======================================
          PROJECT META / ACTIONS
      ====================================== */}

      <section
        style={
          styles.projectBar
        }
      >
        <div
          style={
            styles.projectInfo
          }
        >
          <div
            style={
              styles.breadcrumb
            }
          >
            <button
              type="button"
              onClick={
                onBack
              }
              style={
                styles.breadcrumbBack
              }
            >
              <span
                style={
                  styles.backArrow
                }
              >
                ‹
              </span>

              프로젝트
            </button>

            <span
              style={
                styles.breadcrumbArrow
              }
            >
              ›
            </span>

            <span
              style={
                styles.breadcrumbCurrent
              }
            >
              {project?.title ||
                "프로젝트"}
            </span>
          </div>


          <div
            style={
              styles.keywordRow
            }
          >
            <span
              style={
                styles.keywordLabel
              }
            >
              KEYWORD:
            </span>

            <div
              style={
                styles.keywordList
              }
            >
              {keywords.map(
                (keyword) => (
                  <Chip
                    key={
                      keyword
                    }
                    label={
                      keyword
                    }
                    variant="workspace"
                  />
                )
              )}
            </div>
          </div>
        </div>


        <div
          style={
            styles.topActions
          }
        >
          <button
            type="button"
            onClick={
              onBack
            }
            style={{
              ...styles.actionButton,
              ...styles.editButton,
            }}
          >
            <Pencil
              size={20}
              strokeWidth={1.8}
            />

            에디터 돌아가기
          </button>

          <button
            type="button"
            onClick={
              handleSave
            }
            style={{
              ...styles.actionButton,
              ...styles.saveButton,
            }}
          >
            <Check
              size={20}
              strokeWidth={2}
            />

            저장하기
          </button>
        </div>
      </section>


      {/* ======================================
          RESULT AREA
      ====================================== */}

      <main
        style={
          styles.resultLayout
        }
      >
        {/* MAIN RESULT */}

        <section
          style={
            styles.mainColumn
          }
        >
          <button
            type="button"
            style={
              styles.mainImageButton
            }
          >
            {activeImage ? (
              <img
                src={
                  activeImage
                }
                alt={`${activeView} render`}
                draggable={
                  false
                }
                style={
                  styles.mainImage
                }
              />
            ) : (
              <div
                style={
                  styles.emptyMain
                }
              >
                <span
                  style={
                    styles.emptyMainTitle
                  }
                >
                  AI 렌더링 결과
                </span>

                <span
                  style={
                    styles.emptyMainDescription
                  }
                >
                  생성된 이미지가 이 영역에 표시됩니다.
                </span>
              </div>
            )}
          </button>


          <div
            style={
              styles.mainBottom
            }
          >
            <span
              style={
                styles.detailText
              }
            >
              클릭하여 상세 보기
            </span>

            <span
              style={
                styles.pageIndicator
              }
            >
              {activeIndex + 1} / {VIEW_OPTIONS.length}
            </span>
          </div>
        </section>


        {/* RIGHT VIEW LIST */}

        <aside
          style={
            styles.sideColumn
          }
        >
          <div
            style={
              styles.viewList
            }
          >
            {VIEW_OPTIONS.map(
              (view) => {
                const selected =
                  activeView ===
                  view.id;

                const image =
                  results?.[
                    view.id
                  ];

                return (
                  <button
                    key={
                      view.id
                    }
                    type="button"
                    onClick={() =>
                      setActiveView(
                        view.id
                      )
                    }
                    style={{
                      ...styles.viewCard,
                      ...(selected
                        ? styles.viewCardSelected
                        : {}),
                    }}
                  >
                    <div
                      style={
                        styles.thumbnailWrap
                      }
                    >
                      {image ? (
                        <img
                          src={
                            image
                          }
                          alt={
                            view.title
                          }
                          draggable={
                            false
                          }
                          style={
                            styles.thumbnail
                          }
                        />
                      ) : (
                        <div
                          style={
                            styles.thumbnailEmpty
                          }
                        />
                      )}
                    </div>

                    <div
                      style={
                        styles.viewText
                      }
                    >
                      <span
                        style={{
                          ...styles.viewTitle,
                          ...(selected
                            ? styles.viewTitleSelected
                            : {}),
                        }}
                      >
                        {
                          view.title
                        }
                      </span>

                      <span
                        style={
                          styles.viewSubtitle
                        }
                      >
                        {
                          view.subtitle
                        }
                      </span>
                    </div>
                  </button>
                );
              }
            )}
          </div>


          <button
            type="button"
            onClick={
              onRegenerate
            }
            style={
              styles.regenerateButton
            }
          >
            <RefreshCw
              size={20}
              strokeWidth={1.8}
            />

            재생성
          </button>
        </aside>
      </main>
    </div>
  );
}


const styles = {
  page: {
    width: "100%",
    minWidth: 1180,
    minHeight: "100vh",
    paddingBottom: 34,
    boxSizing: "border-box",
    backgroundColor: "#FFFFFF",
    color: "#1A1A22",
    fontFamily:
      "'Pretendard', sans-serif",
  },


  /*
   * ======================================
   * PROJECT BAR
   * Figma: y 72 ~ 167
   * ======================================
   */

  projectBar: {
    width: "100%",
    minHeight: 95,
    padding: "16px 36px 16px 32px",
    borderBottom:
      "1px solid #E8E8E8",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    boxSizing: "border-box",
  },

  projectInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minWidth: 0,
  },

  breadcrumb: {
    height: 20,
    display: "flex",
    alignItems: "center",
    gap: 18,
  },

  breadcrumbBack: {
    height: 20,
    padding: 0,
    border: "none",
    backgroundColor:
      "transparent",
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#666666",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },

  backArrow: {
    marginTop: -1,
    color: "#666666",
    fontSize: 24,
    fontWeight: 300,
    lineHeight: 1,
  },

  breadcrumbArrow: {
    color: "#1A1A22",
    fontSize: 24,
    fontWeight: 300,
    lineHeight: 1,
  },

  breadcrumbCurrent: {
    color: "#1A1A22",
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: "nowrap",
  },

  keywordRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    minHeight: 32,
  },

  keywordLabel: {
    color: "#1A1A22",
    fontSize: 18,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  keywordList: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  topActions: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexShrink: 0,
  },

  actionButton: {
    height: 44,
    padding: "0 20px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    gap: 10,
    fontFamily:
      "'Pretendard', sans-serif",
    fontSize: 18,
    fontWeight: 600,
    cursor: "pointer",
    boxSizing: "border-box",
  },

  editButton: {
    minWidth: 204,
    border:
      "1px solid #D9D9D9",
    backgroundColor:
      "#FFFFFF",
    color: "#1A1A22",
  },

  saveButton: {
    minWidth: 142,
    border:
      "1px solid #5B6CFF",
    backgroundColor:
      "#5B6CFF",
    color: "#FFFFFF",
  },


  /*
   * ======================================
   * RESULT
   * Figma screenshot:
   * x 32 / y 191
   * right card width 168
   * ======================================
   */

resultLayout: {
  width: "100%",
  padding: "24px 36px 0 32px",

  display: "grid",

  // 좌측 결과 이미지 82vw가 아니라 화면에 맞춰 적당히 축소
  gridTemplateColumns: "minmax(0, 82%) 168px",

  // 메인 이미지 ↔ 우측 카드 간격
  gap: 32,

  boxSizing: "border-box",
  alignItems: "start",
},

  mainColumn: {
    minWidth: 0,
  },

mainImageButton: {
  display: "block",
  width: "100%",

  aspectRatio: "16 / 8.45",

  padding: 0,
  overflow: "hidden",
  border: "none",
  borderRadius: 6,
  backgroundColor: "#F5F6F8",
  cursor: "pointer",
},

  mainImage: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    userSelect: "none",
    pointerEvents: "none",
  },

  emptyMain: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent:
      "center",
    gap: 8,
    backgroundColor:
      "#F5F6F8",
  },

  emptyMainTitle: {
    color: "#1A1A22",
    fontSize: 18,
    fontWeight: 500,
  },

  emptyMainDescription: {
    color: "#888888",
    fontSize: 14,
  },

mainBottom: {
  width: "100%",
  minHeight: 52,
  paddingTop: 14,

  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",

  alignItems: "start",
  boxSizing: "border-box",
},
  detailText: {
    gridColumn: 1,
    color: "#888888",
    fontSize: 14,
    fontWeight: 400,
  },

  pageIndicator: {
    gridColumn: 2,
    color: "#666666",
    fontSize: 14,
    fontWeight: 400,
    textAlign: "center",
  },


  /*
   * ======================================
   * SIDE VIEWS
   * ======================================
   */

  sideColumn: {
    width: 168,
    display: "flex",
    flexDirection: "column",
    gap: 32,
  },

  viewList: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },

  viewCard: {
    width: 168,
    height: 190,
    padding: 0,
    overflow: "hidden",
    border:
      "1px solid #E8E8E8",
    borderRadius: 8,
    backgroundColor:
      "#FFFFFF",
    cursor: "pointer",
    boxSizing: "border-box",
  },

  viewCardSelected: {
    border:
      "2px solid #5B6CFF",
  },

  thumbnailWrap: {
    width: "100%",
    height: 116,
    overflow: "hidden",
    backgroundColor:
      "#F5F6F8",
  },

  thumbnail: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    userSelect: "none",
    pointerEvents: "none",
  },

  thumbnailEmpty: {
    width: "100%",
    height: "100%",
    backgroundColor:
      "#F5F6F8",
  },

  viewText: {
    height: 72,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent:
      "center",
    gap: 4,
    boxSizing: "border-box",
  },

  viewTitle: {
    color: "#666666",
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.3,
  },

  viewTitleSelected: {
    color: "#1A1A22",
    fontWeight: 600,
  },

  viewSubtitle: {
    color: "#888888",
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.3,
  },

  regenerateButton: {
    width: 168,
    height: 44,
    padding: 0,
    border:
      "1px solid #5B6CFF",
    borderRadius: 12,
    backgroundColor:
      "#5B6CFF",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    gap: 8,
    fontFamily:
      "'Pretendard', sans-serif",
    fontSize: 18,
    fontWeight: 600,
    cursor: "pointer",
  },
};
