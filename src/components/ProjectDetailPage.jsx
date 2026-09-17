import {
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import TopBar from "./TopBar";

import { UserRound, UsersRound } from "lucide-react";


const KEYWORD_META = [
  {
    key: "space",
    label: "공간",
    short: "공",
  },
  {
    key: "mood",
    label: "분위기",
    short: "분",
  },
  {
    key: "style",
    label: "조형 스타일",
    short: "조",
  },
  {
    key: "worldview",
    label: "세계관",
    short: "세",
  },
];


const LIGHTING_OPTIONS = {
  broadcast: {
    label: "기본 방송 조명",
    icon: "/icons/lighting/broadcast.svg",
  },

  beam: {
    label: "빔 중심 조명",
    icon: "/icons/lighting/beam.svg",
  },

  diffusion: {
    label: "확산광 조명",
    icon: "/icons/lighting/diffusion.svg",
  },

  spatial: {
    label: "공간 연출 조명",
    icon: "/icons/lighting/spatial.svg",
  },

  // 현재 RenderSettingPage에서 사용하는 최신 ID도 대응
  "broadcast-clean": {
    label: "기본 방송 조명",
    icon: "/icons/lighting/broadcast-clean.svg",
  },

  backlight: {
    label: "백라이트",
    icon: "/icons/lighting/backlight.svg",
  },

  "beam-light": {
    label: "빔 라이트",
    icon: "/icons/lighting/beam-light.svg",
  },

  "soft-diffusion": {
    label: "소프트 디퓨전",
    icon: "/icons/lighting/soft-diffusion.svg",
  },
};


function formatProjectDate(
  value
) {
  if (!value) {
    return "";
  }

  try {
    const date =
      value?.toDate
        ? value.toDate()
        : new Date(
            value
          );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(
        value
      );
    }

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() +
          1
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

    return `${year}-${month}-${day}`;
  } catch {
    return String(
      value
    );
  }
}


