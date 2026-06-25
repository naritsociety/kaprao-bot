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

const lineReplyUrl = 'https://api.line.me/v2/bot/message/reply'

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
