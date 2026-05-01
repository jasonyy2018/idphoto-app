import {
  pgTable,
  serial,
  varchar,
  integer,
  jsonb,
  uuid,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const categoryEnum = pgEnum('category', [
  'passport',
  'gaokao',
  'visa',
  'study_abroad',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

/**
 * Spec templates define the physical dimensions and rules for each ID photo format.
 */
export const specTemplates = pgTable('spec_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  nameEn: varchar('name_en', { length: 100 }).notNull(),
  category: categoryEnum('category').notNull(),
  widthMm: integer('width_mm').notNull(),
  heightMm: integer('height_mm').notNull(),
  dpi: integer('dpi').default(300).notNull(),
  backgroundColorRgb: jsonb('background_color_rgb')
    .$type<{ r: number; g: number; b: number }>()
    .notNull(),
  headHeightMmMin: integer('head_height_mm_min'),
  headHeightMmMax: integer('head_height_mm_max'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Each photo generation request is stored as an order.
 */
export const photoOrders = pgTable('photo_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: integer('template_id').references(() => specTemplates.id),
  apiKeyId: integer('api_key_id').references(() => apiKeys.id),
  originalImagePath: text('original_image_path').notNull(),
  resultImagePath: text('result_image_path'),
  openaiPrompt: text('openai_prompt'),
  status: orderStatusEnum('status').default('pending').notNull(),
  errorMessage: text('error_message'),
  processingTimeMs: integer('processing_time_ms'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

/**
 * API keys for third-party platform access, managed from the admin dashboard.
 */
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 64 }).unique().notNull(), // SHA-256 of the raw key
  keyPrefix: varchar('key_prefix', { length: 16 }).notNull(),      // First 8 chars shown in UI
  isActive: integer('is_active').default(1).notNull(),             // 1=active, 0=revoked
  totalCalls: integer('total_calls').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type SpecTemplate = typeof specTemplates.$inferSelect;
export type NewSpecTemplate = typeof specTemplates.$inferInsert;
export type PhotoOrder = typeof photoOrders.$inferSelect;
export type NewPhotoOrder = typeof photoOrders.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
