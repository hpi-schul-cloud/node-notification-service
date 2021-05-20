FROM node:10.21.0-alpine3.11

ENV NODE_ENV "production"

WORKDIR /app

COPY ./package.json .
COPY ./package-lock.json .
COPY ./tsconfig.json .
RUN npm ci

COPY . .
RUN npm install
RUN npm run build
ENV NODE_ENV "production"

EXPOSE 3100

CMD [ "npm", "start" ]
