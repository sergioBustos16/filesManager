# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
# Use install (not ci): lockfile may be absent (gitignored) or out of sync with package.json in workspaces.
RUN npm install

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS production

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

COPY --from=builder /app/.output ./.output

EXPOSE 3000
USER node

CMD ["node", ".output/server/index.mjs"]