export default function ProjectDetailPage({
   project,
  objects = [],
  onBack,
  onOpenEditor,
  onSaveProject,
  onOpenRender,
  onSaveNotes,
  onLogoClick,
}) {
  const [
    notes,
    setNotes,
  ] = useState(
    project?.notes ||
      ""
  );


  const keywords =
    useMemo(() => {
      return KEYWORD_META
        .map(
          (meta) => ({
            ...meta,
            value:
              project
                ?.keywords?.[
                meta.key
              ],
          })
        )
        .filter(
          (item) =>
            item.value &&
            !String(
              item.value
            ).includes(
              "없음"
            )
        );
    }, [project]);


  const renderSettings =
    project
      ?.renderSettings ||
    {};


  const paletteColors =
    renderSettings
      ?.paletteColors ||
    [];


  const paletteName =
    renderSettings
      ?.paletteName ||
    renderSettings
      ?.paletteId ||
    "Broadcast Signature";


 const lightingOption =
  LIGHTING_OPTIONS[
    renderSettings?.lighting
  ] ||
  LIGHTING_OPTIONS[
    "broadcast-clean"
  ];

const lightingLabel =
  renderSettings?.lightingLabel ||
  lightingOption?.label ||
  "기본 방송 조명";

const lightingIcon =
  lightingOption?.icon ||
  "/icons/lighting/broadcast-clean.svg";


  const moodDescription =
    renderSettings
      ?.moodDescription ||
    "none";


  const artistCount =
  Number(renderSettings?.artistCount) || 0;

const artistLabel =
  artistCount === 0
    ? "선택 안 함"
    : artistCount === 1
    ? "솔로 아티스트"
    : `${artistCount}인 그룹`;



  const createdDate =
    formatProjectDate(
      project?.createdAt ||
        project?.createdDate ||
        project?.date
    );


  const handleSave =
    () => {
      onSaveNotes?.(
        notes
      );
    };


  return (
    <div
      style={
        styles.page
      }
    >
      <TopBar onLogoClick={onLogoClick} />


      {/* =====================================
          PROJECT HEADER
      ===================================== */}

      <section
        style={
          styles.projectHeader
        }
      >
        <div
          style={
            styles.headerLeft
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
                styles.breadcrumbButton
              }
            >
              <ChevronLeft
                size={16}
                strokeWidth={
                  1.8
                }
              />

              프로젝트
            </button>

            <ChevronRight
              size={16}
              strokeWidth={
                1.8
              }
              color="#1A1A22"
            />

            <span
              style={
                styles.breadcrumbCurrent
              }
            >
              프로젝트 상세
            </span>
          </div>


          <div
            style={
              styles.titleRow
            }
          >
            <h1
              style={
                styles.projectTitle
              }
            >
              {project?.title ||
                "프로젝트"}
            </h1>

            {createdDate && (
              <span
                style={
                  styles.createdDate
                }
              >
                생성:{" "}
                {
                  createdDate
                }
              </span>
            )}
          </div>
        </div>


        <div
          style={
            styles.headerActions
          }
        >

          <button
  type="button"
  onClick={onSaveProject}
  style={{
    ...styles.headerButton,
    ...styles.saveProjectButton,
  }}
>
  <Check
    size={20}
    strokeWidth={1.8}
  />

  저장
</button>

          <button
            type="button"
            onClick={
              onOpenEditor
            }
            style={{
              ...styles.headerButton,
              ...styles.editorButton,
            }}
          >
            <Pencil
              size={20}
              strokeWidth={
                1.8
              }
            />

            에디터 열기
          </button>

          <button
            type="button"
            onClick={
              onOpenRender
            }
            style={{
              ...styles.headerButton,
              ...styles.renderButton,
            }}
          >
            <Box
              size={20}
              strokeWidth={
                1.7
              }
            />

            AI 무대 보기
          </button>
        </div>
      </section>


      <main
        style={
          styles.content
        }
      >
        {/* =====================================
            KEYWORDS
        ===================================== */}

        <section>
          <h2
            style={
              styles.sectionTitle
            }
          >
            컨셉 키워드
          </h2>

          <div
            style={
              styles.keywordGrid
            }
          >
            {keywords.map(
              (
                keyword
              ) => (
                <div
                  key={
                    keyword.key
                  }
                  style={
                    styles.keywordCard
                  }
                >
                  <div
                    style={
                      styles.keywordIcon
                    }
                  >
                    {
                      keyword.short
                    }
                  </div>

                  <div
                    style={
                      styles.keywordText
                    }
                  >
                    <span
                      style={
                        styles.keywordCategory
                      }
                    >
                      {
                        keyword.label
                      }
                    </span>

                    <strong
                      style={
                        styles.keywordValue
                      }
                    >
                      {
                        keyword.value
                      }
                    </strong>
                  </div>
                </div>
              )
            )}
          </div>
        </section>


        {/* =====================================
            OBJECTS
        ===================================== */}

        <section
          style={
            styles.sectionGap
          }
        >
          <h2
            style={
              styles.sectionTitle
            }
          >
            사용 소품{" "}
            <span
              style={
                styles.sectionCount
              }
            >
              (
              {
                objects.length
              }
              종)
            </span>
          </h2>

          <div
            style={
              styles.assetPanel
            }
          >
            <div
              style={
                styles.assetRow
              }
            >
              {objects.map(
                (
                  object,
                  index
                ) => (
                  <div
                    key={
                      object.id ||
                      index
                    }
                    style={
                      styles.assetItem
                    }
                  >
                    <div
                      style={
                        styles.assetThumb
                      }
                    >
                      {object.imageUrl ? (
                        <img
                          src={
                            object.imageUrl
                          }
                          alt={
                            object.name ||
                            `asset-${
                              index +
                              1
                            }`
                          }
                          draggable={
                            false
                          }
                          style={
                            styles.assetImage
                          }
                        />
                      ) : (
                        <div
                          style={
                            styles.assetEmpty
                          }
                        />
                      )}
                    </div>

                    <span
                      style={
                        styles.assetName
                      }
                    >
                      {object.name ||
                        `Asset ${
                          index +
                          1
                        }`}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </section>


        {/* =====================================
            DETAILS
        ===================================== */}

        <section
          style={
            styles.sectionGap
          }
        >
          <h2
            style={
              styles.sectionTitle
            }
          >
            세부 설정
          </h2>

          <div
            style={
              styles.detailGrid
            }
          >
            <div
              style={
                styles.detailLeft
              }
            >
              <div
                style={
                  styles.paletteCard
                }
              >
                <div
                  style={
                    styles.paletteInfo
                  }
                >
                  <strong
                    style={
                      styles.detailLabel
                    }
                  >
                    컬러 팔레트:
                  </strong>

                  <span
                    style={
                      styles.detailValue
                    }
                  >
                    {
                      paletteName
                    }
                  </span>
                </div>

                <div
                  style={
                    styles.paletteColors
                  }
                >
                  {paletteColors.length >
                  0 ? (
                    paletteColors.map(
                      (
                        color,
                        index
                      ) => (
                        <div
                          key={`${color}-${index}`}
                          style={
                            styles.colorItem
                          }
                        >
                          <div
                            style={{
                              ...styles.colorSwatch,
                              backgroundColor:
                                color,
                            }}
                          />

                          <span
                            style={
                              styles.colorName
                            }
                          >
                            {
                              color
                            }
                          </span>
                        </div>
                      )
                    )
                  ) : (
                    <span
                      style={
                        styles.emptyText
                      }
                    >
                      설정 없음
                    </span>
                  )}
                </div>
              </div>


              <div
                style={
                  styles.moodCard
                }
              >
                <strong
                  style={
                    styles.detailLabel
                  }
                >
                  무드 디스크립션
                </strong>

                <span
                  style={
                    styles.detailValue
                  }
                >
                  {
                    moodDescription
                  }
                </span>
              </div>
            </div>


            <div
  style={
    styles.lightingCard
  }
>
  <strong
    style={
      styles.detailLabel
    }
  >
    조명 프리셋
  </strong>

  <div
    style={
      styles.lightingContent
    }
  >
    <div
      style={
        styles.lightingIconBox
      }
    >
      <img
        src={
          lightingIcon
        }
        alt={
          lightingLabel
        }
        style={
          styles.lightingIcon
        }
        draggable={
          false
        }
      />
    </div>

    <span
      style={
        styles.lightingName
      }
    >
      {
        lightingLabel
      }
    </span>
  </div>
</div>

<div style={styles.referenceCard}>
  <strong style={styles.detailLabel}>
    무대 아티스트 정보
  </strong>

  <div style={styles.artistInfoDisplay}>
    {artistCount > 0 ? (
      <>
        <div style={styles.artistInfoIconBox}>
          {artistCount === 1 ? (
            <UserRound
              size={32}
              strokeWidth={1.7}
            />
          ) : (
            <UsersRound
              size={32}
              strokeWidth={1.7}
            />
          )}
        </div>

        <span style={styles.artistInfoName}>
          {artistLabel}
        </span>
      </>
    ) : (
      <span style={styles.artistInfoEmpty}>
        아티스트 정보 없음
      </span>
    )}
  </div>
</div>
          </div>
        </section>


        {/* =====================================
            NOTES
        ===================================== */}

        <section
          style={
            styles.notesSection
          }
        >
          <div
            style={
              styles.notesHeading
            }
          >
            <h2
              style={
                styles.sectionTitle
              }
            >
              노트 & 피드백
            </h2>

            <span
              style={
                styles.notesHelper
              }
            >
              기획 메모,
              연출팀 요청사항,
              피드백 등을
              자유롭게
              기록하세요
            </span>
          </div>

          <div
            style={
              styles.notesCard
            }
          >
            <textarea
              value={
                notes
              }
              onChange={(
                event
              ) =>
                setNotes(
                  event
                    .target
                    .value.slice(
                      0,
                      50
                    )
                )
              }
              placeholder="노트 & 피드백 작성"
              style={
                styles.textarea
              }
            />

            <div
              style={
                styles.notesFooter
              }
            >
              <span
                style={
                  styles.characterCount
                }
              >
                {
                  notes.length
                }{" "}
                / 50 자
              </span>

              <button
                type="button"
                onClick={
                  handleSave
                }
                style={
                  styles.saveNotesButton
                }
              >
                <Check
                  size={19}
                  strokeWidth={
                    1.8
                  }
                />

                저장
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor:
      "#FFFFFF",
    color: "#1A1A22",
    fontFamily:
      "'Pretendard', sans-serif",
  },


  /*
   * ======================================
   * HEADER
   * ======================================
   */

  projectHeader: {
    minHeight: 96,
    padding:
      "20px 32px 16px",
    borderBottom:
      "1px solid #E8E8E8",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: 24,
    boxSizing:
      "border-box",
  },

  headerLeft: {
    minWidth: 0,
  },

  breadcrumb: {
    height: 20,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  breadcrumbButton: {
    padding: 0,
    border: "none",
    backgroundColor:
      "transparent",
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#666666",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },

  breadcrumbCurrent: {
    color: "#1A1A22",
    fontSize: 14,
    fontWeight: 600,
  },

  titleRow: {
    marginTop: 8,
    display: "flex",
    alignItems: "baseline",
    gap: 14,
  },

  projectTitle: {
    margin: 0,
    color: "#1A1A22",
    fontSize: 24,
    fontWeight: 600,
    letterSpacing:
      "-0.3px",
  },

  createdDate: {
    color: "#888888",
    fontSize: 14,
    fontWeight: 400,
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexShrink: 0,
  },

  headerButton: {
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
    boxSizing:
      "border-box",
  },

  editorButton: {
    minWidth: 164,
    border:
      "1px solid #D9D9D9",
    backgroundColor:
      "#FFFFFF",
    color: "#1A1A22",
  },

  renderButton: {
    minWidth: 166,
    border:
      "1px solid #5B6CFF",
    backgroundColor:
      "#5B6CFF",
    color: "#FFFFFF",
  },


  /*
   * ======================================
   * MAIN
   * ======================================
   */

  content: {
    padding:
      "20px 30px 48px",
  },

  sectionTitle: {
    margin: 0,
    color: "#1A1A22",
    fontSize: 19,
    fontWeight: 600,
    lineHeight: 1.4,
  },

  sectionCount: {
    fontWeight: 500,
  },

  sectionGap: {
    marginTop: 28,
  },


  /*
   * ======================================
   * KEYWORDS
   * ======================================
   */

keywordGrid: {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: 20,
  width: "100%",
},
keywordCard: {
  width: "100%",
  minWidth: 0,
  height: 68,
  padding: "0 16px",
  borderRadius: 12,
  backgroundColor: "#F4F5FC",

  display: "flex",
  alignItems: "center",
  gap: 12,

  boxSizing: "border-box",
},

  keywordIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor:
      "#D8E6FF",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    color: "#1A1A22",
    fontSize: 15,
    fontWeight: 600,
    flexShrink: 0,
  },

  keywordText: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },

  keywordCategory: {
    color: "#777777",
    fontSize: 12,
    fontWeight: 400,
  },

  keywordValue: {
    overflow: "hidden",
    color: "#1A1A22",
    fontSize: 16,
    fontWeight: 500,
    textOverflow:
      "ellipsis",
    whiteSpace: "nowrap",
  },


  /*
   * ======================================
   * ASSETS
   * ======================================
   */

  assetPanel: {
    marginTop: 14,
    minHeight: 136,
    padding: "14px 20px",
    border:
      "1px solid #E5E5E5",
    borderRadius: 16,
    overflowX: "auto",
    boxSizing:
      "border-box",
  },

  assetRow: {
    display: "flex",
    alignItems:
      "flex-start",
    gap: 14,
    width: "max-content",
    minWidth: "100%",
  },

  assetItem: {
    width: 86,
    flexShrink: 0,
    display: "flex",
    flexDirection:
      "column",
    alignItems: "center",
    gap: 8,
  },

  assetThumb: {
    width: 82,
    height: 82,
    border:
      "1px solid #D9D9D9",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor:
      "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
  },

  assetImage: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },

  assetEmpty: {
    width: "100%",
    height: "100%",
    backgroundColor:
      "#F5F6F8",
  },

  assetName: {
    width: "100%",
    overflow: "hidden",
    color: "#666666",
    fontSize: 12,
    fontWeight: 400,
    textAlign: "center",
    textOverflow:
      "ellipsis",
    whiteSpace: "nowrap",
  },


  /*
   * ======================================
   * DETAILS
   * ======================================
   */

  detailGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.4fr) 240px minmax(280px, 1fr)",
    gap: 20,
    alignItems: "stretch",
  },

  detailLeft: {
    minWidth: 0,
    display: "grid",
    gridTemplateRows:
      "70px 84px",
    gap: 12,
  },

  paletteCard: {
    minWidth: 0,
    padding: "14px 18px",
    border:
      "1px solid #E5E5E5",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    gap: 24,
    boxSizing:
      "border-box",
  },

  paletteInfo: {
    minWidth: 150,
    display: "flex",
    flexDirection:
      "column",
    gap: 4,
  },

  paletteColors: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 18,
    overflowX: "auto",
  },

  colorItem: {
    minWidth: 50,
    display: "flex",
    flexDirection:
      "column",
    alignItems: "center",
    gap: 4,
  },

  colorSwatch: {
    width: 24,
    height: 24,
    border:
      "1px solid #E5E5E5",
    borderRadius: 6,
    boxSizing:
      "border-box",
  },

  colorName: {
    maxWidth: 70,
    overflow: "hidden",
    color: "#666666",
    fontSize: 11,
    textOverflow:
      "ellipsis",
    whiteSpace: "nowrap",
  },

  moodCard: {
    padding: "14px 18px",
    border:
      "1px solid #E5E5E5",
    borderRadius: 14,
    display: "flex",
    flexDirection:
      "column",
    gap: 8,
    boxSizing:
      "border-box",
  },

 lightingCard: {
  padding: "16px 18px",
  border: "1px solid #E5E5E5",
  borderRadius: 14,

  display: "flex",
  flexDirection: "column",

  boxSizing: "border-box",
},

