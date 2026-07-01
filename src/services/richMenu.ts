import { config } from '../config/env'
import { readFile } from 'fs/promises'
import { deflateSync } from 'zlib'

type RichMenuArea = {
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  action: {
    type: 'message'
    label: string
    text: string
  }
}

type RichMenuPayload = {
  size: {
    width: number
    height: number
  }
  selected: boolean
  name: string
  chatBarText: string
  areas: RichMenuArea[]
}

type RichMenuInfo = {
  richMenuId: string
  size: { width: number; height: number }
  selected: boolean
  name: string
  chatBarText: string
}

type RichMenuListResponse = {
  richmenus: RichMenuInfo[]
}

type RichMenuCreateResponse = {
  richMenuId: string
}

const baseUrl = 'https://api.line.me/v2/bot/richmenu'

const richMenuPayload: RichMenuPayload = {
  size: {
    width: 2500,
    height: 843
  },
  selected: false,
  name: 'Kaprao Bot Rich Menu',
  chatBarText: 'เมนู',
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: 421 },
      action: { type: 'message', label: 'เมนู', text: 'เมนู' }
    },
    {
      bounds: { x: 833, y: 0, width: 834, height: 421 },
      action: { type: 'message', label: 'สรุป', text: 'สรุป' }
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 421 },
      action: { type: 'message', label: 'ยืนยัน', text: 'ยืนยัน' }
    },
    {
      bounds: { x: 0, y: 421, width: 833, height: 422 },
      action: { type: 'message', label: 'เริ่มใหม่', text: 'เริ่มใหม่' }
    },
    {
      bounds: { x: 833, y: 421, width: 834, height: 422 },
      action: { type: 'message', label: 'ติดต่อเรา', text: 'ติดต่อเรา' }
    },
    {
      bounds: { x: 1667, y: 421, width: 833, height: 422 },
      action: { type: 'message', label: 'ติดต่อ', text: 'contact' }
    }
  ]
}

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${config.lineChannelAccessToken}`
})

const ensureAccessToken = () => {
  if (!config.lineChannelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured')
  }
}

const requestJson = async <T>(url: string, init: RequestInit): Promise<T> => {
  const response = await fetch(url, init)

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`LINE rich menu request failed: ${response.status} ${body}`)
  }

  return response.json() as Promise<T>
}

const getRichMenuList = async (): Promise<RichMenuListResponse> => {
  ensureAccessToken()
  return requestJson<RichMenuListResponse>(`${baseUrl}/list`, {
    method: 'GET',
    headers: getAuthHeaders()
  })
}

const createRichMenu = async (): Promise<RichMenuCreateResponse> => {
  ensureAccessToken()
  const created = await requestJson<RichMenuCreateResponse>(baseUrl, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(richMenuPayload)
  })

  if (!created?.richMenuId) {
    throw new Error('LINE rich menu create returned no richMenuId')
  }

  return created
}

const setDefaultRichMenu = async (richMenuId: string): Promise<void> => {
  ensureAccessToken()
  const response = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${encodeURIComponent(richMenuId)}`, {
    method: 'POST',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to set default rich menu: ${response.status} ${body}`)
  }
}

const createPlaceholderRichMenuImage = (): ArrayBuffer => {
  const width = 2500
  const height = 843
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const crc32 = (buffer: Buffer): number => {
    let crc = -1
    for (const byte of buffer) {
      crc ^= byte
      for (let bit = 0; bit < 8; bit++) {
        crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320)
      }
    }
    return (crc ^ -1) >>> 0
  }

  const createChunk = (type: string, data: Buffer): Buffer => {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length, 0)

    const chunk = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(chunk), 0)

    return Buffer.concat([length, chunk, crc])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const rows: Buffer[] = []
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(width * 4 + 1)
    row[0] = 0
    for (let x = 0; x < width; x++) {
      const index = 1 + x * 4
      row[index] = 255
      row[index + 1] = 255
      row[index + 2] = 255
      row[index + 3] = 255
    }
    rows.push(row)
  }

  const compressed = deflateSync(Buffer.concat(rows))
  const pngBuffer = Buffer.concat([
    pngSignature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0))
  ])

  return pngBuffer.buffer.slice(pngBuffer.byteOffset, pngBuffer.byteOffset + pngBuffer.byteLength)
}

const getRichMenuImage = async (): Promise<{ buffer: ArrayBuffer; contentType: 'image/jpeg' | 'image/png' }> => {
  try {
    const file = await readFile(new URL('../rich-menu.jpg', import.meta.url))
    return {
      buffer: file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
      contentType: 'image/jpeg'
    }
  } catch {
    return {
      buffer: createPlaceholderRichMenuImage(),
      contentType: 'image/png'
    }
  }
}

const uploadRichMenuImage = async (richMenuId: string): Promise<void> => {
  ensureAccessToken()
  const { buffer, contentType } = await getRichMenuImage()

  const response = await fetch(`https://api.line.me/v2/bot/richmenu/${encodeURIComponent(richMenuId)}/content`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.lineChannelAccessToken}`,
      'Content-Type': contentType
    },
    body: buffer
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to upload rich menu image: ${response.status} ${body}`)
  }
}

export const getRichMenuListInfo = async (): Promise<RichMenuInfo[]> => {
  const richMenuList = await getRichMenuList()
  return richMenuList.richmenus
}

export const setupRichMenu = async (): Promise<string> => {
  ensureAccessToken()

  const richMenuList = await getRichMenuList()
  const existing = richMenuList.richmenus.find((menu) => menu.name === richMenuPayload.name)

  if (existing) {
    await uploadRichMenuImage(existing.richMenuId)
    await setDefaultRichMenu(existing.richMenuId)
    return existing.richMenuId
  }

  const created = await createRichMenu()
  if (!created.richMenuId) {
    throw new Error('Created rich menu did not include an ID')
  }

  await uploadRichMenuImage(created.richMenuId)
  await setDefaultRichMenu(created.richMenuId)
  return created.richMenuId
}
