FROM node:15-alpine

VOLUME /data

ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json", "/app/"]

RUN npm install --production

COPY . .

CMD [ "npm", "start" ]
