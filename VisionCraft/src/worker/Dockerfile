FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

# System libs (incl. libgomp1 for Open3D/NumPy)
RUN apt-get update && apt-get install -y \
    curl wget git unzip ca-certificates \
    libgl1 libglib2.0-0 libxrender1 libxext6 libxi6 libxxf86vm1 libfontconfig1 \
    libdbus-1-3 libxkbcommon0 libusb-1.0-0 \
    libgomp1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# OBJ->GLB tools (used for photogrammetry outputs)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get update && apt-get install -y nodejs \
  && npm i -g obj2gltf gltf-pipeline \
  && rm -rf /var/lib/apt/lists/*

# Meshroom headless (photogrammetry)
ARG MESHROOM_VER=2023.3.0
RUN wget -O /usr/local/bin/Meshroom.AppImage \
      https://github.com/alicevision/meshroom/releases/download/v${MESHROOM_VER}/Meshroom-${MESHROOM_VER}-linux.AppImage \
  && chmod +x /usr/local/bin/Meshroom.AppImage \
  && /usr/local/bin/Meshroom.AppImage --help >/dev/null 2>&1 || true

# App code
COPY . .

CMD ["python","worker.py"]
