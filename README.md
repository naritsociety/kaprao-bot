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
- `GET /admin/setup-richmenu` (create + set default rich menu)

To setup the rich menu:

1. Set `LINE_CHANNEL_ACCESS_TOKEN` in `.env`.
2. Start the app with `bun run dev` or `bun run start`.
3. Open `http://localhost:3000/admin/setup-richmenu` in your browser.

The endpoint will create the rich menu, upload a placeholder image, and set it as the default menu for your LINE bot.

## Production Start

```bash
bun run start
```

## PM2

Use Bun as the interpreter and point PM2 at `src/index.ts`.

```bash
pm2 delete kaprao-api
pm2 start ecosystem.config.cjs
pm2 save
```

If the app is already registered with PM2:

```bash
pm2 restart kaprao-api --update-env
```
