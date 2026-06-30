import { config } from '../config/env'

type LineTextMessage = {
  type: 'text'
  text: string
}

type LineReplyResponse = {
  sentMessages?: Array<{
    id: string
    quoteToken?: string
  }>
}

// เพิ่ม Type สำหรับ Profile
type LineProfile = {
  displayName: string
  userId: string
  pictureUrl?: string
  statusMessage?: string
  language?: string
}

const lineReplyUrl = 'https://api.line.me/v2/bot/message/reply'
const lineProfileUrl = 'https://api.line.me/v2/bot/profile'

export const replyTextMessages = async (
  replyToken: string,
  texts: string[]
): Promise<LineReplyResponse> => {
  const messages: LineTextMessage[] = texts.map((text) => ({
    type: 'text',
    text
  }))

  const response = await fetch(lineReplyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.lineChannelAccessToken}`
    },
    body: JSON.stringify({
      replyToken,
      messages
    })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`LINE reply failed: ${response.status} ${errorBody}`)
  }

  return response.json()
}

// ฟังก์ชันใหม่: ดึง Profile ลูกค้า
export const getProfile = async (userId: string): Promise<LineProfile> => {
  const response = await fetch(`${lineProfileUrl}/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.lineChannelAccessToken}`
    }
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`LINE get profile failed: ${response.status} ${errorBody}`)
  }

  return response.json()
}