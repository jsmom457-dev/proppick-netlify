const LIGHTING_LABELS = {
  "broadcast-clean": "Broadcast Clean / 기본 방송 조명",
  backlight: "Backlight / 백라이트",
  "beam-light": "Beam Light / 빔 라이트",
  "soft-diffusion": "Soft Diffusion / 소프트 디퓨전",
};

function clean(value, fallback = "Not specified") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function keywordLines(keywords = {}) {
  return [
    `SPACE KEYWORD: ${clean(keywords.space)}`,
    `MOOD KEYWORD: ${clean(keywords.mood)}`,
    `FORM / SHAPE KEYWORD: ${clean(keywords.style)}`,
    `WORLDVIEW KEYWORD: ${clean(keywords.worldview)}`,
  ].join("\n");
}

function settingsLines(settings = {}) {
  const paletteColors =
    settings.paletteMode === "custom"
      ? settings.customColors || settings.paletteColors || []
      : settings.paletteColors || [];

  const artistCount = Number(settings.artistCount) || 0;

  return [
    `PALETTE MODE: ${clean(settings.paletteMode)}`,
    `PALETTE COLORS: ${
      paletteColors.length
        ? paletteColors.join(", ")
        : "Not specified"
    }`,
    `LIGHTING PRESET: ${
      LIGHTING_LABELS[settings.lighting] ||
      clean(settings.lighting)
    }`,
    `MOOD DESCRIPTION: ${clean(
      settings.moodDescription,
      "None"
    )}`,
    `ARTIST COUNT: ${
      artistCount > 0
        ? `${artistCount} performer(s)`
        : "None"
    }`,
  ].join("\n");
}

function objectLines(objects = []) {
  if (!objects.length) {
    return "No structured object metadata was supplied.";
  }

  return objects
    .map((object, index) => {
      const parts = [
        `${index + 1}. ${clean(
          object.name,
          "Unnamed asset"
        )}`,
        object.category
          ? `category=${object.category}`
          : null,
        object.x !== undefined
          ? `x=${Math.round(Number(object.x) || 0)}`
          : null,
        object.y !== undefined
          ? `y=${Math.round(Number(object.y) || 0)}`
          : null,
        object.width !== undefined
          ? `w=${Math.round(Number(object.width) || 0)}`
          : null,
        object.height !== undefined
          ? `h=${Math.round(Number(object.height) || 0)}`
          : null,
        object.flipX
          ? "flipped horizontally"
          : null,
      ].filter(Boolean);

      return parts.join(" | ");
    })
    .join("\n");
}

