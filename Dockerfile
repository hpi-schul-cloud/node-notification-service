ARG NODE_IMAGE_TAG="12.16.1-slim"

# --- stage:builder ------------------------------------------------------------
FROM node:${NODE_IMAGE_TAG} AS build

ARG BUILD_BRANCH
ARG BUILD_HASH

LABEL build.stage="builder"
LABEL build.branch="${BUILD_BRANCH}"
LABEL build.hash="${BUILD_HASH}"

WORKDIR /app

COPY . .

RUN set -x \
    && npm install --no-optional --only=production \
    && cp -R node_modules node_modules_production \
    && npm install

# --- stage:test ---------------------------------------------------------------
FROM build AS test

ARG BUILD_BRANCH
ARG BUILD_HASH

LABEL build.stage="test"
LABEL build.branch="${BUILD_BRANCH}"
LABEL build.hash="${BUILD_HASH}"

RUN set -x \
    && npm run lint \
    && npm run test

# --- stage:release ------------------------------------------------------------
FROM node:${NODE_IMAGE_TAG} AS release

ARG BUILD_BRANCH
ARG BUILD_HASH

LABEL build.stage="release"
LABEL build.branch="${BUILD_BRANCH}"
LABEL build.hash="${BUILD_HASH}"

USER node

WORKDIR /usr/src/app

ENV NODE_ENV "production"

COPY --from=build /app/config /usr/src/app/config/
COPY --from=build /app/node_modules_production /usr/src/app/node_modules/
COPY --from=build /app/src /usr/src/app/src/
COPY --from=build /app/data /usr/src/app/data/
COPY --from=build /app/index.js /usr/src/app
COPY --from=build /app/package.json /usr/src/app

EXPOSE 3100

CMD [ "node", "index.js" ]
