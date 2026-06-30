import { Elysia } from 'elysia'
import { config } from './config/env'
import { lineRoutes } from './routes/line'
import { adminRoutes } from './routes/admin'

export const createApp = () =>
  new Elysia()
    .get('/', () => ({
      name: 'kaprao-bot',
      status: 'ok'
    }))
    .get('/health', () => ({
      status: 'ok',
      lineConfigured: Boolean(config.lineChannelAccessToken)
    }))
    .use(lineRoutes)
    .use(adminRoutes)