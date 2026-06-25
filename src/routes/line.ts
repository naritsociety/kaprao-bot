import { Elysia } from 'elysia'
import { config } from '../config/env'
import { replyTextMessages } from '../services/line'

type LineTextMessageEvent = {
  type: 'message'
  replyToken: string
  message: {
    type: 'text'
    text: string
  }
}

type LineWebhookEvent =
  | LineTextMessageEvent
  | {
      type: string
      [key: string]: unknown
    }

type LineWebhookBody = {
  events?: LineWebhookEvent[]
}

const isTextMessageEvent = (
  event: LineWebhookEvent
): event is LineTextMessageEvent =>
  event.type === 'message' &&
  typeof (event as LineTextMessageEvent).replyToken === 'string' &&
  (event as LineTextMessageEvent).message?.type === 'text'

export const lineRoutes = new Elysia().post('/webhook', async ({ body, set }) => {
  const events = Array.isArray((body as LineWebhookBody).events)
    ? (body as LineWebhookBody).events
    : []

  const textMessageEvents = events.filter(isTextMessageEvent)

  if (textMessageEvents.length > 0 && !config.lineChannelAccessToken) {
    set.status = 500
    return {
      ok: false,
      message: 'LINE_CHANNEL_ACCESS_TOKEN is not configured'
    }
  }

  for (const event of textMessageEvents) {
    await replyTextMessages(event.replyToken, [
      'ได้รับออเดอร์แล้วครับ ทางร้านจะรีบทำให้เร็วที่สุด'
    ])
  }

  return { ok: true }
})
