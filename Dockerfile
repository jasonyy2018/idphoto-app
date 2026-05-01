FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build requires DATABASE_URL at build time only for type checking
ARG DATABASE_URL=postgresql://placeholder:placeholder@placeholder/placeholder
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy built output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create upload directories with correct ownership
RUN mkdir -p public/uploads/originals public/uploads/results \
 && chown -R nextjs:nodejs public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
