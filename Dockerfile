FROM node:10.21.0-alpine3.11

USER node

ENV NODE_ENV "production"

WORKDIR /app

COPY ./package.json .
COPY ./package-lock.json .
RUN npm ci

COPY . .
npm install
RUN npm run build

EXPOSE 3100

CMD [ "npm", "start" ]
