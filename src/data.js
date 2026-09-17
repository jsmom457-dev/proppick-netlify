
export const spaceKeywords = [
  "도시/거리 (STREET)",
  "학교/캠퍼스 (SCHOOL)",
  "버스정류장 (BUS STOP)",
  "해변 (BEACH)",
  "놀이공원 (AMUSEMENT PARK)",
];

export const moodKeywords = [
  "청량 (FRESH)",
  "로맨틱 (ROMANTIC)",
  "몽환적 (DREAMY)",
  "어두운 (DARK)",
  "스포티 (SPORTY)",
  "차가운 (COOL)",
];

export const styleKeywords = [
  "미니멀 (MINIMAL)",
  "맥시멀 (MAXIMAL)",
  "기하학적 (GEOMETRIC)",
  "유기적 (ORGANIC)",
  "레이어드 (LAYERED)",
];


export const worldviewKeywords = [
  "Y2K",
  "레트로 (RETRO)",
  "하이틴 (HIGH TEEN)",
  "사이버펑크 (CYBERPUNK)",
  "판타지 (FANTASY)",
  "키치 (KITSCH)",
];

export const stageTypes = [
  {
    id: "flat-wall",
    name: "플랫 월형 (Flat Wall)",
    shortName: "플랫 월형",
    description: "가장 일반적인 음악방송 무대 유형",
    imageUrl: "/types/flat-wall.png",
  },
  {
    id: "curved-wall",
    name: "커브드 월형 (Curved Wall)",
    shortName: "커브드 월형",
    description: "배경이 무대를 감싸 몰입감을 주는 유형",
    imageUrl: "/types/curved-wall.png",
  },
  {
    id: "u-wrap",
    name: "U-랩핑형 (U-Wrap)",
    shortName: "U-랩핑형",
    description: "3면 연결로 무대를 입체적으로 감싸는 유형",
    imageUrl: "/types/u-wrap.png",
  },
  {
    id: "multi-panel",
    name: "멀티 패널형 (Multi Panel)",
    shortName: "멀티 패널형",
    description: "패널 분할로 공간감을 구성하는 유형",
    imageUrl: "/types/multi-panel.png",
  },
  {
    id: "gate-portal",
    name: "게이트 포털형 (Gate Portal Stage)",
    shortName: "게이트 포털형",
    description: "사각 프레임이 시선을 집중시키는 유형",
    imageUrl: "/types/gate-portal.png",
  },
  {
    id: "arch-portal",
    name: "아치형 포털형 (Arch Portal Stage)",
    shortName: "아치형 포털형",
    description: "아치 구조물로 웅장함을 더하는 유형",
    imageUrl: "/types/arch-portal.png",
  },
];

export const assetCategories = [
  "프레임",
  "구조물",
  "건축 모듈",
  "가구",
  "상징 소품",
  "그래픽 요소",
  "분위기 소품",
];

export const assets = [
  "portal frame A",
  "portal frame B",
  "portal frame C",
  "portal frame D",
  "arch frame A",
  "arch frame B",
  "gate frame C",
  "gate frame D",
  "tunnel frame A",
  "tunnel frame B",
];

export const colorPalettes = [
  {
    name: "Broadcast Signature",
    colors: ["#2563EB", "#8B5CF6", "#EC4899", "#FFFFFF", "#0F172A"],
  },
  {
    name: "Neon Dream",
    colors: ["#22D3EE", "#A855F7", "#F472B6", "#FACC15", "#111827"],
  },
  {
    name: "Purple Galaxy",
    colors: ["#312E81", "#6D28D9", "#C084FC", "#F0ABFC", "#020617"],
  },
  {
    name: "Cyber Red",
    colors: ["#EF4444", "#991B1B", "#111827", "#F8FAFC", "#F97316"],
  },
  {
    name: "Ice Future",
    colors: ["#DBEAFE", "#93C5FD", "#38BDF8", "#F8FAFC", "#1E293B"],
  },
  {
    name: "K-POP Trend Mix",
    colors: ["#FF4FD8", "#7C3AED", "#06B6D4", "#FDE047", "#111827"],
  },
];

export const objectCategories = [
  {
    id: "structure",
    name: "구조물",
    icon: "/icons/categories/structure.svg",
    activeIcon: "/icons/categories/structure-active.svg",
  },
  {
    id: "furniture",
    name: "가구",
    icon: "/icons/categories/furniture.svg",
    activeIcon: "/icons/categories/furniture-active.svg",
  },
  {
    id: "prop",
    name: "소품",
    icon: "/icons/categories/prop.svg",
    activeIcon: "/icons/categories/prop-active.svg",
  },
  {
    id: "background",
    name: "배경",
    icon: "/icons/categories/graphic.svg",
    activeIcon: "/icons/categories/graphic-active.svg",
  },
];

export const generatedAssets = [
  {
    id: "handle-a",
    categoryId: "frame",
    name: "Handle A",
    imageUrl: "/generated-assets/frame/handle-a.png",
  },
  {
    id: "handle-b",
    categoryId: "frame",
    name: "Handle B",
    imageUrl: "/generated-assets/frame/handle-b.png",
  },
  {
    id: "chair-a",
    categoryId: "furniture",
    name: "Chair A",
    imageUrl: "/Chair%20A.png",
  },
    {
    id: "chair-b",
    categoryId: "furniture",
    name: "Chair B",
    imageUrl: "/Chair%20B.png",
  },
];