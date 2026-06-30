import { Elysia } from 'elysia'
import { config } from '../config/env'
import { replyTextMessages, replyFlexMessage, getProfile } from '../services/line'
import { 
  getOrderState, 
  updateOrderItem, 
  clearOrderState, 
  confirmOrder,
  hasActiveOrder 
} from '../services/orderState'
import { createMenuFlexMessage, createOrderSummaryFlexMessage } from '../services/flexMenu'
import { MENU_ITEMS } from '../services/menu'

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

const fetchCustomerName = async (userId: string): Promise<string> => {
  try {
    const profile = await getProfile(userId)
    return profile.displayName
  } catch {
    return 'ลูกค้า'
  }
}

const handleTextMessage = async (event: LineTextMessageEvent, customerName: string) => {
  const text = event.message.text.trim().toLowerCase()
  const userId = event.source.userId

  if (text === 'menu' || text === 'เมนู') {
    const state = getOrderState(userId)
    const flex = createMenuFlexMessage(state)
    await replyFlexMessage(event.replyToken, `${customerName} เลือกเมนูได้เลยครับ 🌶️`, flex)
    return
  }

  if (text === 'สถานะ' || text === 'status') {
    await replyTextMessages(event.replyToken, [
      `📱 สถานะออเดอร์ของคุณ ${customerName}\n\nกรุณารอสักครู่... ระบบกำลังตรวจสอบ`
    ])
    return
  }

  if (text === 'ติดต่อ' || text === 'ติดต่อเรา' || text === 'contact') {
    await replyTextMessages(event.replyToken, [
      `📞 ติดต่อเรา\n\n📱 Tel: 081-234-5678\n🕐 เปิดทุกวัน 10:00-20:00 น.\n\nมีข้อสงสัยถามได้เลยครับคุณ ${customerName} 🙏`
    ])
    return
  }

  if (text === 'ยืนยัน' || text === 'ส่งออเดอร์' || text === 'confirm') {
    if (!hasActiveOrder(userId)) {
      await replyTextMessages(event.replyToken, [
        `คุณ ${customerName} ไม่มีออเดอร์ที่รอการยืนยันครับ 🙏\n\nกดปุ่ม "เมนู" เพื่อสั่งอาหารได้เลยครับ 🍳`
      ])
      return
    }
    
    confirmOrder(userId)
    
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
      `✅ ยืนยันออเดอร์สำเร็จครับ!\n\nเรียนคุณ ${customerName}\n📋 ${items}\n\n💰 รวม ${total} บาท\n\nเราจะดำเนินการจัดส่งให้เร็วที่สุดครับ 🙏`
    ])
    
    setTimeout(() => clearOrderState(userId), 5000)
    return
  }

  if (text === 'reset' || text === 'เริ่มใหม่') {
    clearOrderState(userId)
    await replyTextMessages(event.replyToken, [
      `เริ่มออเดอร์ใหม่แล้วครับคุณ ${customerName}\n\nกดปุ่ม "เมนู" เพื่อเลือกอาหารได้เลยครับ 🍳`
    ])
    return
  }

  if (text === 'order' || text === 'สรุป') {
    const state = getOrderState(userId)
    if (Object.keys(state.items).length === 0) {
      await replyTextMessages(event.replyToken, [
        `คุณ ${customerName} ยังไม่มีรายการในออเดอร์ครับ\n\nกดปุ่ม "เมนู" เพื่อเลือกอาหารได้เลยครับ 🍳`
      ])
      return
    }
    const flex = createOrderSummaryFlexMessage(state)
    await replyFlexMessage(event.replyToken, `สรุปออเดอร์ของคุณ ${customerName}`, flex)
    return
  }

  await replyTextMessages(event.replyToken, [
    `สวัสดีครับคุณ ${customerName}! 🙏\n\nกดปุ่มด้านล่างเพื่อใช้งานได้เลยครับ 👇`
  ])
}

const handlePostback = async (event: LinePostbackEvent, customerName: string) => {
  const data = event.postback.data
  const userId = event.source.userId

  if (data.startsWith('increase:') || data.startsWith('decrease:')) {
    const state = getOrderState(userId)
    if (state.status === 'confirmed') {
      await replyTextMessages(event.replyToken, [
        `คุณ ${customerName} ยืนยันออเดอร์นี้ไปแล้วครับ 🙏\n\nหากต้องการสั่งใหม่ กดปุ่ม "เริ่มใหม่" ได้เลยครับ`
      ])
      return
    }
    
    const [action, menuId] = data.split(':')
    const currentQty = state.items[menuId] || 0
    const newQty = action === 'increase' ? currentQty + 1 : Math.max(0, currentQty - 1)
    updateOrderItem(userId, menuId, newQty)

    const flex = createMenuFlexMessage(getOrderState(userId))
    await replyFlexMessage(event.replyToken, `${customerName} เลือกเมนูได้เลยครับ 🌶️`, flex)
    return
  }

  if (data === 'confirm_order') {
    if (!hasActiveOrder(userId)) {
      await replyTextMessages(event.replyToken, [
        `คุณ ${customerName} ไม่มีออเดอร์ที่รอการยืนยันครับ 🙏\n\nกดปุ่ม "เมนู" เพื่อสั่งอาหารได้เลยครับ 🍳`
      ])
      return
    }
    
    confirmOrder(userId)
    
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
      `✅ ยืนยันออเดอร์สำเร็จครับ!\n\nเรียนคุณ ${customerName}\n📋 ${items}\n\n💰 รวม ${total} บาท\n\nเราจะดำเนินการจัดส่งให้เร็วที่สุดครับ 🙏`
    ])
    
    setTimeout(() => clearOrderState(userId), 5000)
    return
  }

  if (data === 'reset_order') {
    clearOrderState(userId)
    await replyTextMessages(event.replyToken, [
      `เริ่มออเดอร์ใหม่แล้วครับคุณ ${customerName}\n\nกดปุ่ม "เมนู" เพื่อเลือกอาหารได้เลยครับ 🍳`
    ])
    return
  }
}

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