import {
  ArrowLeft,
  Box,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  useRef,
  useState,
} from "react";

import { toPng } from "html-to-image";
import { imageUrlToDataUrl } from "../api/imageData";
import { uploadImageToCloudinary } from "../services/renderStorageService";

import TopBar from "./TopBar";
import Chip from "./Chip";
import Button from "./Button";
import ColorPicker from "./ColorPicker";


const PALETTE_PRESETS = [
  {
    id: "broadcast-signature",
    name: "Broadcast Signature",
    colors: [
      "#101527",
      "#3478F6",
      "#9333EA",
      "#FF4FA3",
      "#FFFFFF",
    ],
  },
  {
    id: "neon-dream",
    name: "Neon Dream",
    colors: [
      "#0F172A",
      "#22C7E8",
      "#A78BFA",
      "#F5B5DF",
      "#FFFFFF",
    ],
  },
  {
    id: "purple-galaxy",
    name: "Purple Galaxy",
    colors: [
      "#050505",
      "#6D28D9",
      "#A855F7",
      "#EC4899",
      "#D9D9D9",
    ],
  },
  {
    id: "cyber-red",
    name: "Cyber Red",
    colors: [
      "#050505",
      "#EF4444",
      "#FF1744",
      "#6D28D9",
      "#FFFFFF",
    ],
  },
  {
    id: "ice-future",
    name: "Ice Future",
    colors: [
      "#111827",
      "#7DD3FC",
      "#22C7E8",
      "#CBD5E1",
      "#FFFFFF",
    ],
  },
  {
    id: "kpop-trend-mix",
    name: "K-POP Trend Mix",
    colors: [
      "#171717",
      "#3B82F6",
      "#9333EA",
      "#EC4899",
      "#34D399",
    ],
  },
];


const LIGHTING_OPTIONS = [
  {
    id: "broadcast-clean",
    name: "기본 방송 조명",
    icon: "/icons/lighting/broadcast-clean.svg",
    activeIcon: "/icons/lighting/broadcast-clean-active.svg",
  },
  {
    id: "backlight",
    name: "백라이트",
    icon: "/icons/lighting/backlight.svg",
    activeIcon: "/icons/lighting/backlight-active.svg",
  },
  {
    id: "beam-light",
    name: "빔 라이트",
    icon: "/icons/lighting/beam-light.svg",
    activeIcon: "/icons/lighting/beam-light-active.svg",
  },
  {
    id: "soft-diffusion",
    name: "소프트 디퓨전",
    icon: "/icons/lighting/soft-diffusion.svg",
    activeIcon: "/icons/lighting/soft-diffusion-active.svg",
  },
];


const ARTIST_OPTIONS = [
  { id: "solo", count: 1, name: "솔로 아티스트" },
  { id: "duo", count: 2, name: "2인 그룹" },
  { id: "trio", count: 3, name: "3인 그룹" },
  { id: "four", count: 4, name: "4인 그룹" },
  { id: "five", count: 5, name: "5인 그룹" },
];


