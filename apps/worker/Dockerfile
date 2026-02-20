FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 worker
RUN adduser --system --uid 1001 worker
COPY package.json ./
RUN npm install --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist
USER worker
CMD ["npm", "start"]
