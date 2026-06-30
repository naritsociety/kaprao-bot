export type MenuItem = {
  id: string
  name: string
  price: number
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'kaprao_pork', name: 'กะเพราหมูสับ', price: 60 },
  { id: 'kaprao_chicken', name: 'กะเพราไก่สับ', price: 60 },
  { id: 'kaprao_beef', name: 'กะเพราเนื้อสับ', price: 70 },
  { id: 'kaprao_crispy_pork', name: 'กะเพราหมูกรอบ', price: 70 }
]

export const getMenuById = (id: string) => MENU_ITEMS.find((m) => m.id === id)