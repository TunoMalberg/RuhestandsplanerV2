# Dockerfile für Google Cloud Run Deployment
# Next.js Ruhestandsplanung App

FROM node:20-alpine AS base

# Installiere Abhängigkeiten nur wenn nötig
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Kopiere package files
COPY package.json bun.lock* package-lock.json* yarn.lock* ./

# Installiere Abhängigkeiten mit npm (universeller)
RUN npm ci --legacy-peer-deps

# Baue die Anwendung
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Umgebungsvariablen für den Build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Baue Next.js
RUN npm run build:local

# Production Image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Erstelle non-root User für Sicherheit
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiere notwendige Dateien
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next-build/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next-build/static ./.next/static

USER nextjs

# Cloud Run verwendet PORT Umgebungsvariable
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]