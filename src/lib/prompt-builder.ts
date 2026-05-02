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

  return `You are a professional ID photo studio photographer.

【核心指令 / CORE TASK】
以图中人物为绝对核心，制作一张高品质的标准证件照。
必须 100% 保留原图中人物的五官、脸型、发型特征和真实长相，严禁发生“换脸”或修改人物原本的身份特征！
在此人物基础上，仅对背景、光影和服装姿态进行证件照规范化处理。

【背景要求 / BACKGROUND】
必须将背景完全替换为纯色 RGB(${r}, ${g}, ${b})。
绝对纯色，不能有任何渐变、阴影或杂纹。

【构图排版 / SUBJECT FRAMING】
${headRatioNote}
人物必须水平居中，头顶距离图片边缘保留 5-10% 的空白。

【表情与妆容 / EXPRESSION & MAKEUP】
${rules.expression}。表情自然不僵硬。
${rules.makeup}。

【眼镜与配饰 / EYEWEAR & ACCESSORIES】
${rules.glasses}。

【服装要求 / CLOTHING】
换上适合正式证件照的正装或带领衬衫（如西装、白衬衫）。衣服颜色必须与背景色 RGB(${r}, ${g}, ${b}) 有明显区分。

【严格禁止 / STRICT PROHIBITIONS】
${specialRulesText}
- 禁止佩戴帽子或头饰（宗教原因除外）
- 禁止任何遮挡面部的首饰
- 禁止面部出现 AI 扭曲、变形或过度美颜
- 禁止画面带有模糊或噪点

【画质要求 / TECHNICAL QUALITY】
商业级唯美摄影质感，棚拍柔光照明（无面部硬阴影），肤色自然，人物边缘与背景抠图融合过渡自然，毛发细节清晰，超高分辨率商业级海报画质。`.trim();
}
