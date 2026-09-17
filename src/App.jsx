import {
  useEffect,
  useState,
} from "react";

import ProjectListPage from "./components/ProjectListPage";
import ProjectNamePage from "./components/ProjectNamePage";
import KeywordSelectPage from "./components/KeywordSelectPage";
import StageTypeSelectPage from "./components/StageTypeSelectPage";
import WorkspacePage from "./components/WorkspacePage";
import ProjectDetailPage from "./components/ProjectDetailPage";
import RenderResultPage
  from "./components/RenderResultPage";
import AIRenderLoadingPage from "./components/AIRenderLoadingPage";

/*
 * AI 렌더 세부 설정 페이지
 */
import RenderSettingPage from "./components/RenderSettingPage";

import {
  addUsedAssetToProject,
  createProject,
  getProjects,
  updateProject,
} from "./services/projectService";

import { saveCompleteRenderProject } from "./services/renderStorageService";

import {
  spaceKeywords,
  moodKeywords,
  styleKeywords,
  worldviewKeywords,
} from "./data";


import { renderStageWithAI } from "./api/renderStage";


/*
 * ===================================
 * EMPTY PROJECT
 * ===================================
 */

const createEmptyProject =
  () => ({
    id: "",

    title: "",

    keywords: {
      space: "",
      mood: "",
      style: "",
      worldview: "",
    },

    stageType: null,

    /*
     * AI 렌더 세부 설정값
     */
    renderSettings: {},
  });


