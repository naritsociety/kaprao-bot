import { Elysia } from 'elysia'
import { config } from '../config/env'
import { replyTextMessages, getProfile } from '../services/line'

// เพิ่ม source: { userId: string } เข้าไปใน Type
type LineTextMessageEvent = {
  type: 'message'
  replyToken: string
  source: {
    userId: string
  }
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
  typeof (event as LineTextMessageEvent).source?.userId === 'string' &&
  (event as LineTextMessageEvent).message?.type === 'text'

export const lineRoutes = new Elysia().post('/webhook', async ({ body, set }) => {
  const events: LineWebhookEvent[] = Array.isArray((body as LineWebhookBody).events)
    ? ((body as LineWebhookBody).events as LineWebhookEvent[])
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
      // 1. ดึงชื่อลูกค้าจาก userId (ถ้าดึงไม่ได้จะใช้คำว่า 'ลูกค้า' แทน)
      let customerName = 'ลูกค้า'
      try {
        const profile = await getProfile(event.source.userId)
        customerName = profile.displayName
        console.log(`Fetched profile for user: ${customerName}`)
      } catch (profileError) {
        console.warn('Failed to fetch user profile, using default name:', profileError)
      }

      // 2. ประกอบข้อความตอบกลับแบบสนิทสนม
      const replyMessage = `สวัสดีครับคุณ ${customerName}! 🙏\n\nได้รับออเดอร์ของคุณแล้ว เราจะดำเนินการจัดส่งให้เร็วที่สุด ขอบคุณที่ใช้บริการกะเพราวันหยุดนะครับ 🌶️🍳`

      // 3. ส่งข้อความตอบกลับ
      await replyTextMessages(event.replyToken, [replyMessage])
      console.log(`Replied to ${customerName}`)
      
    } catch (error) {
      console.error('Failed to reply to LINE text message', error)
    }
  }

  return { ok: true }
})