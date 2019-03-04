FROM node:10-alpine

WORKDIR /usr/src/app
COPY . .

EXPOSE 3031

RUN npm install
RUN npm run build

CMD npm start
