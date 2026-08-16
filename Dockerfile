FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json ./
EXPOSE 3000
USER node
CMD ["node", "build"]
