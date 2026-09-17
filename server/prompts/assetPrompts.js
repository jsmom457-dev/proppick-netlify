const CATEGORY_NAMES = {
  common: "Common Props",
  furniture: "Furniture",
  graphic: "Graphic Assets",
  props: "Scenic Props",
};

export function getCategoryName(categoryId) {
  return CATEGORY_NAMES[categoryId] || categoryId || "Generated Assets";
}

export function buildAssetPlanningPrompt({ categoryId, keywords = {} }) {
  return `You are planning ONE realistic scenic prop for a Korean K-pop music broadcast stage.\n\nCATEGORY: ${getCategoryName(categoryId)}\nSPACE: ${keywords.space || "Not specified"}\nMOOD: ${keywords.mood || "Not specified"}\nFORM / SHAPE: ${keywords.style || "Not specified"}\nWORLDVIEW: ${keywords.worldview || "Not specified"}\n\nReturn exactly one reusable, physically buildable scenic prop concept. It must be recognizable, camera-readable, realistic at performer scale, and appropriate for a temporary broadcast set. Avoid speculative concept products and avoid a complete scene.`;
}

export function buildSingleViewPrompt({ categoryId, keywords = {}, assetPlan = {}, view }) {
  const viewText = view === "perspective"
    ? "Rotate approximately 15–20 degrees horizontally so a small amount of the right side is visible. Keep the object predominantly front-facing."
    : "Show a straight-on front view with minimal perspective distortion.";

  return `Create one isolated realistic scenic prop asset for a Korean K-pop music broadcast stage.\n\nCATEGORY: ${getCategoryName(categoryId)}\nASSET: ${assetPlan.name || "Scenic Prop"}\nDESCRIPTION: ${assetPlan.description || ""}\nDETAIL: ${assetPlan.promptDetail || ""}\nSPACE: ${keywords.space || "Not specified"}\nMOOD: ${keywords.mood || "Not specified"}\nFORM / SHAPE: ${keywords.style || "Not specified"}\nWORLDVIEW: ${keywords.worldview || "Not specified"}\n\n${viewText}\n\nPure white background. No environment, no stage, no people, no labels, no text. Show the complete object without cropping. Realistic broadcast scenic fabrication, clean studio lighting, eye-level camera, consistent materials and proportions.`;
}
