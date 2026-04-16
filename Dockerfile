FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/data /app/logs

EXPOSE 3016

CMD ["node", "src/server.js"]
