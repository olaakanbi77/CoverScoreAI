FROM node:20-slim
WORKDIR /app
RUN apt-get update -qq && apt-get install -y -qq python3 python3-pip make g++ wget unzip ffmpeg imagemagick && rm -rf /var/lib/apt/lists/* && pip3 install --break-system-packages edge-tts
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci --omit=dev && npm rebuild sqlite3
COPY . .
RUN mkdir -p /app/data /app/data/videos /app/logs
EXPOSE 3016
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD wget -qO- http://localhost:3016/health || exit 1
CMD ["node", "src/server.js"]