const COMMON_STAGE_PROMPT = `
Create a highly realistic Korean K-pop music broadcast stage based on the supplied project data and image references.

The user's composed stage image is the PRIMARY spatial reference.
It represents the intended object hierarchy, object placement,
scale relationships, scenic balance, and overall composition.

Preserve this scenic design intent faithfully.

IMPORTANT:
Preserving the scenic design does NOT mean that every visual
condition of the input collage must remain unchanged.

When the FRONT VIEW instructions explicitly require performers,
adding those performers is a REQUIRED foreground content insertion
and is NOT considered a modification of the scenic design.

The stage-type image is the PRIMARY architectural-structure reference.
Preserve its basic stage geometry and structural character while
integrating the user's scenic composition into it.

Any additional reference images are SECONDARY visual references
for mood, material, detailing, lighting, or atmosphere only.
They must never override the user's stage composition
or stage structure.

Interpret the collage as a professionally fabricated Korean
music-broadcast scenic set rather than as flat pasted images.

PRESERVE:
- the user's stage layout and object hierarchy
- relative scenic object positions
- scenic object scale relationships
- the selected stage architecture
- the four concept keywords
- the selected color palette
- the selected lighting direction
- the supplied mood description
- the identity of recognizable scenic objects
- visual balance and spatial relationships

IMPORTANT HUMAN-FIGURE EXCEPTION:
Human performers are NOT scenic objects.

When the FRONT VIEW instructions explicitly request performers,
they MUST be inserted even if the original composition contains
zero people.

Their insertion must not cause the stage architecture,
props, furniture, graphics, or scenic layout to change.

TRANSFORM:
- flat collage elements into physically believable scenic constructions
- props into realistic fabricated stage props
- graphics into believable scenic / LED / printed graphic systems
- rough collage relationships into realistic foreground,
  midground, and background depth

STRICT CONSISTENCY RULE:
This project represents ONE SINGLE PHYSICAL STAGE DESIGN.

Across every requested camera view,
do not redesign, restyle, recolor, replace, add, remove,
or relocate SCENIC ELEMENTS.

The only intended change between views is CAMERA POSITION
and the naturally revealed geometry caused by that camera position.

IMPORTANT:
The performer insertion/removal rules specified separately
for FRONT, SIDE, and TOP override this rule only for HUMAN FIGURES.

Keep the same set architecture,
same scenic objects,
same materials,
same colors,
same graphics,
same lighting setup,
same proportions,
and same spatial organization.

STAGE DESIGN REQUIREMENTS:
- professional Korean music-broadcast stage design
- realistic broadcast-scale scenic construction
- realistic foreground, midground, and background layers
- natural scenic transitions
- no isolated sticker-like props
- no floating objects
- all visible structures must appear physically buildable
- use scenic walls, architectural modules, fabricated structures,
  LED integration, painted metal, architectural panels,
  and broadcast-grade scenic materials where appropriate
- realistic stage floor and construction details
- performers are allowed ONLY when explicitly requested for the FRONT view
- no audience
- no text overlays
- no concept-art appearance

COLOR:
Apply the supplied palette selectively through architecture,
scenic accents, lighting, LED content, graphic systems, and trim.

Do not make every object the same color.

Maintain believable material variation.

LIGHTING:
Use professional Korean music-broadcast lighting.

Broadcast-quality illumination,
natural contrast,
controlled highlights,
subtle atmospheric haze,
and realistic beam interaction.

Avoid excessive bloom and generic nightclub lighting.

RENDERING STYLE:
Ultra-realistic stage photography.
Professional scenic-design visualization.
Photorealistic materials.
Realistic lighting behavior.
Production-ready broadcast-stage environment.
High-end commercial visualization quality.
`;

