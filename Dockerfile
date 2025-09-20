# ใช้ Bun official image
FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .

EXPOSE 3000
CMD ["bun", "run", "index.ts"]