lightingContent: {
  marginTop: 18,

  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",

  gap: 10,

  flex: 1,
},

lightingIconBox: {
  width: 58,
  height: 58,

  borderRadius: 12,

  backgroundColor: "#F4F5FC",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",
},

lightingIcon: {
  width: 34,
  height: 34,

  display: "block",
  objectFit: "contain",
},

lightingName: {
  color: "#1A1A22",

  fontSize: 14,
  fontWeight: 500,

  textAlign: "center",
},

  referenceCard: {
    padding: "16px 18px",
    border:
      "1px solid #E5E5E5",
    borderRadius: 14,
    boxSizing:
      "border-box",
  },

  detailLabel: {
    color: "#1A1A22",
    fontSize: 15,
    fontWeight: 600,
  },

  detailValue: {
    color: "#1A1A22",
    fontSize: 14,
    fontWeight: 400,
  },

  emptyText: {
    color: "#888888",
    fontSize: 13,
  },

  referenceList: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflowX: "auto",
  },

  referenceThumb: {
    width: 102,
    height: 102,
    border:
      "1px solid #E8E8E8",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor:
      "#F5F6F8",
    flexShrink: 0,
  },

  referenceImage: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  referenceEmpty: {
    width: 102,
    height: 102,
    border:
      "1px solid #E8E8E8",
    borderRadius: 6,
    backgroundColor:
      "#FFFFFF",
  },


  /*
   * ======================================
   * NOTES
   * ======================================
   */

  notesSection: {
    marginTop: 30,
  },

  notesHeading: {
    display: "flex",
    alignItems:
      "baseline",
    gap: 12,
  },

  notesHelper: {
    color: "#666666",
    fontSize: 14,
    fontWeight: 400,
  },

  notesCard: {
    marginTop: 14,
    padding: "14px 18px",
    border:
      "1px solid #E5E5E5",
    borderRadius: 16,
    boxSizing:
      "border-box",
  },

  textarea: {
    width: "100%",
    height: 98,
    padding: "12px",
    resize: "none",
    border: "none",
    borderRadius: 10,
    outline: "none",
    backgroundColor:
      "#F5F6F8",
    color: "#1A1A22",
    fontFamily:
      "'Pretendard', sans-serif",
    fontSize: 14,
    lineHeight: 1.5,
    boxSizing:
      "border-box",
  },

  notesFooter: {
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  characterCount: {
    color: "#888888",
    fontSize: 12,
  },

  saveNotesButton: {
    height: 36,
    padding: "0 14px",
    border:
      "1px solid #D9D9D9",
    borderRadius: 10,
    backgroundColor:
      "#FFFFFF",
    color: "#1A1A22",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    gap: 8,
    fontFamily:
      "'Pretendard', sans-serif",
    fontSize: 16,
    fontWeight: 500,
    cursor: "pointer",
  },

  saveProjectButton: {
  backgroundColor: "#FFFFFF",
  color: "#1A1A22",
  border: "1px solid #D9D9D9",
},


artistInfoDisplay: {
  width: "100%",
  minHeight: "92px",
  marginTop: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  border: "1px solid #E8E8E8",
  borderRadius: "12px",
  backgroundColor: "#FFFFFF",
  boxSizing: "border-box",
  
},

artistInfoIconBox: {
  width: "48px",
  height: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#1A1A22",
},

artistInfoName: {
  fontSize: "16px",
  fontWeight: 500,
  color: "#1A1A22",
},

artistInfoEmpty: {
  fontSize: "14px",
  fontWeight: 400,
  color: "#999999",
},

artistInfoName: {
  fontSize: "16px",
  fontWeight: 500,
  color: "#1A1A22",
},

artistInfoEmpty: {
  fontSize: "14px",
  fontWeight: 400,
  color: "#999999",
},
};
