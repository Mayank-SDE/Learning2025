FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm i

COPY src ./src
RUN npx tsx --help >/dev/null 2>&1 || true

CMD ["npm","run","dev"]
