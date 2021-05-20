FROM node:lts-alpine

USER node

ENV NODE_ENV "production"

WORKDIR /app

COPY ./package.json .
COPY ./package-lock.json .
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3100

CMD [ "npm", "start" ]