export default function App() {
  /*
   * ================================
   * PAGE STATE
   * ================================
   */

  const [
    screen,
    setScreen,
  ] = useState("main");


  /*
   * ================================
   * PROJECT STATE
   * ================================
   */

  const [
    project,
    setProject,
  ] = useState(
    createEmptyProject
  );


  /*
   * ================================
   * SAVED PROJECT LIST STATE
   * ================================
   */

  const [
    projects,
    setProjects,
  ] = useState([]);

  const [
    projectsLoading,
    setProjectsLoading,
  ] = useState(true);

  const [
    nowTick,
    setNowTick,
  ] = useState(Date.now());


  /*
   * ================================
   * CANVAS STATE
   * ================================
   */

  const [
    objects,
    setObjects,
  ] = useState([]);


  const [
    selectedObjectId,
    setSelectedObjectId,
  ] = useState(null);

  

  const [
    renderResults,
    setRenderResults,
  ] = useState({
    front: null,
    side: null,
    top: null,
  });


  /*
   * ================================
   * PROJECT LIST HELPERS
   * ================================
   */

  const timestampToMillis = (
    value
  ) => {
    if (!value) {
      return 0;
    }

    if (
      typeof value?.toMillis ===
      "function"
    ) {
      return value.toMillis();
    }

    if (
      typeof value?.toDate ===
      "function"
    ) {
      return value
        .toDate()
        .getTime();
    }

    if (
      typeof value ===
        "object" &&
      typeof value.seconds ===
        "number"
    ) {
      return (
        value.seconds * 1000 +
        Math.floor(
          (value.nanoseconds || 0) /
            1000000
        )
      );
    }

    const date =
      new Date(value);

    return Number.isNaN(
      date.getTime()
    )
      ? 0
      : date.getTime();
  };


  const formatProjectTime = (
    value,
    now = Date.now()
  ) => {
    const time =
      timestampToMillis(value);

    if (!time) {
      return "";
    }

    const diffMs =
      Math.max(
        0,
        now - time
      );

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

    if (diffSeconds < 10) {
      return "방금 저장됨";
    }

    if (diffSeconds < 60) {
      return `${diffSeconds}초 전`;
    }

    if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    }

    if (diffHours < 24) {
      return `${diffHours}시간 전`;
    }

    const date =
      new Date(time);

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
  };


  const getStageTypeName = (
    stageType
  ) => {
    if (!stageType) {
      return "";
    }

    if (
      typeof stageType ===
      "string"
    ) {
      return stageType;
    }

    return (
      stageType.name ||
      stageType.label ||
      stageType.title ||
      stageType.typeName ||
      stageType.id ||
      ""
    );
  };


  const getKeywordArray = (
    keywords
  ) => {
    const keywordList =
      Array.isArray(keywords)
        ? keywords
        : [
            keywords?.space,
            keywords?.mood,
            keywords?.style,
            keywords?.worldview,
          ];

    return keywordList
      .filter(
        (keyword) =>
          typeof keyword ===
            "string" &&
          keyword.trim()
      )
      .map((keyword) => {
        /*
         * 저장값 예:
         * "지하철 (SUBWAY)"
         * "몽환적 (DREAMY)"
         *
         * 메인 카드에서는 괄호 안 영문만 제거:
         * "지하철"
         * "몽환적"
         *
         * Y2K / SF처럼 괄호가 없는 고유 키워드는
         * 사라지지 않도록 그대로 유지합니다.
         */
        return keyword
          .replace(
            /\s*\([^)]*\)\s*/g,
            " "
          )
          .replace(
            /\s{2,}/g,
            " "
          )
          .trim();
      })
      .filter(Boolean);
  };


  const loadProjects =
    async () => {
      try {
        setProjectsLoading(
          true
        );

        const savedProjects =
          await getProjects();

        const sortedProjects =
          [...savedProjects]
            .sort(
              (a, b) =>
                timestampToMillis(
                  b.updatedAt ||
                    b.createdAt
                ) -
                timestampToMillis(
                  a.updatedAt ||
                    a.createdAt
                )
            )
            .map(
              (
                savedProject
              ) => {
                const rawUpdatedAt =
                  savedProject
                    .updatedAt ||
                  savedProject
                    .createdAt;

                return {
                  ...savedProject,

                  /*
                   * 원본 keywords는 그대로 유지합니다.
                   * 상세 페이지 / 에디터에서는
                   * "지하철 (SUBWAY)"처럼 원본 값을 사용합니다.
                   *
                   * 메인 카드에서만 사용할 별도 표시용 배열입니다.
                   */
                  displayKeywords:
                    getKeywordArray(
                      savedProject
                        .keywords
                    ),

                  /*
                   * stageType이 객체로 저장된 경우에도
                   * 메인 카드에는 이름만 표시합니다.
                   */
                  stageType:
                    getStageTypeName(
                      savedProject
                        .stageTypeObject ||
                        savedProject
                          .stageType
                    ),

                  /*
                   * 메인 썸네일은 AI 결과의 FRONT VIEW
                   */
                  imageUrl:
                    savedProject
                      ?.renderResults
                      ?.front ||
                    savedProject
                      ?.latestRender
                      ?.results
                      ?.front
                      ?.url ||
                    savedProject
                      ?.imageUrl ||
                    "",

                  /*
                   * 카드 표시용 시간 문자열
                   */
                  updatedAt:
                    formatProjectTime(
                      rawUpdatedAt,
                      nowTick
                    ),

                  /*
                   * 상세 화면으로 열 때 필요할 수 있도록
                   * 원본 Timestamp도 보존합니다.
                   */
                  rawUpdatedAt,
                };
              }
            );

        console.log(
          "Firebase에서 불러온 프로젝트:",
          sortedProjects
        );

        setProjects(
          sortedProjects
        );
      } catch (error) {
        console.error(
          "메인 프로젝트 불러오기 실패:",
          error
        );

        setProjects([]);
      } finally {
        setProjectsLoading(
          false
        );
      }
    };


  /*
   * 앱 최초 실행 + 메인 화면으로 돌아올 때
   * Firestore 프로젝트 목록을 다시 불러옵니다.
   */
  useEffect(() => {
    if (
      screen === "main"
    ) {
      loadProjects();
    }
    // screen이 main으로 바뀔 때마다 새 목록을 불러오기 위함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);


  /*
   * 메인 화면을 열어둔 상태에서도
   * 초 → 분 → 시간 표시가 자동 갱신됩니다.
   */
  useEffect(() => {
    if (
      screen !== "main"
    ) {
      return undefined;
    }

    const timer =
      window.setInterval(
        () => {
          setNowTick(
            Date.now()
          );
        },
        1000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [screen]);


  /*
   * nowTick이 바뀔 때는 Firebase를 다시 읽지 않고
   * 현재 목록의 시간 문자열만 갱신합니다.
   */
  useEffect(() => {
    if (
      screen !== "main"
    ) {
      return;
    }

    setProjects(
      (previous) =>
        previous.map(
          (savedProject) => ({
            ...savedProject,

            updatedAt:
              formatProjectTime(
                savedProject
                  .rawUpdatedAt,
                nowTick
              ),
          })
        )
    );
  }, [nowTick, screen]);


  /*
   * ================================
   * KEYWORD HELPER
   * ================================
   */

  const isNoneKeyword = (
    value
  ) => {
    if (
      typeof value !==
      "string"
    ) {
      return false;
    }


    return (
      value.includes("없음") ||
      value
        .toUpperCase()
        .includes("NONE")
    );
  };


  const selectedSummary = [
    project.keywords.space,
    project.keywords.mood,
    project.keywords.style,
    project.keywords.worldview,
  ].filter(
    (item) =>
      item &&
      !isNoneKeyword(item)
  );


  /*
   * ================================
   * CREATE PROJECT
   * ================================
   */

  const handleCreateProject =
    () => {
      setProject(
        createEmptyProject()
      );


      setObjects([]);


      setSelectedObjectId(
        null
      );


      setRenderResults({
        front: null,
        side: null,
        top: null,
      });


      setScreen(
        "projectName"
      );
    };


  /*
   * ================================
   * PROJECT NAME
   * ================================
   */

  const handleProjectNameNext =
    async () => {
      if (
        !project.title.trim()
      ) {
        alert(
          "프로젝트명을 입력해주세요."
        );

        return;
      }


      try {
        let projectId =
          project.id;


        /*
         * Firebase에 프로젝트가
         * 아직 생성되지 않은 경우
         */

        if (!projectId) {
          projectId =
            await createProject({
              title:
                project.title.trim(),

              keywords: {
                space: "",
                mood: "",
                style: "",
                worldview: "",
              },

              stageType:
                null,

              canvasObjects:
                [],

              usedAssets:
                [],
            });


          setProject(
            (prev) => ({
              ...prev,

              id:
                projectId,
            })
          );
        }


        setScreen(
          "space"
        );
      } catch (error) {
        console.error(
          "프로젝트 생성 실패:",
          error
        );


        alert(
          "프로젝트 생성 중 오류가 발생했습니다."
        );
      }
    };


  /*
   * ================================
   * EXISTING / SAVED PROJECT OPEN
   * ================================
   *
   * 메인 페이지의 프로젝트 카드를 클릭하면
   * 프로젝트의 저장된 데이터를 현재 상태로 불러오고
   * 바로 프로젝트 상세 페이지로 이동합니다.
   *
   * ProjectListPage가 Firebase 데이터든
   * sampleProjects 데이터든 동일한 객체 형태로
   * 넘겨주기만 하면 그대로 사용할 수 있습니다.
   */

  const handleSelectProject =
    (
      selectedProject
    ) => {
      if (!selectedProject) {
        return;
      }


      /*
       * keywords가
       *
       * 1) 배열
       * ["지하철", "핑크", "기하학적"]
       *
       * 또는
       *
       * 2) 객체
       * {
       *   space: "...",
       *   mood: "...",
       *   style: "...",
       *   worldview: "..."
       * }
       *
       * 어느 형태로 저장되어 있어도 대응합니다.
       */

      const savedKeywords =
        Array.isArray(
          selectedProject
            .keywords
        )
          ? {
              space:
                selectedProject
                  .keywords?.[0] ||
                "",

              mood:
                selectedProject
                  .keywords?.[1] ||
                "",

              style:
                selectedProject
                  .keywords?.[2] ||
                "",

              worldview:
                selectedProject
                  .keywords?.[3] ||
                "",
            }
          : {
              space:
                selectedProject
                  .keywords?.space ||
                "",

              mood:
                selectedProject
                  .keywords?.mood ||
                "",

              style:
                selectedProject
                  .keywords?.style ||
                "",

              worldview:
                selectedProject
                  .keywords
                  ?.worldview ||
                "",
            };


      /*
       * 선택한 프로젝트의 저장 데이터를
       * 최대한 그대로 유지합니다.
       *
       * ProjectDetailPage에서 사용하는
       * renderSettings / notes / createdAt /
       * renderResults 등의 값도 여기서 보존됩니다.
       */

      setProject({
        ...selectedProject,

        id:
          selectedProject.id ||
          "",

        title:
          selectedProject.title ||
          "",

        keywords:
          savedKeywords,

        stageType:
          selectedProject
            .stageTypeObject ||
          selectedProject
            .stageType ||
          null,

        renderSettings:
          selectedProject
            .renderSettings ||
          {},

        notes:
          selectedProject
            .notes ||
          "",
      });


      /*
       * 상세 페이지의 "사용 소품"과
       * 에디터에서 사용할 오브젝트 데이터
       */

      const savedObjects =
        Array.isArray(
          selectedProject
            .canvasObjects
        )
          ? selectedProject
              .canvasObjects
          : Array.isArray(
              selectedProject
                .objects
            )
          ? selectedProject
              .objects
          : Array.isArray(
              selectedProject
                .usedAssets
            )
          ? selectedProject
              .usedAssets
          : [];


      setObjects(
        savedObjects
      );


      /*
       * 저장된 AI 렌더 결과도
       * 프로젝트마다 개별적으로 불러옵니다.
       */

      const savedResults =
        selectedProject
          .renderResults ||
        selectedProject
          .results ||
        {};


      setRenderResults({
        front:
          savedResults.front ||
          selectedProject
            .frontImageUrl ||
          null,

        side:
          savedResults.side ||
          selectedProject
            .sideImageUrl ||
          null,

        top:
          savedResults.top ||
          selectedProject
            .topImageUrl ||
          null,
      });


      setSelectedObjectId(
        null
      );


      /*
       * 중요:
       * 메인 프로젝트 카드를 클릭하면
       * Workspace가 아니라 상세 페이지로 이동
       */

      setScreen(
        "projectDetail"
      );
    };


  /*
   * ================================
   * ADD OBJECT
   * ================================
   */

  const addObject = async (
    asset
  ) => {
    if (
      !asset?.imageUrl
    ) {
      console.error(
        "캔버스에 추가할 이미지 정보가 없습니다.",
        asset
      );

      return;
    }


    const newObject = {
      id:
        `object-${Date.now()}`,

      assetGroupId:
        asset.assetGroupId ||
        asset.id ||
        "",

      categoryId:
        asset.categoryId ||
        "",

      name:
        asset.koreanName ||
        asset.name ||
        "이름 없는 소품",

      koreanName:
        asset.koreanName ||
        asset.name ||
        "이름 없는 소품",

      imageUrl:
        asset.imageUrl,

      selectedView:
        asset.selectedView ||
        "front",


      /*
       * 캔버스 초기 위치
       */

      x: 280,
      y: 360,


      /*
       * 초기 크기
       */

      width: 160,
      height: 100,


      rotation: 0,


      /*
       * 좌우 반전
       */

      flipX: false,


      /*
       * 새로 추가된 에셋은
       * 가장 위 레이어에 배치
       */

      zIndex:
        objects.length + 1,
    };


    setObjects(
      (prev) => [
        ...prev,
        newObject,
      ]
    );


    setSelectedObjectId(
      newObject.id
    );


    /*
     * Firebase 저장
     */

    if (!project.id) {
      console.warn(
        "프로젝트 ID가 없어 Firebase에 사용 소품을 저장하지 않았습니다."
      );

      return;
    }


    try {
      await addUsedAssetToProject({
        projectId:
          project.id,

        asset: {
          assetGroupId:
            newObject.assetGroupId,

          categoryId:
            newObject.categoryId,

          name:
            newObject.name,

          imageUrl:
            newObject.imageUrl,

          selectedView:
            newObject.selectedView,
        },
      });
    } catch (error) {
      console.error(
        "사용 소품 저장 실패:",
        error
      );
    }
  };


  /*
   * ================================
   * UPDATE CANVAS OBJECT
   * ================================
   */

  const updateObject = (
    objectId,
    updates
  ) => {
    setObjects(
      (prev) =>
        prev.map(
          (object) =>
            object.id ===
            objectId
              ? {
                  ...object,
                  ...updates,
                }
              : object
        )
    );
  };


  /*
   * ================================
   * REMOVE CANVAS OBJECT
   * ================================
   */

  const removeObject = (
    objectId
  ) => {
    setObjects(
      (prev) => {
        /*
         * 삭제
         */

        const filtered =
          prev.filter(
            (object) =>
              object.id !==
              objectId
          );


        /*
         * 삭제 후
         * zIndex 다시 정리
         */

        return filtered.map(
          (
            object,
            index
          ) => ({
            ...object,

            zIndex:
              index + 1,
          })
        );
      }
    );


    setSelectedObjectId(
      (
        prevSelectedId
      ) =>
        prevSelectedId ===
        objectId
          ? null
          : prevSelectedId
    );
  };


  /*
   * ================================
   * LAYER MOVE
   * ================================
   *
   * objects 배열
   *
   * index 0
   * = 가장 뒤
   *
   * 마지막 index
   * = 가장 앞
   */

  const moveLayer = (
    objectId,
    direction
  ) => {
    setObjects(
      (prev) => {
        const currentIndex =
          prev.findIndex(
            (object) =>
              object.id ===
              objectId
          );


        if (
          currentIndex === -1
        ) {
          return prev;
        }


        /*
         * up
         * =
         * 캔버스에서 앞으로
         *
         * down
         * =
         * 캔버스에서 뒤로
         */

        const targetIndex =
          direction ===
          "up"
            ? currentIndex +
              1
            : currentIndex -
              1;


        /*
         * 배열 범위 제한
         */

        if (
          targetIndex < 0 ||
          targetIndex >=
            prev.length
        ) {
          return prev;
        }


        const nextObjects = [
          ...prev,
        ];


        /*
         * 위치 교환
         */

        [
          nextObjects[
            currentIndex
          ],

          nextObjects[
            targetIndex
          ],
        ] = [
          nextObjects[
            targetIndex
          ],

          nextObjects[
            currentIndex
          ],
        ];


        /*
         * zIndex 재계산
         */

        return nextObjects.map(
          (
            object,
            index
          ) => ({
            ...object,

            zIndex:
              index + 1,
          })
        );
      }
    );
  };


  /*
   * ================================
   * MAIN
   * ================================
   */

  if (
    screen ===
    "main"
  ) {
    return (
      <ProjectListPage
        projects={
          projects
        }

        onCreate={
          handleCreateProject
        }

        onSelectProject={
          handleSelectProject
        }
      />
    );
  }


  /*
   * ================================
   * STEP 1
   * PROJECT NAME
   * ================================
   */

  if (
    screen ===
    "projectName"
  ) {
    return (
      <ProjectNamePage
        value={
          project.title
        }

        onChange={(
          value
        ) =>
          setProject(
            (prev) => ({
              ...prev,

              title:
                value,
            })
          )
        }

        onPrev={() =>
          setScreen(
            "main"
          )
        }

        onNext={
          handleProjectNameNext
        }
      />
    );
  }


  /*
   * ================================
   * STEP 2
   * SPACE
   * ================================
   */

  if (
    screen ===
    "space"
  ) {
    return (
      <KeywordSelectPage
        step={2}

        title="공간 컨셉을 선택해주세요."

        description="원하는 무대의 공간 컨셉을 선택하세요."

        options={
          spaceKeywords
        }

        selected={
          project
            .keywords
            .space
        }

        selectedSummary={
          selectedSummary
        }

        onSelect={(
          option
        ) =>
          setProject(
            (prev) => ({
              ...prev,

              keywords: {
                ...prev.keywords,

                space:
                  option,
              },
            })
          )
        }

        onPrev={() =>
          setScreen(
            "projectName"
          )
        }

        onNext={() =>
          setScreen(
            "mood"
          )
        }
      />
    );
  }


  /*
   * ================================
   * STEP 3
   * MOOD
   * ================================
   */

  if (
    screen ===
    "mood"
  ) {
    return (
      <KeywordSelectPage
        step={3}

        title="분위기를 선택해주세요"

        description="원하는 무대의 분위기를 하나 선택하세요."

        options={
          moodKeywords
        }

        selected={
          project
            .keywords
            .mood
        }

        selectedSummary={
          selectedSummary
        }

        onSelect={(
          option
        ) =>
          setProject(
            (prev) => ({
              ...prev,

              keywords: {
                ...prev.keywords,

                mood:
                  option,
              },
            })
          )
        }

        onPrev={() =>
          setScreen(
            "space"
          )
        }

        onNext={() =>
          setScreen(
            "style"
          )
        }
      />
    );
  }


  /*
   * ================================
   * STEP 4
   * STYLE
   * ================================
   */

  if (
    screen ===
    "style"
  ) {
    return (
      <KeywordSelectPage
        step={4}

        title="조형 스타일을 선택해주세요"

        description="무대의 전체적인 조형 스타일을 하나 선택하세요."

        options={
          styleKeywords
        }

        selected={
          project
            .keywords
            .style
        }

        selectedSummary={
          selectedSummary
        }

        onSelect={(
          option
        ) =>
          setProject(
            (prev) => ({
              ...prev,

              keywords: {
                ...prev.keywords,

                style:
                  option,
              },
            })
          )
        }

        onPrev={() =>
          setScreen(
            "mood"
          )
        }

        onNext={() =>
          setScreen(
            "worldview"
          )
        }
      />
    );
  }


  /*
   * ================================
   * STEP 5
   * WORLDVIEW
   * ================================
   */

  if (
    screen ===
    "worldview"
  ) {
    return (
      <KeywordSelectPage
        step={5}

        title="세계관을 선택해주세요"

        description="무대 아티스트의 이번 앨범 세계관 컨셉을 선택하세요."

        options={
          worldviewKeywords
        }

        selected={
          project
            .keywords
            .worldview
        }

        selectedSummary={
          selectedSummary
        }

        optional

        onSelect={(
          option
        ) =>
          setProject(
            (prev) => ({
              ...prev,

              keywords: {
                ...prev.keywords,

                worldview:
                  isNoneKeyword(
                    option
                  )
                    ? ""
                    : option,
              },
            })
          )
        }

        onPrev={() =>
          setScreen(
            "style"
          )
        }

        onNext={() =>
          setScreen(
            "stageType"
          )
        }
      />
    );
  }


  /*
   * ================================
   * STEP 6
   * STAGE TYPE
   * ================================
   */

  if (
    screen ===
    "stageType"
  ) {
    return (
      <StageTypeSelectPage
        selectedStageType={
          project.stageType
        }

        selectedSummary={
          selectedSummary
        }

        onSelect={(
          type
        ) =>
          setProject(
            (prev) => ({
              ...prev,

              stageType:
                type,
            })
          )
        }

        onPrev={() =>
          setScreen(
            "worldview"
          )
        }

        onNext={() =>
          setScreen(
            "workspace"
          )
        }
      />
    );
  }


  /*
   * ================================
   * PROJECT DETAIL
   * ================================
   *
   * 메인 페이지에서 프로젝트를 선택했을 때
   * 저장된 프로젝트 데이터를 보여주는 상세 페이지
   */

  if (
    screen ===
    "projectDetail"
  ) {
    return (
      <ProjectDetailPage
        project={
          project
        }

        objects={
          objects
        }

        /*
         * 프로젝트 목록으로 돌아가기
         */
        onBack={() =>
          setScreen(
            "main"
          )
        }

        /*
         * 저장된 프로젝트를
         * Workspace에서 다시 편집
         */
        onOpenEditor={() =>
          setScreen(
            "workspace"
          )
        }

        /*
         * 상세 페이지 헤더의 "저장" 버튼
         * → 메인 프로젝트 목록으로 이동
         *
         * screen이 main으로 바뀌면
         * 위의 useEffect에서 Firestore 프로젝트 목록을
         * 다시 불러옵니다.
         */
        onSaveProject={() =>
          setScreen(
            "main"
          )
        }

        /*
         * 상세 페이지의 "AI 무대 보기"
         * → 저장된 AI 렌더 결과를 3가지 뷰로 확인하는
         * RenderResultPage로 바로 이동
         */
        onOpenRender={() =>
          setScreen(
            "renderResult"
          )
        }

        /*
         * 상세 페이지 노트 저장
         *
         * 현재는 App 상태에 저장합니다.
         * Firebase update 함수가 준비되면
         * 이 위치에서 함께 저장하면 됩니다.
         */
        onSaveNotes={async (
          notes
        ) => {
          setProject(
            (
              previous
            ) => ({
              ...previous,

              notes,
            })
          );

          if (project.id) {
            try {
              await updateProject(
                project.id,
                { notes }
              );
            } catch (error) {
              console.error(
                "상세 메모 저장 실패:",
                error
              );
            }
          }
        }}
      />
    );
  }


  /*
   * ================================
   * AI RENDER LOADING
   * ================================
   */

  if (screen === "renderLoading") {
    return (
      <AIRenderLoadingPage
        projectTitle={project?.title || ""}
      />
    );
  }


  /*
   * ================================
   * AI RENDER DETAIL SETTING
   * ================================
   *
   * Workspace에서
   * AI 렌더 세부 설정 버튼을 누르면
   * 여기로 이동
   */

  if (
    screen ===
    "renderSetting"
  ) {
    return (
      <RenderSettingPage
        project={
          project
        }

        setProject={
          setProject
        }

        /*
         * 현재 Workspace에서
         * 배치한 오브젝트 전달
         */
        objects={
          objects
        }

        /*
         * 에디터로 돌아가기
         */
        onBack={() =>
          setScreen(
            "workspace"
          )
        }

        /*
         * AI 무대 렌더링 버튼
         *
         * 결과 페이지 제작 후
         * 여기서 페이지 전환 예정
         */
        onRender={async (
          renderPayload
        ) => {
          setScreen(
            "renderLoading"
          );

          try {
            /*
             * RenderSettingPage가 준비한
             * 프로젝트 데이터 + 4개 키워드 +
             * 무대 유형 이미지 + 사용자 구성 이미지 +
             * 컬러/조명/레퍼런스/무드 데이터를
             * 서버 API에 전달합니다.
             */
            const response =
              await renderStageWithAI(
                renderPayload
              );

            /*
             * 생성된 3개 뷰와 상세 페이지에서 사용하는
             * 모든 프로젝트/설정/캔버스 데이터를 Firebase에 저장합니다.
             * 큰 이미지는 Storage, 구조화 데이터와 URL은 Firestore에 저장됩니다.
             */
            const savedRender =
              await saveCompleteRenderProject({
                projectId:
                  project.id,
                project,
                objects,
                renderPayload,
                apiResponse:
                  response,
              });

            const results =
              savedRender.results;

            setRenderResults(
              results
            );

            setProject(
              (
                previous
              ) => ({
                ...previous,

                renderSettings:
                  savedRender.renderSettings,

                renderResults:
                  results,

                latestRender:
                  savedRender.latestRender,
              })
            );

            /*
             * 세 장 생성 + Firebase 저장이 완료된 뒤
             * 기존 결과 페이지의 Front / Side / Top 영역에 표시합니다.
             */
            setScreen(
              "renderResult"
            );
          } catch (error) {
            console.error(
              "AI render failed:",
              error
            );

            setScreen(
              "renderSetting"
            );

            window.alert(
              error?.message ||
                "AI 무대 렌더링에 실패했습니다."
            );
          }
        }}
      />
    );
  }


  /*
   * ================================
   * AI RENDER RESULT
   * ================================
   */

  if (
    screen ===
    "renderResult"
  ) {
    return (
      <RenderResultPage
        project={
          project
        }

        results={
          renderResults
        }

        /*
         * 결과 페이지에서 에디터로 돌아가기
         */
        onBack={() =>
          setScreen(
            "workspace"
          )
        }

        /*
         * 다시 생성
         * → AI 렌더 세부 설정 페이지로 복귀
         */
        onRegenerate={() =>
          setScreen(
            "renderSetting"
          )
        }

        /*
         * 결과 페이지의 "저장하기"
         * → 현재 프로젝트의 렌더 결과를 보존하고
         * → 완성된 프로젝트 상세 페이지로 이동
         */
        onSave={async () => {
          const nextProject = {
            ...project,
            renderResults,
          };

          setProject(
            nextProject
          );

          if (project.id) {
            try {
              await updateProject(
                project.id,
                {
                  title:
                    nextProject.title || "",
                  keywords:
                    nextProject.keywords || {},
                  stageType:
                    nextProject.stageType || null,
                  stageTypeObject:
                    typeof nextProject.stageType === "object"
                      ? nextProject.stageType
                      : null,
                  canvasObjects:
                    objects,
                  renderSettings:
                    nextProject.renderSettings || {},
                  renderResults,
                  notes:
                    nextProject.notes || "",
                }
              );
            } catch (error) {
              console.error(
                "프로젝트 상세 데이터 저장 실패:",
                error
              );
            }
          }

          setScreen(
            "projectDetail"
          );
        }}
      />
    );
  }


  /*
   * ================================
   * WORKSPACE
   * ================================
   */

  return (
    <WorkspacePage
      project={
        project
      }

      setProject={
        setProject
      }

      objects={
        objects
      }

      selectedObjectId={
        selectedObjectId
      }

      setSelectedObjectId={
        setSelectedObjectId
      }

      onAddObject={
        addObject
      }

      onUpdateObject={
        updateObject
      }

      onRemoveObject={
        removeObject
      }

      onMoveLayer={
        moveLayer
      }

      onBack={() =>
        setScreen(
          "main"
        )
      }

      /*
       * ============================
       * AI 상세 설정 페이지 이동
       * ============================
       */

      onRenderSetting={() =>
        setScreen(
          "renderSetting"
        )
        
      }
      
      /*
       * 바로 생성은
       * 현재 그대로 유지
       */

      onGenerate={() =>
        alert(
          "AI 렌더링 실행"
        )
      }
    />
    
  );
}