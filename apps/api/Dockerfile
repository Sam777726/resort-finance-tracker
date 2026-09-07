# Multi-stage build: compile TypeScript (and the shared package it depends
# on) in a full node image, then ship only the production node_modules +
# compiled output in a slim runtime image.

FROM node:20-slim AS build
WORKDIR /repo

# Prisma's query/schema engine binaries are native and link against
# libssl — node:20-slim (Debian) doesn't ship it, which makes prisma
# generate / db push fail with a truncated "Schema engine error". Needed
# in both stages: build (prisma generate detects the engine to fetch here)
# and runtime (db push + the query engine run here).
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Install workspace deps first (better layer caching on source-only edits)
COPY package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm install --workspaces --include-workspace-root

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w packages/shared
RUN npm run prisma:generate -w apps/api
RUN npm run build -w apps/api

FROM node:20-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm install --workspaces --include-workspace-root --omit=dev

COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/apps/api/dist apps/api/dist
# npm workspaces hoists @prisma/client (and its generated .prisma/client
# runtime) to the monorepo ROOT node_modules, not apps/api/node_modules —
# confirmed by prisma generate's own "Generated Prisma Client to
# ./../../node_modules/@prisma/client" output. Copying from the wrong path
# here silently breaks the runtime image's Prisma client at container start.
COPY --from=build /repo/node_modules/.prisma node_modules/.prisma
COPY apps/api/prisma apps/api/prisma

EXPOSE 4000
WORKDIR /repo/apps/api
# `db push` (not `migrate deploy`) deliberately: this repo ships without a
# committed migration history (see README) so push is what reliably syncs
# schema -> database on a fresh container. Swap to `prisma migrate deploy`
# once you've run `prisma migrate dev` locally and committed the generated
# migrations/ folder.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
