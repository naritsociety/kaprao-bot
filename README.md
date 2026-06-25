# Kaprao Bot

Bun + Elysia API for a LINE webhook bot.

## Project Structure

```text
src/
  config/
    env.ts          Runtime environment settings
  routes/
    line.ts         LINE webhook route
  services/
    line.ts         LINE Messaging API client helpers
  index.ts          Bun entrypoint
  server.ts         Elysia app factory
```

## Requirements

- Bun 1.3+
- LINE channel access token

## Setup

```bash
bun install
cp .env.example .env
```

Set `LINE_CHANNEL_ACCESS_TOKEN` in `.env`.

## Development

```bash
bun run dev
```

The API starts on `http://localhost:3000` by default.

Available routes:

- `GET /`
- `GET /health`
- `POST /webhook`

## Production Start

```bash
bun run start
```
