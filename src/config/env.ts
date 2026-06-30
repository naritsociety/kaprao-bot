const DEFAULT_PORT = 3000

const toPort = (value: string | undefined) => {
  if (!value) return DEFAULT_PORT

  const port = Number(value)
  return Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT
}

export const config = {
  port: toPort(process.env.PORT),
  lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
  lineChannelSecret: process.env.LINE_CHANNEL_SECRET ?? ''
}
