import 'dotenv/config';
import { db } from '../src/lib/db';
import { specTemplates } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

const TEMPLATES = [
  {
    name: '中国护照',
    nameEn: 'Chinese Passport',
    category: 'passport' as const,
    widthMm: 33,
    heightMm: 48,
    dpi: 300,
    backgroundColorRgb: { r: 255, g: 255, b: 255 },
    headHeightMmMin: 28,
    headHeightMmMax: 33,
  },
  {
    name: '高考报名',
    nameEn: 'College Entrance Exam',
    category: 'gaokao' as const,
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    backgroundColorRgb: { r: 255, g: 255, b: 255 },
    headHeightMmMin: 28,
    headHeightMmMax: 33,
  },
  {
    name: '美国签证',
    nameEn: 'US Visa',
    category: 'visa' as const,
    widthMm: 51,
    heightMm: 51,
    dpi: 300,
    backgroundColorRgb: { r: 255, g: 255, b: 255 },
    headHeightMmMin: 25,
    headHeightMmMax: 35,
  },
  {
    name: '英国留学',
    nameEn: 'UK Study Visa',
    category: 'study_abroad' as const,
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    backgroundColorRgb: { r: 255, g: 255, b: 255 },
    headHeightMmMin: 29,
    headHeightMmMax: 34,
  },
];

async function seed() {
  console.log('🌱 Seeding database...');

  // Create enums + tables via drizzle push (or ensure they exist)
  for (const template of TEMPLATES) {
    await db
      .insert(specTemplates)
      .values(template)
      .onConflictDoNothing(); // idempotent
    console.log(`  ✅ ${template.name} (${template.nameEn})`);
  }

  console.log('✅ Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
