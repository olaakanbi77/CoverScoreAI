FROM node:20-slim
WORKDIR /app

# System deps — ffmpeg, imagemagick, espeak-ng (needed by Kokoro TTS)
RUN apt-get update -qq && apt-get install -y -qq \
  python3 python3-pip python3-venv espeak-ng make g++ wget unzip ffmpeg imagemagick \
  && rm -rf /var/lib/apt/lists/*

# Python TTS — Kokoro-82M (replaces edge-tts)
RUN python3 -m venv /opt/venv && \
  /opt/venv/bin/pip install kokoro soundfile numpy misaki[en] && \
  /opt/venv/bin/python3 -c "from kokoro import KPipeline; KPipeline(lang_code='b')" \
  && rm -rf /root/.cache/huggingface

COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci --omit=dev && npm rebuild sqlite3
COPY . .
RUN mkdir -p /app/data /app/data/videos /app/logs

ENV PATH="/opt/venv/bin:$PATH"
EXPOSE 3016
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD wget -qO- http://localhost:3016/health || exit 1
CMD ["node", "src/server.js"]
