import { config } from '../config/env'

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

const getRichMenuImage = async (): Promise<ArrayBuffer> => {
  const imageUrl = 'https://via.placeholder.com/2500x843.png?text=Kaprao'
  const response = await fetch(imageUrl)

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to download rich menu image: ${response.status} ${body}`)
  }

  return response.arrayBuffer()
}

const uploadRichMenuImage = async (richMenuId: string): Promise<void> => {
  ensureAccessToken()
  const imageBuffer = await getRichMenuImage()

  const response = await fetch(`${baseUrl}/${richMenuId}/content`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.lineChannelAccessToken}`,
      'Content-Type': 'image/png'
    },
    body: imageBuffer
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
