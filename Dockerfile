ARG NODE_IMAGE_TAG="10.21.0-alpine3.11"
# --- stage:builder ------------------------------------------------------------
FROM node:${NODE_IMAGE_TAG} AS build

WORKDIR /app

COPY . .

RUN set -x \
    && npm install \
    && npm run build


# --- stage:release ------------------------------------------------------------
FROM node:${NODE_IMAGE_TAG} AS release


USER node

WORKDIR /usr/src/app

ENV NODE_ENV "production"

COPY --from=build /app /usr/src/app

EXPOSE 3031

CMD [ "npm", "start" ]