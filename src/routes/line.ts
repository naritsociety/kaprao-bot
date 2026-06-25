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

const orderReceivedReply =
  '\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e2d\u0e2d\u0e40\u0e14\u0e2d\u0e23\u0e4c\u0e41\u0e25\u0e49\u0e27\u0e04\u0e23\u0e31\u0e1a \u0e17\u0e32\u0e07\u0e23\u0e49\u0e32\u0e19\u0e08\u0e30\u0e23\u0e35\u0e1a\u0e17\u0e33\u0e43\u0e2b\u0e49\u0e40\u0e23\u0e47\u0e27\u0e17\u0e35\u0e48\u0e2a\u0e38\u0e14'

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

  console.log(`LINE webhook received ${events.length} event(s)`)

  if (textMessageEvents.length > 0 && !config.lineChannelAccessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not configured')
    set.status = 200
    return {
      ok: false,
      message: 'LINE_CHANNEL_ACCESS_TOKEN is not configured'
    }
  }

  for (const event of textMessageEvents) {
    try {
      await replyTextMessages(event.replyToken, [orderReceivedReply])
      console.log('Replied to LINE text message')
    } catch (error) {
      console.error('Failed to reply to LINE text message', error)
    }
  }

  return { ok: true }
})
