import { createApp } from './server'
import { config } from './config/env'

const app = createApp().listen(config.port)

console.log(
  `Kaprao bot API is running at http://${app.server?.hostname}:${app.server?.port}`
)
