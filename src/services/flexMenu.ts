import { MENU_ITEMS } from './menu'
import type { UserOrderState } from './orderState'

export const createMenuFlexMessage = (state: UserOrderState) => {
  const bubbles = MENU_ITEMS.map((item) => {
    const qty = state.items[item.id] || 0
    return {
      type: 'bubble' as const,
      size: 'micro' as const,
      hero: {
        type: 'image' as const,
        url: 'https://via.placeholder.com/300x300/ff6600/ffffff?text=KAPRAO',
        size: 'full' as const,
        aspectRatio: '1:1' as const,
        aspectMode: 'cover' as const
      },
      body: {
        type: 'body' as const,
        contents: [
          {
            type: 'text' as const,
            text: item.name,
            weight: 'bold' as const,
            size: 'sm' as const,
            wrap: true
          },
          {
            type: 'text' as const,
            text: `${item.price} บาท`,
            color: '#aaaaaa',
            size: 'xs' as const
          }
        ]
      },
      footer: {
        type: 'footer' as const,
        contents: [
          {
            type: 'button' as const,
            action: {
              type: 'postback' as const,
              label: '➖',
              data: `decrease:${item.id}`
            },
            style: 'secondary' as const,
            color: '#ff4444'
          },
          {
            type: 'text' as const,
            text: `${qty}`,
            align: 'center' as const,
            gravity: 'center' as const,
            size: 'sm' as const,
            weight: 'bold' as const
          },
          {
            type: 'button' as const,
            action: {
              type: 'postback' as const,
              label: '➕',
              data: `increase:${item.id}`
            },
            style: 'primary' as const,
            color: '#00aa00'
          }
        ],
        flex: 0
      }
    }
  })

  return {
    type: 'carousel' as const,
    contents: bubbles
  }
}

export const createOrderSummaryFlexMessage = (state: UserOrderState) => {
  const items = Object.entries(state.items)
    .map(([menuId, qty]) => {
      const menu = MENU_ITEMS.find((m) => m.id === menuId)
      return menu ? { name: menu.name, qty, price: menu.price * qty } : null
    })
    .filter(Boolean) as Array<{ name: string; qty: number; price: number }>

  const total = items.reduce((sum, item) => sum + item.price, 0)
  const itemTexts = items
    .map((item) => `• ${item.name} x${item.qty} = ${item.price} บาท`)
    .join('\n')

  return {
    type: 'bubble' as const,
    body: {
      type: 'body' as const,
      contents: [
        {
          type: 'text' as const,
          text: '📋 สรุปออเดอร์ของคุณ',
          weight: 'bold' as const,
          size: 'lg' as const
        },
        {
          type: 'separator' as const,
          margin: 'md' as const
        },
        {
          type: 'text' as const,
          text: itemTexts || 'ยังไม่มีรายการ',
          size: 'sm' as const,
          wrap: true,
          margin: 'md' as const
        },
        {
          type: 'separator' as const,
          margin: 'md' as const
        },
        {
          type: 'text' as const,
          text: ` รวมทั้งหมด: ${total} บาท`,
          weight: 'bold' as const,
          size: 'md' as const,
          color: '#ff6600'
        }
      ]
    },
    footer: {
      type: 'footer' as const,
      contents: [
        {
          type: 'button' as const,
          action: {
            type: 'postback' as const,
            label: '✅ ยืนยันออเดอร์',
            data: 'confirm_order'
          },
          style: 'primary' as const,
          color: '#00aa00'
        },
        {
          type: 'button' as const,
          action: {
            type: 'postback' as const,
            label: '🔄 เริ่มใหม่',
            data: 'reset_order'
          },
          style: 'secondary' as const
        }
      ]
    }
  }
}