export default function RenderSettingPage({
  project,
  setProject,
  objects = [],
  onBack,
  onRender,
}) {
  const stagePreviewRef =
    useRef(null);

  const savedSettings =
    project?.renderSettings ||
    {};

  const [
    paletteMode,
    setPaletteMode,
  ] = useState(
    savedSettings.paletteMode ||
      "preset"
  );

  const [
    selectedPaletteId,
    setSelectedPaletteId,
  ] = useState(
    savedSettings.paletteId ||
      null
  );

  const [
    customColors,
    setCustomColors,
  ] = useState(
    savedSettings.customColors || [
      "#2979FF",
      "#8A2BE2",
      "#FF4FD8",
      "#FFFFFF",
      "#10182F",
    ]
  );

  const [
    activeCustomColorIndex,
    setActiveCustomColorIndex,
  ] = useState(0);

  const [
    selectedLighting,
    setSelectedLighting,
  ] = useState(
    savedSettings.lighting ||
      null
  );

  const [
    moodDescription,
    setMoodDescription,
  ] = useState(
    savedSettings.moodDescription ||
      ""
  );

  const [
    selectedArtistCount,
    setSelectedArtistCount,
  ] = useState(
    Number(savedSettings.artistCount) || null
  );


  /*
   * Workspace에서 저장한 캔버스 크기를 기준으로
   * 오브젝트 좌표를 퍼센트로 환산합니다.
   */
  const editorCanvasWidth =
    Number(
      project
        ?.editorCanvasSize
        ?.width
    ) || 1;

  const editorCanvasHeight =
    Number(
      project
        ?.editorCanvasSize
        ?.height
    ) || 1;


  const workspaceKeywords = [
    project?.keywords?.space,
    project?.keywords?.mood,
    project?.keywords?.style,
    project?.keywords?.worldview,
  ].filter(
    (keyword) =>
      keyword &&
      !keyword.includes("없음") &&
      !keyword
        .toUpperCase()
        .includes("NONE")
  );


  const updateRenderSettings = (
    updates
  ) => {
    setProject?.(
      (previous) => ({
        ...previous,
        renderSettings: {
          ...(previous.renderSettings ||
            {}),
          ...updates,
        },
      })
    );
  };


  const handlePaletteModeChange = (
    mode
  ) => {
    setPaletteMode(mode);

    updateRenderSettings({
      paletteMode: mode,
    });
  };


  const handlePresetSelect = (
    palette
  ) => {
    if (
      selectedPaletteId ===
      palette.id
    ) {
      setSelectedPaletteId(
        null
      );

      updateRenderSettings({
        paletteId: null,
        paletteColors: [],
      });

      return;
    }

    setSelectedPaletteId(
      palette.id
    );

    updateRenderSettings({
      paletteMode: "preset",
      paletteId: palette.id,
      paletteColors:
        palette.colors,
    });
  };


  const handleCustomColorChange = (
    index,
    value
  ) => {
    const nextColors = [
      ...customColors,
    ];

    nextColors[index] =
      value;

    setCustomColors(
      nextColors
    );

    updateRenderSettings({
      paletteMode: "custom",
      customColors:
        nextColors,
    });
  };


  const handleLightingSelect = (
    lightingId
  ) => {
    if (
      selectedLighting ===
      lightingId
    ) {
      setSelectedLighting(
        null
      );

      updateRenderSettings({
        lighting: null,
      });

      return;
    }

    setSelectedLighting(
      lightingId
    );

    updateRenderSettings({
      lighting:
        lightingId,
    });
  };


  const handleMoodChange = (
    event
  ) => {
    const value =
      event.target.value.slice(
        0,
        500
      );

    setMoodDescription(
      value
    );

    updateRenderSettings({
      moodDescription:
        value,
    });
  };


  const handleArtistSelect = (count) => {
    const nextCount =
      selectedArtistCount === count ? null : count;

    setSelectedArtistCount(nextCount);
    updateRenderSettings({
      artistCount: nextCount,
    });
  };


  const handleRender = async () => {
    const preset =
      PALETTE_PRESETS.find(
        (palette) =>
          palette.id ===
          selectedPaletteId
      );

    const settings = {
      paletteMode,
      paletteId:
        selectedPaletteId,
      paletteColors:
        paletteMode ===
        "preset"
          ? preset?.colors ||
            []
          : customColors,
      customColors,
      lighting:
        selectedLighting,
      moodDescription,
      artistCount: selectedArtistCount,
    };

    setProject?.(
      (previous) => ({
        ...previous,
        renderSettings:
          settings,
      })
    );

    try {
      if (!stagePreviewRef.current) {
        throw new Error(
          "무대 구성 이미지를 캡처할 수 없습니다."
        );
      }

      /*
       * 현재 사용자가 구성한 무대를 한 장의 이미지로 캡처합니다.
       * 이 이미지가 AI 생성에서 가장 중요한 배치 기준입니다.
       */
      const compositionImage =
        await toPng(
          stagePreviewRef.current,
          {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor:
              "#FFFFFF",
          }
        );

      /*
       * 무대 유형 원본 이미지도 별도 입력으로 전달합니다.
       */
      const stageTypeImage =
        await imageUrlToDataUrl(
          project?.stageType?.imageUrl
        );

      /*
       * Netlify Functions에는 큰 Base64 이미지를 직접 보내지 않습니다.
       * 렌더 입력 이미지를 먼저 Cloudinary에 자동 업로드하고
       * API에는 가벼운 URL만 전달합니다.
       */
      const renderInputFolder =
        `proppick/render-inputs/${project?.id || "temporary"}/${Date.now()}`;

      const [compositionUpload, stageTypeUpload] =
        await Promise.all([
          uploadImageToCloudinary({
            dataUrl: compositionImage,
            folder: renderInputFolder,
            publicId: "composition",
          }),
          uploadImageToCloudinary({
            dataUrl: stageTypeImage,
            folder: renderInputFolder,
            publicId: "stage-type",
          }),
        ]);

      const renderPayload = {
        project: {
          id:
            project?.id ||
            null,
          title:
            project?.title ||
            "",
          keywords: {
            space:
              project?.keywords
                ?.space ||
              "",
            mood:
              project?.keywords
                ?.mood ||
              "",
            style:
              project?.keywords
                ?.style ||
              "",
            worldview:
              project?.keywords
                ?.worldview ||
              "",
          },
          stageTypeId:
            project?.stageType
              ?.id ||
            null,
          stageTypeName:
            project?.stageType
              ?.name ||
            "",
        },

        settings,

        /*
         * 이미지와 함께 좌표 데이터도 보내
         * 배치 해석을 한 번 더 보강합니다.
         */
        objects:
          objects.map(
            (object) => ({
              id:
                object.id,
              name:
                object.name,
              category:
                object.category,
              x:
                object.x,
              y:
                object.y,
              width:
                object.width,
              height:
                object.height,
              zIndex:
                object.zIndex,
              flipX:
                Boolean(
                  object.flipX
                ),
            })
          ),

        images: {
          compositionImage: compositionUpload.url,
          stageTypeImage: stageTypeUpload.url,
        },
      };

      await onRender?.(
        renderPayload
      );
    } catch (error) {
      console.error(
        "Render preparation failed:",
        error
      );

      window.alert(
        error?.message ||
          "AI 렌더링 준비 중 오류가 발생했습니다."
      );
    }
  };


  const preventMouseFocus = (
    event
  ) => {
    event.preventDefault();
  };


  return (
    <div style={styles.page}>
      <style>
        {`
          .render-setting-selectable,
          .render-setting-selectable:hover,
          .render-setting-selectable:focus,
          .render-setting-selectable:focus-visible,
          .render-setting-selectable:active {
            outline: none !important;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
          }
        `}
      </style>

      <TopBar />

      <section
        style={
          styles.projectMeta
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
            ‹ 프로젝트
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
            {workspaceKeywords.map(
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
      </section>


      <section
        style={
          styles.intro
        }
      >
        <h1
          style={
            styles.title
          }
        >
          AI에게 더 자세한 방향을 알려주세요
        </h1>

        <p
          style={
            styles.description
          }
        >
          무대 디스크립션, 컬러 팔레트, 무대 아티스트 정보, 조명 스타일 등 세부적인 설정을 추가하면 원하는 결과에 더 가까운 실사화를 얻을 수 있어요.
        </p>
      </section>


      <main
        style={
          styles.content
        }
      >
        <div
          style={
            styles.leftColumn
          }
        >
          <section
            style={{
              ...styles.card,
              ...styles.stageCard,
            }}
          >
            <h2
              style={
                styles.cardTitle
              }
            >
              편집 중인 무대 디자인
            </h2>

            <div
              ref={
                stagePreviewRef
              }
              style={
                styles.stagePreview
              }
            >
              {project
                ?.stageType
                ?.imageUrl ? (
                <img
                  src={
                    project
                      .stageType
                      .imageUrl
                  }
                  alt={
                    project
                      .stageType
                      .name ||
                    "무대"
                  }
                  draggable={
                    false
                  }
                  style={
                    styles.stageBackground
                  }
                />
              ) : (
                <div
                  style={
                    styles.emptyStage
                  }
                >
                  무대 이미지가 없습니다
                </div>
              )}


              {objects.map(
                (
                  object,
                  index
                ) => {
                  const left =
                    (
                      Number(
                        object.x
                      ) /
                      editorCanvasWidth
                    ) *
                    100;

                  const top =
                    (
                      Number(
                        object.y
                      ) /
                      editorCanvasHeight
                    ) *
                    100;

                  const width =
                    (
                      Number(
                        object.width
                      ) /
                      editorCanvasWidth
                    ) *
                    100;

                  const height =
                    (
                      Number(
                        object.height
                      ) /
                      editorCanvasHeight
                    ) *
                    100;

                  return (
                    <div
                      key={
                        object.id
                      }
                      style={{
                        ...styles.previewObjectBox,
                        left:
                          `${left}%`,
                        top:
                          `${top}%`,
                        width:
                          `${width}%`,
                        height:
                          `${height}%`,
                        zIndex:
                          object.zIndex ||
                          index + 1,
                      }}
                    >
                      <img
                        src={
                          object.imageUrl
                        }
                        alt={
                          object.name ||
                          ""
                        }
                        draggable={
                          false
                        }
                        style={{
                          ...styles.previewObjectImage,
                          transform:
                            object.flipX
                              ? "scaleX(-1)"
                              : "scaleX(1)",
                        }}
                      />
                    </div>
                  );
                }
              )}
            </div>

            <p
              style={
                styles.stageCaption
              }
            >
              현재 스테이지 구성 상태
            </p>
          </section>


          <section
            style={{
              ...styles.card,
              ...styles.paletteCard,
            }}
          >
            <h2 style={styles.cardTitle}>컬러 팔레트</h2>

            <div style={styles.paletteTabs}>
              <button
                type="button"
                className="render-setting-selectable"
                onMouseDown={preventMouseFocus}
                onClick={() => handlePaletteModeChange("preset")}
                style={{
                  ...styles.paletteTab,
                  ...(paletteMode === "preset" ? styles.paletteTabActive : {}),
                }}
              >
                프리셋
              </button>

              <button
                type="button"
                style={{
                  ...styles.paletteTab,
                  color: "#666666",
                  cursor: "default",
                }}
              >
                커스텀
              </button>
            </div>

            {paletteMode === "preset" ? (
              <div style={styles.paletteList}>
                {PALETTE_PRESETS.map((palette) => {
                  const selected = selectedPaletteId === palette.id;

                  return (
                    <button
                      key={palette.id}
                      type="button"
                      className="render-setting-selectable"
                      onMouseDown={preventMouseFocus}
                      onClick={() => handlePresetSelect(palette)}
                      style={{
                        ...styles.paletteRow,
                        ...(selected ? styles.paletteRowSelected : {}),
                      }}
                    >
                      <div style={styles.paletteColors}>
                        {palette.colors.map((color, index) => (
                          <span
                            key={`${palette.id}-${index}`}
                            style={{
                              ...styles.paletteColor,
                              backgroundColor: color,
                            }}
                          />
                        ))}
                      </div>
                      <span style={styles.paletteName}>{palette.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={styles.customPalette}>
                <div style={styles.customColors}>
                  {customColors.map((color, index) => {
                    const selected = activeCustomColorIndex === index;
                    return (
                      <button
                        key={index}
                        type="button"
                        className="render-setting-selectable"
                        onMouseDown={preventMouseFocus}
                        onClick={() => setActiveCustomColorIndex(index)}
                        aria-label={`${index + 1}번째 커스텀 컬러 선택`}
                        style={{
                          ...styles.customColorButton,
                          ...(selected ? styles.customColorButtonSelected : {}),
                        }}
                      >
                        <span
                          style={{
                            ...styles.customColorSwatch,
                            backgroundColor: color,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>

                <div style={styles.colorPickerWrap}>
                  <ColorPicker
                    value={customColors[activeCustomColorIndex] || customColors[0]}
                    onChange={(nextColor) =>
                      handleCustomColorChange(activeCustomColorIndex, nextColor)
                    }
                  />
                </div>
              </div>
            )}
          </section>
        </div>


        <div style={styles.rightColumn}>
          <section style={{ ...styles.card, ...styles.moodCard }}>
            <h2 style={styles.cardTitle}>무대 디스크립션</h2>
            <div style={styles.textareaWrap}>
              <textarea
                value={moodDescription}
                onChange={handleMoodChange}
                maxLength={500}
                placeholder="AI가 참고할 분위기, 질감, 특수효과 등을 작성해주세요. 원하는 아티스트가 있다면 ai에게 옷 스타일링, 성별 등 설명해주세요. "
                style={styles.textarea}
              />
              <span style={styles.characterCount}>
                {moodDescription.length} / 500 자
              </span>
            </div>
          </section>

          <section style={{ ...styles.card, ...styles.artistCard }}>
            <h2 style={styles.cardTitle}>무대 아티스트 정보</h2>
            <div style={styles.artistList}>
              {ARTIST_OPTIONS.map((artist) => {
                const selected = selectedArtistCount === artist.count;
                const ArtistIcon = artist.count === 1 ? UserRound : UsersRound;
                return (
                  <button
                    key={artist.id}
                    type="button"
                    className="render-setting-selectable"
                    onMouseDown={preventMouseFocus}
                    onClick={() => handleArtistSelect(artist.count)}
                    aria-pressed={selected}
                    style={{
                      ...styles.artistItem,
                      ...(selected ? styles.artistItemSelected : {}),
                    }}
                  >
                    <ArtistIcon
                      size={48}
                      strokeWidth={1.6}
                      color={selected ? "#5B6CFF" : "#666666"}
                    />
                    <span style={{
                      ...styles.artistLabel,
                      ...(selected ? styles.artistLabelSelected : {}),
                    }}>
                      {artist.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section style={{ ...styles.card, ...styles.lightingCard }}>
            <h2 style={styles.cardTitle}>조명 스타일</h2>
            <div style={styles.lightingList}>
              {LIGHTING_OPTIONS.map((lighting) => {
                const selected = selectedLighting === lighting.id;
                return (
                  <button
                    type="button"
                    key={lighting.id}
                    className="render-setting-selectable"
                    onMouseDown={preventMouseFocus}
                    onClick={() => handleLightingSelect(lighting.id)}
                    style={{
                      ...styles.lightingItem,
                      ...(selected ? styles.lightingItemSelected : {}),
                    }}
                  >
                    <div style={styles.lightingIconWrap}>
                      <img
                        src={selected ? lighting.activeIcon : lighting.icon}
                        alt=""
                        draggable={false}
                        style={styles.lightingIcon}
                      />
                    </div>
                    <span style={styles.lightingLabel}>{lighting.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>


      <footer
        style={
          styles.footer
        }
      >
        <Button
          variant="secondary"
          icon={
            <ArrowLeft
              size={20}
            />
          }
          onClick={
            onBack
          }
        >
          에디터로 돌아가기
        </Button>

        <Button
          icon={
            <Box
              size={20}
            />
          }
          onClick={
            handleRender
          }
        >
          AI 무대 렌더링
        </Button>
      </footer>
    </div>
  );
}


const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    paddingBottom: 36,
    boxSizing: "border-box",
    backgroundColor: "#FFFFFF",
    fontFamily:
      "'Pretendard', sans-serif",
    color: "#1A1A22",
  },

  projectMeta: {
    margin:
      "16px 32px 0",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    height: 20,
  },

  breadcrumbBack: {
    padding: 0,
    border: "none",
    outline: "none",
    boxShadow: "none",
    backgroundColor:
      "transparent",
    color: "#666666",
    fontFamily:
      "'Pretendard', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },

  breadcrumbArrow: {
    color: "#999999",
    fontSize: 14,
  },

  breadcrumbCurrent: {
    color: "#1A1A22",
    fontSize: 14,
    fontWeight: 500,
  },

  keywordRow: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    gap: 16,
  },

  keywordLabel: {
    color: "#1A1A22",
    fontSize: 18,
    fontWeight: 500,
  },

  keywordList: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  intro: {
    margin:
      "20px 32px 0",
  },

  title: {
    margin: 0,
    color: "#1A1A22",
    fontSize: 24,
    fontWeight: 600,
  },

  description: {
    margin:
      "8px 0 0",
    color: "#1A1A22",
    fontSize: 16,
    lineHeight: 1.5,
  },

  content: {
    margin:
      "20px 32px 0",
    display: "grid",
    gridTemplateColumns:
      "469px minmax(0, 1fr)",
    gap: 20,
    alignItems: "start",
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    border:
      "1px solid #E8E8E8",
    borderRadius: 16,
    boxSizing: "border-box",
  },

  cardTitle: {
    margin: 0,
    color: "#1A1A22",
    fontSize: 18,
    fontWeight: 500,
  },

  stageCard: {
    height: 278,
    padding:
      "16px 20px",
  },

  stagePreview: {
    position: "relative",
    width: "100%",
    height: 170,
    marginTop: 16,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor:
      "#F5F6F8",
  },

  stageBackground: {
    position: "absolute",
    inset: 0,
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    border: "none",
    outline: "none",
    userSelect: "none",
    pointerEvents: "none",
  },

  previewObjectBox: {
    position: "absolute",
    border: "none",
    outline: "none",
    backgroundColor:
      "transparent",
    boxSizing:
      "border-box",
    pointerEvents: "none",
    transformOrigin:
      "center center",
  },

  previewObjectImage: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    border: "none",
    outline: "none",
    userSelect: "none",
    pointerEvents: "none",
    transformOrigin:
      "center center",
  },

  emptyStage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999999",
    fontSize: 14,
  },

  stageCaption: {
    margin:
      "8px 0 0",
    fontSize: 14,
    textAlign: "center",
  },

  paletteCard: {
    height: 428,
    padding: "16px 20px 18px",
  },

  paletteTabs: {
    width: "100%",
    height: 49,
    marginTop: 16,
    padding:
      "7px 8px",
    border:
      "1px solid #E8E8E8",
    borderRadius: 8,
    backgroundColor:
      "#F3F3F3",
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: 8,
    boxSizing:
      "border-box",
  },

  paletteTab: {
    width: "100%",
    border: "none",
    outline: "none",
    boxShadow: "none",
    WebkitAppearance:
      "none",
    appearance: "none",
    borderRadius: 6,
    backgroundColor:
      "transparent",
    color: "#666666",
    fontFamily:
      "'Pretendard', sans-serif",
    fontSize: 16,
    fontWeight: 500,
    cursor: "pointer",
    WebkitTapHighlightColor:
      "transparent",
  },

  paletteTabActive: {
    backgroundColor:
      "#1A1A22",
    color: "#FFFFFF",
    fontWeight: 600,
    outline: "none",
    boxShadow: "none",
  },

  paletteList: {
    marginTop: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  paletteRow: {
    width: "100%",
    height: 40,
    padding:
      "0 18px",
    border:
      "1px solid #D9D9D9",
    outline: "none",
    boxShadow: "none",
    WebkitAppearance:
      "none",
    appearance: "none",
    borderRadius: 8,
    backgroundColor:
      "#FFFFFF",
    display: "flex",
    alignItems: "center",
    boxSizing:
      "border-box",
    cursor: "pointer",
    textAlign: "left",
    WebkitTapHighlightColor:
      "transparent",
  },

  paletteRowSelected: {
    borderColor:
      "#D8E6FF",
    backgroundColor:
      "#D8E6FF",
    outline: "none",
    boxShadow: "none",
  },

  paletteColors: {
    width: 160,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },

  paletteColor: {
    width: 24,
    height: 24,
    border:
      "1px solid #D9D9D9",
    borderRadius: "50%",
    boxSizing:
      "border-box",
    flexShrink: 0,
  },

  paletteName: {
    marginLeft: 16,
    color: "#1A1A22",
    fontSize: 12,
  },

  customPalette: {
    padding: "12px 0 0",
  },

  customColors: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  customColorButton: {
    width: 40,
    height: 40,
    padding: 0,
    border: "1px solid #E0E0E0",
    borderRadius: 7,
    backgroundColor: "#F4F4F4",
    boxSizing: "border-box",
    overflow: "hidden",
    cursor: "pointer",
  },

  customColorButtonSelected: {
    borderColor: "#CFCFCF",
    boxShadow: "0 0 0 1px rgba(26,26,34,0.06)",
  },

  customColorSwatch: {
    display: "block",
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },

  colorPickerWrap: {
    marginTop: 12,
  },

  customDescription: {
    margin: "10px 0 0",
    color: "#777777",
    fontSize: 13,
    lineHeight: 1.5,
  },

  artistCard: {
    height: 203,
    padding: "16px 20px",
  },

  artistList: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 163px))",
    gap: 20,
    alignItems: "center",
  },

  artistItem: {
    width: 163,
    height: 128,
    padding: "20px 16px",
    border: "1px solid #E8E8E8",
    outline: "none",
    boxShadow: "none",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    boxSizing: "border-box",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },

  artistItemSelected: {
    borderColor: "#5B6CFF",
    backgroundColor: "#D8E6FF",
  },

  artistLabel: {
    color: "#666666",
    fontSize: 16,
    whiteSpace: "nowrap",
  },

  artistLabelSelected: {
    color: "#1A1A22",
    fontWeight: 600,
  },

  lightingCard: {
    height: 203,
    padding: "16px 20px",
  },

  lightingList: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 163px))",
    gap: 20,
    alignItems: "center",
  },

  lightingItem: {
    width: 163,
    height: 128,
    padding:
      "20px 16px",
    border:
      "1px solid #E8E8E8",
    outline: "none",
    boxShadow: "none",
    WebkitAppearance:
      "none",
    appearance: "none",
    borderRadius: 20,
    backgroundColor:
      "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent:
      "center",
    gap: 12,
    boxSizing:
      "border-box",
    cursor: "pointer",
    WebkitTapHighlightColor:
      "transparent",
  },

  lightingItemSelected: {
    borderColor:
      "#D8E6FF",
    backgroundColor:
      "#D8E6FF",
    outline: "none",
    boxShadow: "none",
  },

  lightingIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor:
      "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
  },

  lightingIcon: {
    display: "block",
    maxWidth: 60,
    maxHeight: 60,
    objectFit: "contain",
    pointerEvents: "none",
  },

  lightingLabel: {
    color: "#666666",
    fontSize: 16,
    whiteSpace: "nowrap",
  },

  moodCard: {
    height: 278,
    padding:
      "16px 20px",
  },

  textareaWrap: {
    position: "relative",
    width: "100%",
    height: 208,
    marginTop: 12,
  },

  textarea: {
    width: "100%",
    height: "90%",
    padding:
      "12px 10px 26px",
    border: "none",
    outline: "none",
    boxShadow: "none",
    borderRadius: 8,
    resize: "none",
    backgroundColor:
      "#F5F6F8",
    color: "#1A1A22",
    fontFamily:
      "'Pretendard', sans-serif",
    fontSize: 16,
    lineHeight: 1.5,
    boxSizing:
      "border-box",
  },

  characterCount: {
    position: "absolute",
    right: 8,
    bottom: 6,
    color: "#666666",
    fontSize: 12,
    pointerEvents: "none",
  },

  footer: {
    margin:
      "26px 32px 0",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
  },
};
