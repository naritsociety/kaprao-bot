import { config } from '../config/env'

const lineApiUrl = 'https://api.line.me/v2/bot'

type RichMenuArea = {
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  action: {
    type: string
    label?: string
    data?: string
    text?: string
    uri?: string
  }
}

type RichMenuSize = {
  width: number
  height: number
}

type RichMenu = {
  size: RichMenuSize
  selected: boolean
  name: string
  chatBarText: string
  areas: RichMenuArea[]
}

// สร้าง Rich Menu สำหรับเมนูหลัก
export const createMainRichMenu = (): RichMenu => ({
  size: {
    width: 2500,
    height: 1686
  },
  selected: false,
  name: 'Main Menu',
  chatBarText: 'เมนู',
  areas: [
    {
      // ปุ่มเมนู (ซ้ายบน)
      bounds: {
        x: 0,
        y: 0,
        width: 833,
        height: 843
      },
      action: {
        type: 'message',
        label: 'เมนูอาหาร',
        text: 'menu'
      }
    },
    {
      // ปุ่มสถานะออเดอร์ (กลางบน)
      bounds: {
        x: 834,
        y: 0,
        width: 833,
        height: 843
      },
      action: {
        type: 'message',
        label: 'สถานะออเดอร์',
        text: 'สถานะ'
      }
    },
    {
      // ปุ่มติดต่อ (ขวาบน)
      bounds: {
        x: 1667,
        y: 0,
        width: 833,
        height: 843
      },
      action: {
        type: 'message',
        label: 'ติดต่อเรา',
        text: 'ติดต่อ'
      }
    },
    {
      // ปุ่มส่งออเดอร์ (ซ้ายล่าง)
      bounds: {
        x: 0,
        y: 844,
        width: 1250,
        height: 842
      },
      action: {
        type: 'message',
        label: 'ส่งออเดอร์',
        text: 'ยืนยัน'
      }
    },
    {
      // ปุ่มเริ่มใหม่ (ขวาล่าง)
      bounds: {
        x: 1250,
        y: 844,
        width: 1250,
        height: 842
      },
      action: {
        type: 'message',
        label: 'เริ่มใหม่',
        text: 'reset'
      }
    }
  ]
})

// อัปโหลดรูปภาพ Rich Menu
export const uploadRichMenuImage = async (richMenuId: string, imagePath: string) => {
  const fs = await import('fs')
  const image = fs.readFileSync(imagePath)
  
  const response = await fetch(`${lineApiUrl}/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg',
      Authorization: `Bearer ${config.lineChannelAccessToken}`
    },
    body: image
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Upload rich menu image failed: ${response.status} ${errorBody}`)
  }

  return response.json()
}

// สร้าง Rich Menu บน LINE
export const createRichMenu = async (): Promise<string> => {
  const richMenu = createMainRichMenu()
  
  const response = await fetch(`${lineApiUrl}/richmenu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.lineChannelAccessToken}`
    },
    body: JSON.stringify(richMenu)
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Create rich menu failed: ${response.status} ${errorBody}`)
  }

  const data = await response.json()
  return data.richMenuId
}

// เชื่อม Rich Menu กับผู้ใช้
export const linkRichMenuToUser = async (userId: string, richMenuId: string) => {
  const response = await fetch(`${lineApiUrl}/user/${userId}/richmenu/${richMenuId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.lineChannelAccessToken}`
    }
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Link rich menu failed: ${response.status} ${errorBody}`)
  }

  return true
}

// เชื่อม Rich Menu กับผู้ใช้ทุกคน (Broadcast)
export const setDefaultRichMenu = async (richMenuId: string) => {
  const response = await fetch(`${lineApiUrl}/user/all/richmenu/${richMenuId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.lineChannelAccessToken}`
    }
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Set default rich menu failed: ${response.status} ${errorBody}`)
  }

  return true
}

// ลบ Rich Menu
export const deleteRichMenu = async (richMenuId: string) => {
  const response = await fetch(`${lineApiUrl}/richmenu/${richMenuId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${config.lineChannelAccessToken}`
    }
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Delete rich menu failed: ${response.status} ${errorBody}`)
  }

  return true
}

// ตั้งค่า Rich Menu เริ่มต้น (สำหรับจารย์ใช้ครั้งเดียว)
export const setupRichMenu = async () => {
  try {
    console.log('Creating rich menu...')
    const richMenuId = await createRichMenu()
    console.log('Rich menu created:', richMenuId)

    // อัปโหลดรูปภาพ (จารย์ต้องสร้างรูปขนาด 2500x1686 px)
    // await uploadRichMenuImage(richMenuId, './rich-menu.png')
    
    // ตั้งค่าเป็น default สำหรับผู้ใช้ทุกคน
    await setDefaultRichMenu(richMenuId)
    console.log('Rich menu set as default')
    
    return richMenuId
  } catch (error) {
    console.error('Failed to setup rich menu:', error)
    throw error
  }
}