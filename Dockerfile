FROM node:21-alpine

VOLUME /data

ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json", "/app/"]

RUN npm install --production

COPY index.js /app/

CMD [ "npm", "start" ]
