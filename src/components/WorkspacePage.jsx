import {
  Minus,
  Plus,
  Settings,
  Star,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import TopBar from "./TopBar";
import Chip from "./Chip";
import Button from "./Button";
import StageDropdown from "./StageDropdown";

import {
  objectCategories,
  stageTypes,
} from "../data";

import { getPresetAssets } from "../services/presetAssetService";


export default function WorkspacePage({
  project,
  setProject,

  objects = [],

  onAddObject,

  onRenderSetting,
  onGenerate,
  onBack,

  selectedObjectId,
  setSelectedObjectId,

  onUpdateObject,
  onRemoveObject,

  onMoveLayer,
  onLogoClick,
}) {
  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] = useState("furniture");

  const [presetAssets, setPresetAssets] = useState([]);
  const [presetAssetsLoading, setPresetAssetsLoading] = useState(false);
  const [presetAssetsError, setPresetAssetsError] = useState("");

  const [
    draggingLayerId,
    setDraggingLayerId,
  ] = useState(null);

  const [zoom, setZoom] =
    useState(1);

  const layerListRef =
    useRef(null);

  const canvasSceneRef =
    useRef(null);

  const layerMoveLockRef =
    useRef(false);


  /*
   * ================================
   * DATA
   * ================================
   */

  const selectedCategory =
    objectCategories.find(
      (category) =>
        category.id ===
        selectedCategoryId
    );

  const selectedObject =
    objects.find(
      (object) =>
        object.id ===
        selectedObjectId
    ) || null;


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


  /*
   * ================================
   * FIRESTORE PRESET ASSETS
   * ================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadPresetAssets() {
      const space = project?.keywords?.space;
      const worldview = project?.keywords?.worldview;

      if (!space || !worldview) {
        setPresetAssets([]);
        return;
      }

      try {
        setPresetAssetsLoading(true);
        setPresetAssetsError("");
        const assets = await getPresetAssets({
          category: selectedCategoryId,
          space,
          worldview,
        });
        if (!cancelled) setPresetAssets(assets);
      } catch (error) {
        console.error("[Preset Assets] 불러오기 실패:", error);
        if (!cancelled) {
          setPresetAssets([]);
          setPresetAssetsError("저장된 소품을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setPresetAssetsLoading(false);
      }
    }

    loadPresetAssets();
    return () => { cancelled = true; };
  }, [selectedCategoryId, project?.keywords?.space, project?.keywords?.worldview]);


  /*
   * ================================
   * OBJECT MOVE
   * ================================
   */

  const handleObjectPointerDown = (
    event,
    object
  ) => {
    event.stopPropagation();
    event.preventDefault();

    setSelectedObjectId(
      object.id
    );

    const startPointerX =
      event.clientX;

    const startPointerY =
      event.clientY;

    const startObjectX =
      object.x;

    const startObjectY =
      object.y;


    const handlePointerMove = (
      moveEvent
    ) => {
      const deltaX =
        (moveEvent.clientX -
          startPointerX) /
        zoom;

      const deltaY =
        (moveEvent.clientY -
          startPointerY) /
        zoom;


      onUpdateObject?.(
        object.id,
        {
          x:
            startObjectX +
            deltaX,

          y:
            startObjectY +
            deltaY,
        }
      );
    };


    const handlePointerUp =
      () => {
        window.removeEventListener(
          "pointermove",
          handlePointerMove
        );

        window.removeEventListener(
          "pointerup",
          handlePointerUp
        );

        window.removeEventListener(
          "pointercancel",
          handlePointerUp
        );
      };


    window.addEventListener(
      "pointermove",
      handlePointerMove
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    window.addEventListener(
      "pointercancel",
      handlePointerUp
    );
  };


  /*
   * ================================
   * OBJECT RESIZE
   * ================================
   */

  const handleResizePointerDown = (
    event,
    object
  ) => {
    event.stopPropagation();
    event.preventDefault();

    setSelectedObjectId(
      object.id
    );

    const startPointerX =
      event.clientX;

    const startPointerY =
      event.clientY;

    const startWidth =
      object.width;

    const startHeight =
      object.height;

    const aspectRatio =
      object.width /
      object.height;


    const handlePointerMove = (
      moveEvent
    ) => {
      const deltaX =
        (moveEvent.clientX -
          startPointerX) /
        zoom;

      const deltaY =
        (moveEvent.clientY -
          startPointerY) /
        zoom;


      const mainDelta =
        Math.abs(deltaX) >
        Math.abs(deltaY)
          ? deltaX
          : deltaY;


      const nextWidth =
        Math.max(
          40,
          startWidth +
            mainDelta
        );


      const nextHeight =
        Math.max(
          40,
          nextWidth /
            aspectRatio
        );


      onUpdateObject?.(
        object.id,
        {
          width:
            nextWidth,

          height:
            nextHeight,
        }
      );
    };


    const handlePointerUp =
      () => {
        window.removeEventListener(
          "pointermove",
          handlePointerMove
        );

        window.removeEventListener(
          "pointerup",
          handlePointerUp
        );

        window.removeEventListener(
          "pointercancel",
          handlePointerUp
        );
      };


    window.addEventListener(
      "pointermove",
      handlePointerMove
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    window.addEventListener(
      "pointercancel",
      handlePointerUp
    );
  };


  /*
   * ================================
   * LAYER DRAG
   * ================================
   */

  const handleLayerPointerDown = (
    event,
    object
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setSelectedObjectId(
      object.id
    );

    setDraggingLayerId(
      object.id
    );


    const pointerId =
      event.pointerId;

    const pressedElement =
      event.currentTarget;


    try {
      pressedElement
        .setPointerCapture?.(
          pointerId
        );
    } catch {
      // ignore
    }


    const handlePointerMove = (
      moveEvent
    ) => {
      const layerList =
        layerListRef.current;

      if (!layerList) {
        return;
      }


      const listRect =
        layerList
          .getBoundingClientRect();


      const pointerX =
        moveEvent.clientX;

      const pointerY =
        moveEvent.clientY;


      /*
       * Layers 영역 내부에서만 이동
       */

      const insideLayerList =
        pointerX >=
          listRect.left &&
        pointerX <=
          listRect.right &&
        pointerY >=
          listRect.top &&
        pointerY <=
          listRect.bottom;


      if (!insideLayerList) {
        return;
      }


      const layerRows = [
        ...layerList
          .querySelectorAll(
            "[data-layer-id]"
          ),
      ];


      const draggedIndex =
        layerRows.findIndex(
          (row) =>
            row.dataset.layerId ===
            object.id
        );


      if (
        draggedIndex === -1
      ) {
        return;
      }


      /*
       * 위로 이동
       */

      if (
        draggedIndex > 0
      ) {
        const previousRow =
          layerRows[
            draggedIndex - 1
          ];


        const previousRect =
          previousRow
            .getBoundingClientRect();


        const previousCenter =
          previousRect.top +
          previousRect.height /
            2;


        if (
          pointerY <
            previousCenter &&
          !layerMoveLockRef.current
        ) {
          layerMoveLockRef.current =
            true;


          onMoveLayer?.(
            object.id,
            "up"
          );


          window.setTimeout(
            () => {
              layerMoveLockRef.current =
                false;
            },
            80
          );


          return;
        }
      }


      /*
       * 아래로 이동
       */

      if (
        draggedIndex <
        layerRows.length - 1
      ) {
        const nextRow =
          layerRows[
            draggedIndex + 1
          ];


        const nextRect =
          nextRow
            .getBoundingClientRect();


        const nextCenter =
          nextRect.top +
          nextRect.height /
            2;


        if (
          pointerY >
            nextCenter &&
          !layerMoveLockRef.current
        ) {
          layerMoveLockRef.current =
            true;


          onMoveLayer?.(
            object.id,
            "down"
          );


          window.setTimeout(
            () => {
              layerMoveLockRef.current =
                false;
            },
            80
          );
        }
      }
    };


    const handlePointerUp =
      () => {
        setDraggingLayerId(
          null
        );


        layerMoveLockRef.current =
          false;


        try {
          pressedElement
            .releasePointerCapture?.(
              pointerId
            );
        } catch {
          // ignore
        }


        window.removeEventListener(
          "pointermove",
          handlePointerMove
        );

        window.removeEventListener(
          "pointerup",
          handlePointerUp
        );

        window.removeEventListener(
          "pointercancel",
          handlePointerUp
        );
      };


    window.addEventListener(
      "pointermove",
      handlePointerMove
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    window.addEventListener(
      "pointercancel",
      handlePointerUp
    );
  };


  /*
   * ================================
   * FLIP
   * ================================
   */

  const handleFlipHorizontal =
    () => {
      if (!selectedObject) {
        return;
      }


      onUpdateObject?.(
        selectedObject.id,
        {
          flipX:
            !selectedObject.flipX,
        }
      );
    };


  /*
   * ================================
   * ZOOM
   * ================================
   */

  const changeZoom = (
    amount
  ) => {
    setZoom((previous) => {
      const next =
        previous +
        amount;


      return Math.min(
        2,
        Math.max(
          0.5,
          next
        )
      );
    });
  };


  /*
   * ================================
   * OPEN AI RENDER SETTINGS
   * ================================
   */

  const handleOpenRenderSetting =
    () => {
      const scene =
        canvasSceneRef.current;

      if (scene) {
        setProject?.(
          (previous) => ({
            ...previous,

            editorCanvasSize: {
              width:
                scene.offsetWidth || 1,

              height:
                scene.offsetHeight || 1,
            },
          })
        );
      }


      onRenderSetting?.();
    };


  return (
    <div style={styles.page}>
      <TopBar onLogoClick={onLogoClick} />


      {/* =========================
          PROJECT HEADER
      ========================= */}

      <header
        style={
          styles.projectHeader
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
              style={
                styles.backButton
              }
              onClick={
                onBack
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
                styles.projectName
              }
            >
              {project?.title ||
                "새 프로젝트"}
            </span>
          </div>


          <div
            style={
              styles.keywordRow
            }
          >
            <span
              style={
                styles.keywordTitle
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
        </div>


        <div
          style={
            styles.actions
          }
        >
          <StageDropdown
            stageTypes={
              stageTypes
            }
            selectedStage={
              project?.stageType
            }
            onSelect={(
              stage
            ) => {
              setProject(
                (
                  previous
                ) => ({
                  ...previous,

                  stageType:
                    stage,
                })
              );
            }}
          />


          <Button
            variant="secondary"
            onClick={
              onGenerate
            }
            icon={
              <Star
                size={20}
              />
            }
          >
            바로 생성
          </Button>


          <Button
            onClick={
              handleOpenRenderSetting
            }
            icon={
              <Settings
                size={20}
              />
            }
          >
            AI 렌더 세부 설정
          </Button>
        </div>
      </header>


      {/* =========================
          EDITOR
      ========================= */}

      <main
        style={
          styles.editor
        }
      >

        {/* CATEGORY */}

        <nav
          style={
            styles.categoryNav
          }
        >
          {objectCategories.map(
            (category) => {
              const active =
                selectedCategoryId ===
                category.id;


              return (
                <button
                  key={
                    category.id
                  }
                  type="button"
                  onClick={() =>
                    setSelectedCategoryId(
                      category.id
                    )
                  }
                  style={{
                    ...styles.categoryButton,

                    ...(active
                      ? styles.categoryButtonActive
                      : {}),
                  }}
                >
                  <img
                    src={
                      active
                        ? category.activeIcon
                        : category.icon
                    }
                    alt={
                      category.name
                    }
                    style={
                      styles.categoryIcon
                    }
                  />


                  <span>
                    {
                      category.name
                    }
                  </span>
                </button>
              );
            }
          )}
        </nav>


        {/* ASSET PANEL */}

        <aside style={styles.assetPanel}>
          <div style={styles.assetHeader}>
            <h2 style={styles.panelTitle}>
              {selectedCategory?.name || "소품"}
            </h2>
          </div>

          <div style={styles.assetGrid}>
            {presetAssetsLoading && (
              <p style={styles.errorText}>소품 불러오는 중...</p>
            )}

            {!presetAssetsLoading && presetAssetsError && (
              <p style={styles.errorText}>{presetAssetsError}</p>
            )}

            {!presetAssetsLoading && !presetAssetsError && presetAssets.length === 0 && (
              <p style={styles.errorText}>저장된 소품이 없습니다.</p>
            )}

            {presetAssets.map((asset) => (
              <button
                key={`preset-${asset.id}`}
                type="button"
                style={styles.assetCard}
                onClick={() =>
                  onAddObject?.({
                    ...asset,
                    assetGroupId: asset.id,
                    name: asset.koreanName || asset.name,
                    selectedView: asset.viewType || "front",
                  })
                }
              >
                <img
                  src={asset.imageUrl}
                  alt={asset.koreanName || asset.name}
                  style={styles.assetImage}
                />
                <span style={styles.assetName}>
                  {asset.koreanName || asset.name}
                </span>
              </button>
            ))}
          </div>
        </aside>


        {/* =========================
            CANVAS
        ========================= */}

        <section
          style={
            styles.canvasArea
          }
        >

          <div
            style={
              styles.zoomControls
            }
          >
            <button
              type="button"
              style={
                styles.zoomButton
              }
              onClick={() =>
                changeZoom(-0.1)
              }
            >
              <Minus
                size={16}
              />
            </button>


            <span
              style={
                styles.zoomValue
              }
            >
              {Math.round(
                zoom * 100
              )}
              %
            </span>


            <button
              type="button"
              style={
                styles.zoomButton
              }
              onClick={() =>
                changeZoom(0.1)
              }
            >
              <Plus
                size={16}
              />
            </button>
          </div>


          <div
            ref={
              canvasSceneRef
            }
            style={{
              ...styles.canvasScene,

              transform:
                `scale(${zoom})`,
            }}

            /*
             * 빈 캔버스를 누르면
             * 선택 해제
             */
            onPointerDown={() => {
              setSelectedObjectId(
                null
              );
            }}
          >

            {project
              ?.stageType
              ?.imageUrl && (
              <img
                src={
                  project
                    .stageType
                    .imageUrl
                }
                alt={
                  project
                    .stageType
                    .name
                }
                style={
                  styles.stageImage
                }
              />
            )}


            {objects.map(
              (
                object,
                index
              ) => {
                const selected =
                  selectedObjectId ===
                  object.id;


                return (
                  <div
                    key={
                      object.id
                    }

                    onPointerDown={(
                      event
                    ) => {
                      event.stopPropagation();


                      handleObjectPointerDown(
                        event,
                        object
                      );
                    }}

                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();


                      setSelectedObjectId(
                        object.id
                      );
                    }}

                    style={{
                      ...styles.canvasObjectBox,

                      left:
                        object.x,

                      top:
                        object.y,

                      width:
                        object.width,

                      height:
                        object.height,

                      zIndex:
                        object.zIndex ||
                        index + 1,

                      /*
                       * 선택되었을 때만
                       * 파란 outline 표시
                       */
                      outline:
                        selected
                          ? "1px solid #5B6CFF"
                          : "none",

                      outlineOffset: 0,
                    }}
                  >
                    <img
                      src={
                        object.imageUrl
                      }
                      alt={
                        object.name
                      }
                      draggable={
                        false
                      }
                      style={{
                        ...styles.canvasObjectImage,

                        transform:
                          object.flipX
                            ? "scaleX(-1)"
                            : "scaleX(1)",
                      }}
                    />


                    {selected && (
                      <button
                        type="button"
                        aria-label="크기 조절"
                        style={
                          styles.resizeHandle
                        }
                        onPointerDown={(
                          event
                        ) =>
                          handleResizePointerDown(
                            event,
                            object
                          )
                        }
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </section>


        {/* =========================
            RIGHT PANEL
        ========================= */}

        <aside
          style={
            styles.propertyPanel
          }
        >

          {/* Object Transform */}

          <div
            style={
              styles.transformHeader
            }
          >
            <h2
              style={
                styles.transformTitle
              }
            >
              Object Transform
            </h2>


            <button
              type="button"
              disabled={
                !selectedObject
              }
              onClick={
                handleFlipHorizontal
              }
              aria-label="좌우 반전"
              title="좌우 반전"
              style={{
                ...styles.flipButton,

                ...(selectedObject?.flipX
                  ? styles.flipButtonActive
                  : {}),

                ...(!selectedObject
                  ? styles.flipButtonDisabled
                  : {}),
              }}
            >
              
<img
  src="/icons/flip-horizontal.svg"
  alt=""
  draggable={false}
  style={styles.flipIcon}
/>
            </button>
          </div>


          {/* Preview */}

          <div
            style={
              styles.previewBox
            }
          >
            {selectedObject?.imageUrl && (
              <img
                src={
                  selectedObject.imageUrl
                }
                alt={
                  selectedObject.name
                }
                draggable={
                  false
                }
                style={{
                  ...styles.previewImage,

                  transform:
                    selectedObject.flipX
                      ? "scaleX(-1)"
                      : "scaleX(1)",
                }}
              />
            )}
          </div>


          {/* Name */}

          <label
            style={
              styles.label
            }
          >
            NAME
          </label>


          <input
            style={
              styles.input
            }
            value={
              selectedObject?.name ||
              ""
            }
            placeholder="Prop Name"
            readOnly
          />


          {/* Width / Height */}

          <div
            style={
              styles.inputRow
            }
          >
            <div>
              <label
                style={
                  styles.label
                }
              >
                WIDTH
              </label>


              <input
                style={
                  styles.smallInput
                }
                value={
                  selectedObject
                    ? Math.round(
                        selectedObject.width
                      )
                    : 0
                }
                readOnly
              />
            </div>


            <div>
              <label
                style={
                  styles.label
                }
              >
                HEIGHT
              </label>


              <input
                style={
                  styles.smallInput
                }
                value={
                  selectedObject
                    ? Math.round(
                        selectedObject.height
                      )
                    : 0
                }
                readOnly
              />
            </div>
          </div>


          {/* Remove */}

          <button
            type="button"
            disabled={
              !selectedObject
            }
            onClick={() => {
              if (
                selectedObject
              ) {
                onRemoveObject?.(
                  selectedObject.id
                );
              }
            }}
            style={{
              ...styles.removeButton,

              ...(selectedObject
                ? styles.removeButtonActive
                : {}),
            }}
          >
            <img
              src="/icons/trash.svg"
              alt=""
              draggable={
                false
              }
              style={
                styles.trashIcon
              }
            />

            캔버스에서 제거
          </button>


          <div
            style={
              styles.divider
            }
          />


          {/* ======================
              LAYERS
          ====================== */}

          <div
            style={
              styles.layerSection
            }
          >
            <div
              style={
                styles.layerHeader
              }
            >
              <h3
                style={
                  styles.layerTitle
                }
              >
                Layers
              </h3>
            </div>


            <div
              ref={
                layerListRef
              }
              style={
                styles.layerList
              }
            >
              {[...objects]
                .reverse()
                .map(
                  (object) => {
                    const selected =
                      selectedObjectId ===
                      object.id;

                    const dragging =
                      draggingLayerId ===
                      object.id;


                    return (
                      <div
                        key={
                          object.id
                        }

                        data-layer-id={
                          object.id
                        }

                        role="button"
                        tabIndex={0}

                        onClick={() =>
                          setSelectedObjectId(
                            object.id
                          )
                        }

                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                              "Enter" ||
                            event.key ===
                              " "
                          ) {
                            event.preventDefault();


                            setSelectedObjectId(
                              object.id
                            );
                          }
                        }}

                        onPointerDown={(
                          event
                        ) =>
                          handleLayerPointerDown(
                            event,
                            object
                          )
                        }

                        style={{
                          ...styles.layerItem,

                          ...(selected
                            ? styles.layerItemSelected
                            : {}),

                          ...(dragging
                            ? styles.layerItemDragging
                            : {}),
                        }}
                      >
                        <img
                          src={
                            object.imageUrl
                          }
                          alt={
                            object.name
                          }
                          draggable={
                            false
                          }
                          style={{
                            ...styles.layerThumbnail,

                            transform:
                              object.flipX
                                ? "scaleX(-1)"
                                : "scaleX(1)",
                          }}
                        />


                        <span
                          style={
                            styles.layerName
                          }
                        >
                          {
                            object.koreanName || object.name
                          }
                        </span>


                        <span
                          style={
                            styles.layerDragHandle
                          }
                        >
                          ⋮⋮
                        </span>
                      </div>
                    );
                  }
                )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}


/*
 * ===================================
 * STYLES
 * ===================================
 */

const styles = {
  page: {
    width: "100%",
    height: "100vh",

    backgroundColor:
      "#FFFFFF",

    fontFamily:
      "'Pretendard', sans-serif",

    color: "#1A1A22",

    overflow: "hidden",
  },


  /*
   * HEADER
   */

  projectHeader: {
    width: "100%",
    height: 98,

    padding:
      "16px 32px",

    borderBottom:
      "1px solid #E8E8E8",

    backgroundColor:
      "#FFFFFF",

    display: "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    boxSizing:
      "border-box",
  },


  projectInfo: {
    display: "flex",
    flexDirection:
      "column",
    gap: 12,
  },


  breadcrumb: {
    display: "flex",
    alignItems:
      "center",
    gap: 12,
  },


  backButton: {
    padding: 0,
    border: "none",
    backgroundColor:
      "transparent",

    color: "#666666",

    fontSize: 14,

    cursor: "pointer",
  },


  breadcrumbArrow: {
    fontSize: 22,
  },


  projectName: {
    fontSize: 14,
    fontWeight: 500,
  },


  keywordRow: {
    display: "flex",
    alignItems:
      "center",
    gap: 14,
  },


  keywordTitle: {
    fontSize: 16,
    fontWeight: 600,
  },


  keywordList: {
    display: "flex",
    alignItems:
      "center",
    gap: 8,
  },


  actions: {
    display: "flex",
    alignItems:
      "center",
    gap: 14,
  },


  /*
   * EDITOR
   */

  editor: {
    height:
      "calc(100vh - 170px)",

    minHeight: 0,

    display: "grid",

    gridTemplateColumns:
      "88px 256px minmax(0, 1fr) 280px",

    overflow: "hidden",
  },


  /*
   * CATEGORY
   */

  categoryNav: {
    padding:
      "16px 8px",

    backgroundColor:
      "#F7F7F8",

    display: "flex",

    flexDirection:
      "column",

    gap: 8,

    overflowY: "auto",
  },


  categoryButton: {
    width: 72,
    minHeight: 76,

    padding:
      "12px 4px",

    border: "none",

    borderRadius: 6,

    backgroundColor:
      "transparent",

    color: "#666666",

    display: "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap: 8,

    fontFamily:
      "'Pretendard', sans-serif",

    fontSize: 13,

    cursor: "pointer",
  },


  categoryButtonActive: {
    backgroundColor:
      "#5B6CFF",

    color: "#FFFFFF",
  },


  categoryIcon: {
    width: 32,
    height: 32,
    objectFit:
      "contain",
  },


  /*
   * ASSET
   */

  assetPanel: {
    padding:
      "16px 20px",

    borderRight:
      "1px solid #E8E8E8",

    overflowY: "auto",

    boxSizing:
      "border-box",
  },


  assetHeader: {
    marginBottom: 16,
  },


  panelTitle: {
    margin:
      "0 0 12px",

    fontSize: 20,

    fontWeight: 600,
  },


  generateButton: {
    width: "100%",
    height: 38,

    borderRadius: 10,

    border:
      "1px solid #5B6CFF",

    backgroundColor:
      "#D8E6FF",

    color: "#1A1A22",

    fontFamily:
      "'Pretendard', sans-serif",

    fontSize: 14,
    fontWeight: 600,

    cursor: "pointer",
  },


  generateButtonDisabled: {
    borderColor:
      "#E8E8E8",

    backgroundColor:
      "#F3F3F3",

    color: "#999999",

    cursor:
      "not-allowed",
  },


  errorText: {
    margin:
      "0 0 12px",

    fontSize: 12,

    color: "#D92D20",
  },


  assetGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(2, 100px)",

    gap: 16,
  },


  assetCard: {
    width: 100,

    padding: 0,

    border: "none",

    backgroundColor:
      "transparent",

    color: "#666666",

    fontSize: 12,

    cursor: "pointer",
  },


  assetImage: {
    width: 100,
    height: 100,

    marginBottom: 6,

    borderRadius: 8,

    border:
      "1px solid #E8E8E8",

    backgroundColor:
      "#FFFFFF",

    objectFit:
      "contain",
  },


  assetName: {
    display: "block",

    overflow: "hidden",

    whiteSpace:
      "nowrap",

    textOverflow:
      "ellipsis",
  },


  /*
   * CANVAS
   */

  canvasArea: {
    position:
      "relative",

    minWidth: 0,
    minHeight: 0,

    overflow: "hidden",

    backgroundColor:
      "#F5F6F8",
  },


  canvasScene: {
    position:
      "absolute",

    inset: 0,

    transformOrigin:
      "center center",

    transition:
      "transform 0.1s ease",
  },


  stageImage: {
    position:
      "absolute",

    inset: 0,

    width: "100%",
    height: "100%",

    objectFit: "cover",

    userSelect: "none",

    pointerEvents:
      "none",
  },


  zoomControls: {
    position:
      "absolute",

    top: 16,
    left: 16,

    zIndex: 100,

    height: 36,

    padding:
      "0 8px",

    borderRadius: 10,

    border:
      "1px solid #E8E8E8",

    backgroundColor:
      "#FFFFFF",

    display: "flex",

    alignItems:
      "center",

    gap: 6,
  },


  zoomButton: {
    width: 24,
    height: 24,

    padding: 0,

    border: "none",

    backgroundColor:
      "transparent",

    display: "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    cursor: "pointer",
  },


  zoomValue: {
    width: 42,

    fontSize: 12,

    textAlign:
      "center",
  },


  /*
   * 중요:
   *
   * 여기에는 기본 border 자체가 없습니다.
   *
   * 따라서 선택하지 않은 오브젝트는
   * 어떠한 검정/회색 라인도 생기지 않습니다.
   */

  canvasObjectBox: {
    position:
      "absolute",

    border: "none",

    outline: "none",

    background:
      "transparent",

    cursor: "move",

    boxSizing:
      "border-box",

    touchAction:
      "none",

    userSelect:
      "none",
  },


  canvasObjectImage: {
    display: "block",

    width: "100%",
    height: "100%",

    border: "none",
    outline: "none",

    objectFit:
      "contain",

    pointerEvents:
      "none",

    userSelect:
      "none",

    transformOrigin:
      "center center",
  },


  resizeHandle: {
    position:
      "absolute",

    right: -6,
    bottom: -6,

    width: 12,
    height: 12,

    padding: 0,

    borderRadius:
      "50%",

    border:
      "2px solid #FFFFFF",

    backgroundColor:
      "#5B6CFF",

    cursor:
      "nwse-resize",

    touchAction:
      "none",
  },


  /*
   * RIGHT PROPERTY PANEL
   *
   * 전체 스크롤 제거
   */

  propertyPanel: {
    height: "100%",

    minHeight: 0,

    padding:
      "24px 20px 0",

    borderLeft:
      "1px solid #E8E8E8",

    boxSizing:
      "border-box",

    display: "flex",

    flexDirection:
      "column",

    /*
     * 전체 패널 자체는
     * 절대 스크롤하지 않음
     */
    overflow: "hidden",

    backgroundColor:
      "#FFFFFF",
  },


  /*
   * OBJECT TRANSFORM
   */

  transformHeader: {
    width: "100%",

    marginBottom: 12,

    flexShrink: 0,

    display: "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",
  },


  transformTitle: {
    margin: 0,

    fontSize: 20,

    fontWeight: 600,

    color: "#1A1A22",
  },


  /*
   * 좌우 반전 버튼
   * Line = #D9D9D9
   */

  flipButton: {
    width: 34,
    height: 34,

    padding: 0,

    flexShrink: 0,

    border:
      "1px solid #D9D9D9",

    borderRadius: 7,

    backgroundColor:
      "#FFFFFF",

    display: "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    cursor: "pointer",

    boxSizing:
      "border-box",
  },



flipButtonActive: {
  borderColor: "#D9D9D9",
  backgroundColor: "#F3F3F3",
},


flipIcon: {
  width: 26,
  height: 26,

  display: "block",
  objectFit: "contain",

  pointerEvents: "none",
  userSelect: "none",
},


  /*
   * 미리보기 라인
   */

  previewBox: {
    width: "100%",
    height: 132,

    flexShrink: 0,

    borderRadius: 8,

    border:
      "1px solid #D9D9D9",

    backgroundColor:
      "#FFFFFF",

    display: "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    overflow: "hidden",

    boxSizing:
      "border-box",
  },


  previewImage: {
    maxWidth: "100%",
    maxHeight: "100%",

    border: "none",
    outline: "none",

    objectFit:
      "contain",

    transformOrigin:
      "center center",
  },


  label: {
    display: "block",

    margin:
      "10px 0 6px",

    flexShrink: 0,

    fontSize: 12,

    color: "#666666",
  },


  /*
   * NAME 라인
   */

  input: {
    width: "100%",
    height: 38,

    flexShrink: 0,

    padding:
      "0 13px",

    borderRadius: 8,

    border:
      "1px solid #D9D9D9",

    outline: "none",

    backgroundColor:
      "#FFFFFF",

    boxSizing:
      "border-box",

    fontFamily:
      "'Pretendard', sans-serif",
  },


  inputRow: {
    width: "100%",

    flexShrink: 0,

    display: "grid",

    gridTemplateColumns:
      "1fr 1fr",

    gap: 16,
  },


  /*
   * WIDTH / HEIGHT 라인
   */

  smallInput: {
    width: "100%",
    height: 38,

    padding:
      "0 13px",

    borderRadius: 8,

    border:
      "1px solid #D9D9D9",

    outline: "none",

    backgroundColor:
      "#FFFFFF",

    boxSizing:
      "border-box",

    fontFamily:
      "'Pretendard', sans-serif",
  },


  /*
   * REMOVE
   */

  removeButton: {
    width: "100%",
    height: 40,

    marginTop: 20,

    flexShrink: 0,

    borderRadius: 12,

    border:
      "1px solid #D9D9D9",

    backgroundColor:
      "#FFFFFF",

    color: "#999999",

    display: "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap: 8,

    cursor:
      "not-allowed",

    fontFamily:
      "'Pretendard', sans-serif",
  },


  removeButtonActive: {
    borderColor:
      "#D9D9D9",

    backgroundColor:
      "#FFFFFF",

    color: "#1A1A22",

    cursor: "pointer",
  },


  trashIcon: {
    width: 18,
    height: 18,

    objectFit:
      "contain",
  },


  /*
   * 구분선
   */

  divider: {
    height: 1,

    margin:
      "20px -20px 0",

    flexShrink: 0,

    backgroundColor:
      "#D9D9D9",
  },


  /*
   * =====================
   * LAYERS
   * =====================
   *
   * 여기만 남은 공간을 모두 사용
   */

  layerSection: {
    flex: 1,

    minHeight: 0,

    margin:
      "0 -20px",

    display: "flex",

    flexDirection:
      "column",

    overflow: "hidden",
  },


  /*
   * Layers 제목은 고정
   */

  layerHeader: {
    flexShrink: 0,

    padding:
      "20px 20px 12px",

    backgroundColor:
      "#FFFFFF",
  },


  layerTitle: {
    margin: 0,

    fontSize: 20,

    fontWeight: 600,

    color: "#1A1A22",
  },


  /*
   * 실제 스크롤은
   * 이 부분에만 생김
   */

  layerList: {
    flex: 1,

    minHeight: 0,

    width: "100%",

    padding:
      "0 20px 20px",

    display: "flex",

    flexDirection:
      "column",

    gap: 8,

    boxSizing:
      "border-box",

    /*
     * Layers만 세로 스크롤
     */
    overflowY: "auto",

    overflowX: "hidden",

    userSelect:
      "none",

    touchAction:
      "none",
  },


  layerItem: {
    width: "100%",

    minHeight: 36,

    flexShrink: 0,

    padding:
      "4px 8px",

    borderRadius: 6,

    border:
      "1px solid #D9D9D9",

    backgroundColor:
      "#FFFFFF",

    display: "flex",

    alignItems:
      "center",

    gap: 8,

    boxSizing:
      "border-box",

    cursor: "grab",

    userSelect:
      "none",

    touchAction:
      "none",
  },


  layerItemSelected: {
    borderColor:
      "#5B6CFF",

    backgroundColor:
      "#F5F6FF",
  },


  layerItemDragging: {
    borderColor:
      "#5B6CFF",

    backgroundColor:
      "#EEF0FF",

    opacity: 0.75,

    cursor:
      "grabbing",
  },


  layerThumbnail: {
    width: 26,
    height: 26,

    flexShrink: 0,

    borderRadius: 4,

    border: "none",

    outline: "none",

    backgroundColor:
      "transparent",

    objectFit:
      "contain",

    pointerEvents:
      "none",

    userSelect:
      "none",

    transformOrigin:
      "center center",
  },


  layerName: {
    minWidth: 0,

    flex: 1,

    fontSize: 12,

    color: "#1A1A22",

    overflow: "hidden",

    whiteSpace:
      "nowrap",

    textOverflow:
      "ellipsis",

    pointerEvents:
      "none",
  },


  layerDragHandle: {
    width: 24,

    flexShrink: 0,

    color: "#666666",

    fontSize: 14,

    textAlign:
      "center",

    pointerEvents:
      "none",
  },
};