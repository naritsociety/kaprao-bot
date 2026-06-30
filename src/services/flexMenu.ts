import { MENU_ITEMS } from './menu'
import type { UserOrderState } from './orderState'

export const createMenuFlexMessage = (state: UserOrderState) => {
  const bubbles = MENU_ITEMS.map((item) => {
    const qty = state.items[item.id] || 0
    return {
      type: 'bubble',
      size: 'micro',
      hero: {
        type: 'image',
        url: 'https://via.placeholder.com/300x300/ff6600/ffffff?text=KAPRAO',
        size: 'full',
        aspectRatio: '1:1',
        aspectMode: 'cover'
      },
      body: {
        type: 'body',
        contents: [
          {
            type: 'text',
            text: item.name,
            weight: 'bold',
            size: 'sm',
            wrap: true
          },
          {
            type: 'text',
            text: `${item.price} บาท`,
            color: '#aaaaaa',
            size: 'xs'
          }
        ]
      },
      footer: {
        type: 'footer',
        spacing: 'sm',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'postback',
                  label: '➖',
                  data: `decrease:${item.id}`
                },
                style: 'secondary',
                color: '#ff4444',
                flex: 1
              },
              {
                type: 'text',
                text: `${qty}`,
                align: 'center',
                gravity: 'center',
                size: 'md',
                weight: 'bold',
                flex: 1
              },
              {
                type: 'button',
                action: {
                  type: 'postback',
                  label: '➕',
                  data: `increase:${item.id}`
                },
                style: 'primary',
                color: '#00aa00',
                flex: 1
              }
            ]
          }
        ]
      }
    }
  })

  return {
    type: 'carousel',
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
    type: 'bubble',
    body: {
      type: 'body',
      contents: [
        {
          type: 'text',
          text: '📋 สรุปออเดอร์ของคุณ',
          weight: 'bold',
          size: 'lg'
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'text',
          text: itemTexts || 'ยังไม่มีรายการ',
          size: 'sm',
          wrap: true,
          margin: 'md'
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'text',
          text: `รวมทั้งหมด: ${total} บาท`,
          weight: 'bold',
          size: 'md',
          color: '#ff6600'
        }
      ]
    },
    footer: {
      type: 'footer',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '✅ ยืนยันออเดอร์',
            data: 'confirm_order'
          },
          style: 'primary',
          color: '#00aa00'
        },
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '🔄 เริ่มใหม่',
            data: 'reset_order'
          },
          style: 'secondary'
        }
      ]
    }
  }
}