function buildFrontArtistPrompt(settings = {}) {
  const artistCount = Number(settings.artistCount) || 0;

  if (artistCount <= 0) {
    return `
FRONT VIEW HUMAN FIGURE RULE — MANDATORY

THE USER DID NOT SELECT ARTIST INFORMATION.

The FRONT render MUST contain ZERO people.

Do not generate:
- performers
- dancers
- staff
- audience members
- silhouettes
- mannequins
- statues resembling people
- human figures on LED screens
- reflections resembling people

VISIBLE REAL PEOPLE = 0.
`;
  }

  const artistType =
    artistCount === 1
      ? "SOLO K-POP ARTIST"
      : `${artistCount}-MEMBER K-POP GROUP`;

  return `
CRITICAL FRONT-VIEW PERFORMER INSERTION
ABSOLUTE OUTPUT REQUIREMENT
HIGH PRIORITY INSTRUCTION

THE USER EXPLICITLY SELECTED:

ARTIST TYPE: ${artistType}
ARTIST COUNT: ${artistCount}

THE FINAL FRONT IMAGE IS INVALID
UNLESS EXACTLY ${artistCount}
REAL HUMAN K-POP PERFORMER(S)
ARE CLEARLY VISIBLE.

--------------------------------------------------
THIS IS A REQUIRED IMAGE EDIT
--------------------------------------------------

The supplied user-composed stage image
intentionally contains no performers.

DO NOT preserve the absence of people
from the source composition.

The absence of people in the input image
MUST NOT be carried into the final FRONT render.

You MUST actively INSERT exactly ${artistCount}
new realistic human K-pop performer(s)
into the final FRONT image.

Adding these performers is NOT considered
a modification of the user's scenic design.

It is a REQUIRED foreground content insertion.

Preserve the stage environment exactly,
but ADD the selected performers
on top of that environment.

--------------------------------------------------
EXACT PERSON COUNT
--------------------------------------------------

VISIBLE REAL HUMAN PERFORMERS = EXACTLY ${artistCount}

Not ${Math.max(artistCount - 1, 0)}.
Not ${artistCount + 1}.
Exactly ${artistCount}.

Every performer must be clearly identifiable
as a separate real human body.

--------------------------------------------------
MANDATORY PLACEMENT
--------------------------------------------------

Place all ${artistCount} performer(s):

- ON the main performance floor
- near the visual CENTER of the stage
- horizontally centered within the stage opening
- in ONE SINGLE STRAIGHT HORIZONTAL ROW
- side-by-side
- with approximately EQUAL spacing
- at approximately the SAME depth from the camera
- facing DIRECTLY toward the front camera
- standing upright in a neutral performance-ready pose

DO NOT:

- stagger the members
- create multiple rows
- place members behind one another
- place members at different stage depths
- scatter performers around the scenery
- place performers at the extreme sides of the stage
- hide performers behind scenic objects

--------------------------------------------------
FULL-BODY VISIBILITY
--------------------------------------------------

ALL ${artistCount} performers must be visible
SIMULTANEOUSLY.

For every performer:

- full head visible
- full torso visible
- both arms readable
- both legs readable
- both feet visible
- no body cropped by the image boundary
- no body hidden behind another performer
- no body hidden behind props or furniture

The performers must appear at a realistic human scale
relative to the surrounding stage architecture.

They should be large enough to be immediately visible
when viewing the complete stage image.

--------------------------------------------------
REAL HUMAN APPEARANCE
--------------------------------------------------

Generate realistic contemporary K-pop performers.

They must look like REAL PEOPLE
physically standing on the stage.

They must NOT appear as:

- LED-screen imagery
- posters
- photographs
- printed graphics
- mannequins
- statues
- holograms
- silhouettes
- scenic decorations

Use contemporary K-pop stage outfits
that harmonize with the selected concept,
worldview, color palette, and lighting.

Do not copy or identify any specific real-world celebrity.

--------------------------------------------------
NO EXTRA PEOPLE
--------------------------------------------------

Do NOT generate:

- backup dancers
- additional group members
- audience
- staff
- camera operators
- background people
- people on LED screens
- human-shaped scenic decorations
- reflections that look like additional people

The ONLY visible human figures
must be the selected ${artistCount} performer(s).

--------------------------------------------------
SCENIC DESIGN PRESERVATION
--------------------------------------------------

Preserve:

- stage architecture
- stage structure
- scenic walls
- props
- furniture
- graphics
- object positions
- object scale
- color distribution
- lighting design
- material design

DO NOT move scenic elements
to make room for the performers.

Instead, naturally place the performers
in the existing open performance area.

The ONLY intentional addition
to the user's composition
is the ${artistCount} human performer(s).

--------------------------------------------------
INSTRUCTION PRIORITY
--------------------------------------------------

If there is any conflict between:

1. preserving the fact that the source image contains no people

and

2. inserting exactly ${artistCount} performers

YOU MUST FOLLOW RULE 2.

The source image's empty stage
is NOT an instruction to keep the final image empty.

The user-selected artist count
has HIGHER PRIORITY
for the FRONT render.

--------------------------------------------------
FINAL VALIDATION BEFORE OUTPUT
--------------------------------------------------

Before producing the final image,
visually count all real human figures.

Required count:

${artistCount}

If fewer than ${artistCount} people are visible:
ADD the missing performers.

If more than ${artistCount} people are visible:
REMOVE the extra people.

FINAL FRONT OUTPUT MUST CONTAIN
EXACTLY ${artistCount}
CLEARLY VISIBLE FULL-BODY
REAL HUMAN K-POP PERFORMER(S)
STANDING IN ONE HORIZONTAL ROW
AT THE CENTER OF THE STAGE.
`;
}

export function buildFrontPrompt({
  project = {},
  settings = {},
  objects = [],
  referenceCount = 0,
}) {
  const artistPrompt =
    buildFrontArtistPrompt(settings);

  return `${COMMON_STAGE_PROMPT}

PROJECT DATA
PROJECT TITLE: ${clean(project.title)}
STAGE TYPE: ${clean(
    project.stageTypeName || project.stageTypeId
  )}

${keywordLines(project.keywords)}

${settingsLines(settings)}

PLACED ASSET METADATA
${objectLines(objects)}

INPUT IMAGE ORDER

Image 1:
USER-COMPOSED STAGE IMAGE.

Treat this as the primary SCENIC COMPOSITION
and spatial-layout reference.

IMPORTANT:
Image 1 controls the SCENIC DESIGN.

Image 1 does NOT control whether performers
must be present.

If ARTIST COUNT is greater than zero,
the performer insertion instructions below
override the absence of people in Image 1.

Image 2:
STAGE-TYPE IMAGE.

Treat this as the primary
stage-architecture reference.

${
  referenceCount
    ? `Images 3-${referenceCount + 2}:
USER REFERENCE IMAGES.

Use these only for secondary
mood / material / detail guidance.`
    : "No additional reference images."
}

${artistPrompt}

CAMERA VIEW — FRONT

This is the ONLY camera view
that may contain performers.

Use an audience-facing
front elevation.

CAMERA:
- centered
- eye-level
- approximately 35mm broadcast lens
- near-symmetrical framing where compatible
  with the user's composition
- minimal perspective distortion

Keep the entire stage structure
readable and visible.

The result should resemble
an official Korean music-broadcast
stage photograph.

If performers were selected,
they must be immediately visible
in the central performance area.

This FRONT image establishes
the canonical final SCENIC DESIGN
that the SIDE and TOP views
must match exactly.

Human performers are NOT part
of the canonical scenic geometry.
`;
}

