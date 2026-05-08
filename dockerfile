FROM docker.m.daocloud.io/library/node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# 安装全部依赖（包含 devDependencies）供构建使用
RUN npm ci

FROM docker.m.daocloud.io/library/node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM docker.m.daocloud.io/library/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 运行时只安装生产依赖
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env ./.env

EXPOSE 3000
CMD ["npm", "run", "start"]