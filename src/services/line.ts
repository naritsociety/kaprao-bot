import { config } from '../config/env'

// ===== Types =====
type LineTextMessage = {
  type: 'text'
  text: string
}

type FlexMessage = {
  type: 'flex'
  altText: string
  contents: any
}

export type LineReplyResponse = {
  sentMessages?: Array<{
    id: string
    quoteToken?: string
  }>
}

export type LineProfile = {
  displayName: string
  userId: string
  pictureUrl?: string
  statusMessage?: string
  language?: string
}

const lineReplyUrl = 'https://api.line.me/v2/bot/message/reply'
const lineProfileUrl = 'https://api.line.me/v2/bot/profile'

// ===== 1. ฟังก์ชันส่งข้อความธรรมดา =====
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
    body: JSON.stringify({ replyToken, messages })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`LINE reply failed: ${response.status} ${errorBody}`)
  }

  return response.json()
}

// ===== 2. ฟังก์ชันส่ง Flex Message (การ์ดสวยๆ) =====
export const replyFlexMessage = async (
  replyToken: string,
  altText: string,
  contents: any
): Promise<LineReplyResponse> => {
  const message: FlexMessage = {
    type: 'flex',
    altText,
    contents
  }

  const response = await fetch(lineReplyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.lineChannelAccessToken}`
    },
    body: JSON.stringify({ replyToken, messages: [message] })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`LINE flex reply failed: ${response.status} ${errorBody}`)
  }

  return response.json()
}

// ===== 3. ฟังก์ชันดึง Profile ผู้ใช้ =====
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