function buildDerivedPrompt({
  view,
  project = {},
  settings = {},
  objects = [],
  referenceCount = 0,
}) {
  const camera =
    view === "side"
      ? `
CAMERA VIEW — SIDE

Move the camera to approximately
35–45 degrees from the front.

Maintain visibility
of the complete stage structure.

Reveal:
- stage depth
- scenic layering
- physical construction

Do not use an extreme side angle.

Do not reveal backstage areas.

Use a professional production-review
perspective rather than
a dramatic cinematic angle.
`
      : `
CAMERA VIEW — TOP

Move the camera directly above
the SAME physical stage.

Create a TRUE BIRD'S-EYE
TOP-PLAN VIEWPOINT.

Show:
- complete scenic layout
- stage zoning
- circulation space
- object placement
- architectural relationships

Keep realistic stage proportions.

Avoid a diagonal aerial perspective.

This should read as a professional
stage-planning visualization.
`;

  return `${COMMON_STAGE_PROMPT}

PROJECT DATA
PROJECT TITLE: ${clean(project.title)}
STAGE TYPE: ${clean(
    project.stageTypeName || project.stageTypeId
  )}

${keywordLines(project.keywords)}

${settingsLines(settings)}

PLACED ASSET METADATA
${objectLines(objects)}

INPUT IMAGE ORDER

Image 1:
CANONICAL GENERATED FRONT VIEW.

This is the authoritative
final SCENIC DESIGN.

Match the stage itself exactly.

IMPORTANT:
Any human performers visible
in Image 1 are TEMPORARY FRONT-VIEW
PRESENTATION FIGURES.

They are NOT part
of the physical scenic design.

Image 2:
USER-COMPOSED STAGE IMAGE.

Use it to confirm:
- spatial placement
- object relationships

Image 3:
STAGE-TYPE IMAGE.

Use it to confirm
architectural structure.

${
  referenceCount
    ? `Images 4-${referenceCount + 3}:
USER REFERENCE IMAGES.

Secondary mood / material /
detail guidance only.`
    : "No additional reference images."
}

ARTIST / PERFORMER RULE
SIDE AND TOP VIEWS
ABSOLUTE REQUIREMENT

VISIBLE PEOPLE = 0.

The SIDE and TOP results
MUST contain ZERO people.

Do NOT include:

- performers
- artists
- dancers
- staff
- audience members
- silhouettes
- mannequins
- statues resembling people
- human figures on screens
- reflections resembling people

If performers are visible
in Image 1:

REMOVE ALL OF THEM.

Treat them as temporary
front-view presentation figures only.

Remove ONLY the human figures.

Reconstruct the stage floor
and scenery naturally underneath
the removed people.

DO NOT remove,
move,
redesign,
replace,
or alter any scenic element
because of their removal.

CRITICAL CAMERA-ONLY TRANSFORMATION

Reconstruct the EXACT SAME
physical stage shown in Image 1
from a different camera position.

Do not reinterpret the concept.

Do not make a second design.

Do not change:

- scenic geometry
- color distribution
- graphics
- materials
- scenic object count
- scenic object identity
- scenic object positions
- scenic scale
- lighting design
- styling

If geometry hidden
in the front view
must be inferred,
infer only the minimum
physically necessary geometry.

Use:
- the user's composed stage image
- the stage-type image

to support that inference.

Never invent
a new prominent scenic element.

${camera}
`;
}

export function buildSidePrompt(payload) {
  return buildDerivedPrompt({
    ...payload,
    view: "side",
  });
}

export function buildTopPrompt(payload) {
  return buildDerivedPrompt({
    ...payload,
    view: "top",
  });
}