ARG NODE_IMAGE_TAG="10.21.0-alpine3.11"

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
    && npm install \
    && npm run build

# --- stage:test ---------------------------------------------------------------
FROM build AS test

ARG BUILD_BRANCH
ARG BUILD_HASH

LABEL build.stage="test"
LABEL build.branch="${BUILD_BRANCH}"
LABEL build.hash="${BUILD_HASH}"

RUN set -x \
    && npm run lint
    # && npm run test

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

COPY --from=build /app /usr/src/app

EXPOSE 3031

CMD [ "npm", "start" ]
