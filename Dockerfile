FROM node:16.20.0-alpine

COPY . /src
WORKDIR /src
RUN npm install

CMD npm start