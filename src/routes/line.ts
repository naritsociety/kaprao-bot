import { Elysia } from 'elysia'
import { config } from '../config/env'
// ✅ ตอนนี้ import ครบ 3 ตัวแล้ว เพราะเราเพิ่ม export ใน services/line.ts เรียบร้อย
import { replyTextMessages, replyFlexMessage, getProfile } from '../services/line'
import { getOrderState, updateOrderItem, clearOrderState } from '../services/orderState'
import { createMenuFlexMessage, createOrderSummaryFlexMessage } from '../services/flexMenu'
import { MENU_ITEMS } from '../services/menu'

// ===== Types =====
type LineTextMessageEvent = {
  type: 'message'
  replyToken: string
  source: { userId: string }
  message: { type: 'text'; text: string }
}

type LinePostbackEvent = {
  type: 'postback'
  replyToken: string
  source: { userId: string }
  postback: { data: string }
}

type LineWebhookEvent =
  | LineTextMessageEvent
  | LinePostbackEvent
  | { type: string; [key: string]: unknown }

type LineWebhookBody = { events?: LineWebhookEvent[] }

// ===== Type Guards =====
const isTextMessageEvent = (event: LineWebhookEvent): event is LineTextMessageEvent =>
  event.type === 'message' &&
  typeof (event as LineTextMessageEvent).replyToken === 'string' &&
  typeof (event as LineTextMessageEvent).source?.userId === 'string' &&
  (event as LineTextMessageEvent).message?.type === 'text'

const isPostbackEvent = (event: LineWebhookEvent): event is LinePostbackEvent =>
  event.type === 'postback' &&
  typeof (event as LinePostbackEvent).replyToken === 'string' &&
  typeof (event as LinePostbackEvent).source?.userId === 'string' &&
  typeof (event as LinePostbackEvent).postback?.data === 'string'

// ===== Helpers =====
const fetchCustomerName = async (userId: string): Promise<string> => {
  try {
    const profile = await getProfile(userId)
    return profile.displayName
  } catch {
    return 'ลูกค้า'
  }
}

// ===== Handlers =====
const handleTextMessage = async (event: LineTextMessageEvent, customerName: string) => {
  const text = event.message.text.trim().toLowerCase()
  const userId = event.source.userId

  if (text === 'เมนู' || text === 'menu') {
    const state = getOrderState(userId)
    const flex = createMenuFlexMessage(state)
    await replyFlexMessage(event.replyToken, `${customerName} เลือกเมนูได้เลยครับ ️`, flex)
    return
  }

  if (text === 'ยืนยัน' || text === 'order' || text === 'สรุป') {
    const state = getOrderState(userId)
    if (Object.keys(state.items).length === 0) {
      await replyTextMessages(event.replyToken, [
        `คุณ ${customerName} ยังไม่มีรายการในออเดอร์ครับ พิมพ์ "เมนู" เพื่อเลือกอาหารได้เลย 🍳`
      ])
      return
    }
    const flex = createOrderSummaryFlexMessage(state)
    await replyFlexMessage(event.replyToken, `สรุปออเดอร์ของคุณ ${customerName}`, flex)
    return
  }

  await replyTextMessages(event.replyToken, [
    `สวัสดีครับคุณ ${customerName}! \nพิมพ์ "เมนู" เพื่อดูรายการอาหารได้เลยครับ 🍳`
  ])
}

const handlePostback = async (event: LinePostbackEvent, customerName: string) => {
  const data = event.postback.data
  const userId = event.source.userId

  if (data.startsWith('increase:') || data.startsWith('decrease:')) {
    const [action, menuId] = data.split(':')
    const state = getOrderState(userId)
    const currentQty = state.items[menuId] || 0
    const newQty = action === 'increase' ? currentQty + 1 : Math.max(0, currentQty - 1)
    updateOrderItem(userId, menuId, newQty)

    const flex = createMenuFlexMessage(getOrderState(userId))
    await replyFlexMessage(event.replyToken, `${customerName} เลือกเมนูได้เลยครับ 🌶️`, flex)
    return
  }

  if (data === 'confirm_order') {
    const state = getOrderState(userId)
    const items = Object.entries(state.items)
      .map(([menuId, qty]) => {
        const menu = MENU_ITEMS.find((m) => m.id === menuId)
        return menu ? `${menu.name} x${qty}` : null
      })
      .filter(Boolean)
      .join('\n')

    const total = Object.entries(state.items).reduce((sum, [menuId, qty]) => {
      const menu = MENU_ITEMS.find((m) => m.id === menuId)
      return sum + (menu?.price || 0) * qty
    }, 0)

    await replyTextMessages(event.replyToken, [
      `✅ คุณ ${customerName} ยืนยันออเดอร์แล้วครับ!\n\n📋 ${items}\n\n💰 รวม ${total} บาท\n\nเราจะดำเนินการจัดส่งให้เร็วที่สุดครับ 🙏`
    ])
    clearOrderState(userId)
    return
  }

  if (data === 'reset_order') {
    clearOrderState(userId)
    await replyTextMessages(event.replyToken, [
      `เริ่มออเดอร์ใหม่แล้วครับคุณ ${customerName} พิมพ์ "เมนู" เพื่อเลือกอาหารได้เลย 🍳`
    ])
    return
  }
}

// ===== Route =====
export const lineRoutes = new Elysia().post('/webhook', async ({ body, set }) => {
  const events: LineWebhookEvent[] = Array.isArray((body as LineWebhookBody).events)
    ? ((body as LineWebhookBody).events as LineWebhookEvent[])
    : []

  console.log(`LINE webhook received ${events.length} event(s)`)

  if (events.length > 0 && !config.lineChannelAccessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not configured')
    set.status = 200
    return { ok: false, message: 'LINE_CHANNEL_ACCESS_TOKEN is not configured' }
  }

  for (const event of events) {
    try {
      let userId = ''
      if (isTextMessageEvent(event)) userId = event.source.userId
      else if (isPostbackEvent(event)) userId = event.source.userId
      else continue

      const customerName = await fetchCustomerName(userId)

      if (isTextMessageEvent(event)) {
        await handleTextMessage(event, customerName)
      } else if (isPostbackEvent(event)) {
        await handlePostback(event, customerName)
      }
    } catch (error) {
      console.error('Failed to handle LINE event', error)
    }
  }

  return { ok: true }
})