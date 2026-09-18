import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";


export default function StageDropdown({
  stageTypes = [],
  selectedStage,
  onSelect,
}) {
  const [open, setOpen] =
    useState(false);

  const wrapperRef =
    useRef(null);


  /*
   * ===============================
   * OUTSIDE CLICK
   * ===============================
   */

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };


    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );


    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );
    };
  }, []);


  /*
   * ===============================
   * STAGE SELECT
   * ===============================
   */

  const handleStageSelect = (
    event,
    stage
  ) => {
    /*
     * 상위 pointer 이벤트와 충돌 방지
     */
    event.preventDefault();
    event.stopPropagation();


    if (!stage) {
      return;
    }


    console.log(
      "[StageDropdown] selected:",
      stage
    );


    /*
     * WorkspacePage로 선택한
     * stage 객체 전체 전달
     */
    onSelect?.(stage);


    /*
     * 선택 후 드롭다운 닫기
     */
    setOpen(false);
  };


  /*
   * ===============================
   * DROPDOWN TOGGLE
   * ===============================
   */

  const handleToggle = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();


    setOpen(
      (previous) => !previous
    );
  };


  return (
    <div
      ref={wrapperRef}
      style={styles.wrap}
    >
      {/* ===========================
          TRIGGER
      =========================== */}

      <button
        type="button"
        style={styles.trigger}
        onClick={handleToggle}
      >
        <span
          style={
            styles.triggerText
          }
        >
          {selectedStage?.shortName ||
            selectedStage?.name ||
            "Stage"}
        </span>


        {open ? (
          <ChevronUp
            size={20}
            strokeWidth={1.8}
          />
        ) : (
          <ChevronDown
            size={20}
            strokeWidth={1.8}
          />
        )}
      </button>


      {/* ===========================
          MENU
      =========================== */}

      {open && (
        <div
          style={styles.menu}
          onPointerDown={(
            event
          ) => {
            /*
             * 메뉴 내부 클릭이
             * 외부 클릭으로 처리되지 않게 함
             */
            event.stopPropagation();
          }}
        >
          <div
            style={
              styles.scrollArea
            }
          >
            {stageTypes.length ===
            0 ? (
              <div
                style={
                  styles.empty
                }
              >
                등록된 무대 유형이
                없습니다.
              </div>
            ) : (
              stageTypes.map(
                (
                  stage,
                  index
                ) => {
                  /*
                   * id가 없는 데이터도
                   * 선택 상태 비교 가능
                   */
                  const selected =
                    selectedStage?.id
                      ? selectedStage.id ===
                        stage.id
                      : selectedStage?.name ===
                        stage.name;


                  return (
                    <button
                      key={
                        stage.id ||
                        stage.name ||
                        index
                      }
                      type="button"
                      style={{
                        ...styles.option,

                        ...(selected
                          ? styles.optionSelected
                          : {}),
                      }}
                      onClick={(
                        event
                      ) =>
                        handleStageSelect(
                          event,
                          stage
                        )
                      }
                    >
                      {/* IMAGE */}

                      <div
                        style={
                          styles.thumbWrap
                        }
                      >
                        {stage.imageUrl ? (
                          <img
                            src={
                              stage.imageUrl
                            }
                            alt={
                              stage.name ||
                              stage.shortName ||
                              "Stage"
                            }
                            draggable={
                              false
                            }
                            style={
                              styles.thumb
                            }
                          />
                        ) : (
                          <div
                            style={
                              styles.thumbEmpty
                            }
                          />
                        )}
                      </div>


                      {/* TEXT */}

                      <div
                        style={
                          styles.optionText
                        }
                      >
                        <p
                          style={{
                            ...styles.optionTitle,

                            ...(selected
                              ? styles.optionTitleSelected
                              : {}),
                          }}
                        >
                          {stage.shortName ||
                            stage.name ||
                            `Stage ${
                              index +
                              1
                            }`}
                        </p>


                        {stage.description && (
                          <p
                            style={
                              styles.optionDesc
                            }
                          >
                            {
                              stage.description
                            }
                          </p>
                        )}
                      </div>
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}


/*
 * =================================
 * STYLES
 * =================================
 */

const styles = {
  wrap: {
    position: "relative",

    /*
     * 다른 Header 요소보다
     * 드롭다운 우선 표시
     */
    zIndex: 300,
  },


  trigger: {
    minWidth: 128,
    height: 44,

    borderRadius: 12,

    border:
      "1px solid #E8E8E8",

    backgroundColor:
      "#FFFFFF",

    display: "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap: 16,

    padding:
      "10px 16px",

    fontFamily:
      "'Pretendard', sans-serif",

    fontSize: 18,

    color:
      "#1A1A22",

    cursor:
      "pointer",

    boxSizing:
      "border-box",
  },


  triggerText: {
    whiteSpace:
      "nowrap",

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",
  },


  /*
   * ===============================
   * MENU
   * ===============================
   */

  menu: {
    position:
      "absolute",

    top:
      "calc(100% + 10px)",

    right: 0,

    width: 340,

    maxHeight: 325,

    padding: 12,

    borderRadius: 12,

    border:
      "1px solid #E8E8E8",

    backgroundColor:
      "#FFFFFF",

    zIndex: 1000,

    boxSizing:
      "border-box",

    boxShadow:
      "0 12px 30px rgba(0,0,0,0.08)",
  },


  scrollArea: {
    width: "100%",

    maxHeight: 299,

    overflowY:
      "auto",

    overflowX:
      "hidden",
  },


  /*
   * ===============================
   * OPTION
   * ===============================
   */

  option: {
    width: "100%",

    minHeight: 64,

    padding: 8,

    border: "none",

    borderRadius: 8,

    backgroundColor:
      "#FFFFFF",

    display: "flex",

    alignItems:
      "center",

    gap: 12,

    cursor:
      "pointer",

    textAlign:
      "left",

    boxSizing:
      "border-box",

    fontFamily:
      "'Pretendard', sans-serif",
  },


  optionSelected: {
    backgroundColor:
      "#F5F6F8",
  },


  /*
   * ===============================
   * THUMBNAIL
   * ===============================
   */

  thumbWrap: {
    width: 72,

    height: 48,

    flexShrink: 0,

    overflow:
      "hidden",

    borderRadius: 6,

    backgroundColor:
      "#F5F6F8",
  },


  thumb: {
    display:
      "block",

    width: "100%",

    height: "100%",

    objectFit:
      "cover",

    pointerEvents:
      "none",

    userSelect:
      "none",
  },


  thumbEmpty: {
    width:
      "100%",

    height:
      "100%",

    backgroundColor:
      "#F5F6F8",
  },


  /*
   * ===============================
   * TEXT
   * ===============================
   */

  optionText: {
    minWidth: 0,

    flex: 1,
  },


  optionTitle: {
    margin: 0,

    fontSize: 14,

    fontWeight: 500,

    color:
      "#1A1A22",

    lineHeight: 1.35,
  },


  optionTitleSelected: {
    fontWeight: 600,

    color:
      "#5B6CFF",
  },


  optionDesc: {
    margin:
      "4px 0 0",

    fontSize: 12,

    color:
      "#666666",

    lineHeight: 1.4,

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",
  },


  empty: {
    padding:
      "24px 12px",

    color:
      "#888888",

    fontSize: 13,

    textAlign:
      "center",
  },
};