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
  'ได้รับออเดอร์ของคุณแล้ว! เราจะดำเนินการจัดส่งให้เร็วที่สุด ขอบคุณที่ใช้บริการของเรา 🙏'

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
