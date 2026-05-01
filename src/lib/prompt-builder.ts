import type { SpecTemplate } from '@/lib/db/schema';

// ─── Category Rule Matrix ─────────────────────────────────────────────────────

interface CategoryRules {
  expression: string;
  makeup: string;
  glasses: string;
  specialRules: string[];
}

const CATEGORY_RULES: Record<string, CategoryRules> = {
  gaokao: {
    expression:
      'serious, neutral expression, mouth closed, no smile whatsoever',
    makeup: 'absolutely no makeup, no lipstick, no foundation, no cosmetics of any kind',
    glasses: 'no glasses, contact lenses only',
    specialRules: [
      'no beauty filters or skin smoothing',
      'natural skin texture must be visible',
      'no retouching or digital enhancement',
      'hair must be neatly combed and not cover the forehead or ears',
    ],
  },
  passport: {
    expression: 'neutral, relaxed expression, mouth closed or slight natural relaxed look',
    makeup: 'light natural makeup is acceptable',
    glasses: 'glasses are allowed but must have no reflections or tinted lenses',
    specialRules: [
      'both ears should be visible',
      'no head coverings unless for religious reasons',
    ],
  },
  visa: {
    expression: 'neutral expression, looking directly at the camera',
    makeup: 'light natural makeup is acceptable',
    glasses: 'glasses are allowed but must have no reflections or tinted lenses',
    specialRules: [
      'eyes must be open and clearly visible',
      'face must be centered in the frame',
    ],
  },
  study_abroad: {
    expression: 'natural, friendly slight smile is acceptable and encouraged',
    makeup: 'natural makeup is acceptable',
    glasses: 'glasses are allowed',
    specialRules: [
      'professional and approachable appearance',
      'clean and tidy hair',
    ],
  },
};

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Builds a precise OpenAI image-editing prompt for ID photo generation.
 * All prompt logic must go through this function — never hardcode prompts elsewhere.
 */
export function buildPhotoPrompt(template: SpecTemplate): string {
  const rules = CATEGORY_RULES[template.category] ?? CATEGORY_RULES.passport;
  const { r, g, b } = template.backgroundColorRgb as { r: number; g: number; b: number };

  const headRatioNote =
    template.headHeightMmMin && template.headHeightMmMax
      ? `The subject's head height must occupy between ${Math.round((template.headHeightMmMin / template.heightMm) * 100)}% and ${Math.round((template.headHeightMmMax / template.heightMm) * 100)}% of the total image height.`
      : 'The subject\'s head should occupy approximately 70-80% of the image height, centered vertically and horizontally.';

  const specialRulesText = rules.specialRules
    .map((r, i) => `${i + 1}. ${r}`)
    .join('\n');

  return `You are a professional ID photo studio photographer with 20 years of experience producing government-compliant identity photographs.

TASK: Edit the provided portrait photo to meet the following official ID photo specifications exactly.

== BACKGROUND ==
Replace the entire background with a perfectly uniform, solid color: RGB(${r}, ${g}, ${b}). 
There must be zero gradient, zero shadow, zero texture on the background. It must be a completely flat, solid color.

== SUBJECT FRAMING ==
${headRatioNote}
The subject must be centered horizontally. Crop the image so the top of the head is near the top edge with approximately 5-10% margin.

== EXPRESSION ==
${rules.expression}. The expression must look natural, not forced or artificial.

== MAKEUP & APPEARANCE ==
${rules.makeup}.

== EYEWEAR ==
${rules.glasses}.

== CLOTHING ==
The subject should wear formal or semi-formal attire appropriate for an official document. Avoid casual wear, sportswear, or clothing with large logos. 
Clothing color should contrast clearly with the background.

== STRICT PROHIBITIONS ==
${specialRulesText}
- No hats, caps, or head accessories (unless religious)
- No jewelry that obscures the face
- No motion blur
- No image artifacts, noise, or compression artifacts
- No AI-generated facial distortion

== TECHNICAL QUALITY ==
photorealistic, sharp focus, professional studio lighting, even illumination with no harsh shadows on the face, 
no blown-out highlights, natural skin tone, crisp edges between subject and background.

Output a high-quality, print-ready ID photograph that would be accepted by official government or institutional authorities.`.trim();
}
