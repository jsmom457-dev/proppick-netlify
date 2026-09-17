import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const SPACE_ALIASES = {
  city: "city", street: "city", "street / urban": "city", "도시/거리": "city", "도시/거리 (street)": "city",
  school: "school", "school / campus": "school", "학교/캠퍼스": "school", "학교/캠퍼스 (school)": "school",
  "amusement-park": "amusement-park", amusementpark: "amusement-park", "amusement park": "amusement-park", "놀이공원": "amusement-park", "놀이공원 (amusement park)": "amusement-park",
  "bus-stop": "bus-stop", "bus stop": "bus-stop", "버스정류장": "bus-stop", "버스정류장 (bus stop)": "bus-stop",
  beach: "beach", "해변": "beach", "해변 (beach)": "beach",
};

const WORLDVIEW_ALIASES = {
  y2k: "y2k", "레트로": "retro", retro: "retro", "레트로 (retro)": "retro",
  "하이틴": "high-teen", "high teen": "high-teen", "high-teen": "high-teen", "하이틴 (high teen)": "high-teen",
  "사이버펑크": "cyberpunk", cyberpunk: "cyberpunk", "사이버펑크 (cyberpunk)": "cyberpunk",
  "판타지": "fantasy", fantasy: "fantasy", "판타지 (fantasy)": "fantasy",
  "키치": "kitsch", kitsch: "kitsch", "키치 (kitsch)": "kitsch",
};

function keyOf(value) { return String(value || "").trim().toLowerCase(); }
export function normalizePresetSpace(value) { return SPACE_ALIASES[keyOf(value)] || ""; }
export function normalizePresetWorldview(value) { return WORLDVIEW_ALIASES[keyOf(value)] || ""; }

export function buildPresetAssetSetKey({ category, space, worldview }) {
  const normalizedCategory = String(category || "").trim().toLowerCase();
  const normalizedSpace = normalizePresetSpace(space);
  const normalizedWorldview = normalizePresetWorldview(worldview);
  if (!normalizedCategory || !normalizedSpace || !normalizedWorldview) return null;
  return `v1__${normalizedCategory}__${normalizedSpace}__any__any__${normalizedWorldview}`;
}

function normalizeAsset(asset = {}) {
  const viewType = asset.viewType === "angle" ? "angle" : "front";
  const viewName = asset.viewName || (viewType === "angle" ? "측면" : "정면");
  const imageUrl = asset.imageUrl || asset.views?.[viewType]?.imageUrl || asset.views?.front?.imageUrl || "";
  const displayName = asset.koreanName || asset.name || "이름 없는 소품";
  return { ...asset, name: displayName, koreanName: displayName, imageUrl, viewType, viewName };
}

export async function getPresetAssets({ category, space, worldview }) {
  const normalizedCategory = String(category || "").trim().toLowerCase();
  const key = buildPresetAssetSetKey({ category: normalizedCategory, space, worldview });
  if (!key) return [];
  const snapshot = await getDoc(doc(db, "assetSets", key));
  if (!snapshot.exists()) {
    console.warn("[Preset Assets] Firestore 문서 없음:", key);
    return [];
  }
  const data = snapshot.data();
  const assets = Array.isArray(data.assets) ? data.assets : [];
  return assets.map(normalizeAsset).filter((asset) => Boolean(asset.imageUrl)).map((asset) => ({
    ...asset,
    categoryId: normalizedCategory,
    source: "preset",
    assetSetKey: key,
    assetGroupId: asset.id,
    selectedView: asset.viewType || "front",
  }));
}
