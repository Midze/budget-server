FROM node:22-bookworm-slim AS build

WORKDIR /src

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

WORKDIR /src

ENV NODE_ENV=production

COPY --from=build /src/package*.json ./
COPY --from=build /src/node_modules ./node_modules
COPY --from=build /src/dist ./dist
COPY --from=build /src/process.json ./process.json

RUN npm install -g pm2

EXPOSE 3000

CMD ["pm2-runtime", "process.json"]
