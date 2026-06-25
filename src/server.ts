import { Elysia } from 'elysia'
import { lineRoutes } from './routes/line'

export const createApp = () =>
  new Elysia()
    .get('/', () => ({
      name: 'kaprao-bot',
      status: 'ok'
    }))
    .get('/health', () => ({
      status: 'ok'
    }))
    .use(lineRoutes)
