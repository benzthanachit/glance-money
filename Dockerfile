FROM node:20-alpine AS base

# --- Stage 1: deps ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
# ใช้ npm ci แต่ถ้ายังพังอยู่จริงๆ ในช่วงพัฒนา อาจเปลี่ยนเป็น npm install ชั่วคราวได้
# แต่แนะนำ npm ci แล้วแก้ไฟล์ lock ที่เครื่องเราให้จบจะดีที่สุดครับ
RUN npm ci

# --- Stage 2: builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# รับค่า ARGS มาตอน build (ต้องใส่ให้ครบตามที่คุณใช้ใน command)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY 

# ตั้งค่า ENV เพื่อให้ Next.js มองเห็นตอนรัน 'npm run build'
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- Stage 3: runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# เลียนแบบโครงสร้าง standalone ของ Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]