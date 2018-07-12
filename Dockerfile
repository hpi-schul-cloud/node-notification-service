FROM node:10-alpine AS builder
WORKDIR /usr/src/notification-service
COPY . .
RUN npm install && \
    npm run build && \
    mkdir ./builder && \
    mv ./build ./builder/build && \
    mv ./swagger.json ./builder/swagger.json && \
    mv ./package.json ./builder/package.json

FROM node:10-alpine
WORKDIR /usr/src/notification-service
COPY --from=builder /usr/src/notification-service/builder .
RUN npm install --production
CMD npm run production
