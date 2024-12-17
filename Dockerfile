FROM python:3.10-slim as python-base

# Install Python dependencies
WORKDIR /app/python_bot
COPY python_bot/requirements.txt .
RUN pip install -r requirements.txt

FROM node:18-slim

# Install system dependencies for Puppeteer and debugging tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    git \
    chromium \
    iputils-ping \
    curl \
    net-tools \
    dnsutils \
    procps \
    htop \
    vim \
    lsof \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /usr/share/fonts/truetype/noto \
    && mkdir -p /root/.cache/puppeteer \
    && chmod -R 777 /root/.cache/puppeteer

WORKDIR /app

# Copy Python environment from python-base
COPY --from=python-base /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-gpu --disable-dev-shm-usage"
ENV PYTHONPATH=/app

# Create a non-root user for running Chrome
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

COPY package*.json ./
RUN npm install

COPY . .

# Switch to non-root user
USER pptruser

CMD ["npm", "start"]
