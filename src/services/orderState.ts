export type OrderStatus = 'pending' | 'confirmed' | 'delivered'

export type UserOrderState = {
  items: Record<string, number> // menuId -> quantity
  status: OrderStatus
  updatedAt: number
  confirmedAt?: number
}

const orderStates = new Map<string, UserOrderState>()
const EXPIRY_MS = 30 * 60 * 1000 // 30 นาทีแล้วล้างออเดอร์ทิ้ง

export const getOrderState = (userId: string): UserOrderState => {
  const state = orderStates.get(userId)
  if (!state || Date.now() - state.updatedAt > EXPIRY_MS) {
    const newState: UserOrderState = { 
      items: {}, 
      status: 'pending',
      updatedAt: Date.now() 
    }
    orderStates.set(userId, newState)
    return newState
  }
  state.updatedAt = Date.now()
  return state
}

export const updateOrderItem = (userId: string, menuId: string, quantity: number) => {
  const state = getOrderState(userId)
  
  // ถ้า confirm แล้ว ห้ามแก้ไข
  if (state.status === 'confirmed') {
    throw new Error('Order already confirmed')
  }
  
  if (quantity <= 0) {
    delete state.items[menuId]
  } else {
    state.items[menuId] = quantity
  }
  state.updatedAt = Date.now()
  return state
}

export const confirmOrder = (userId: string) => {
  const state = getOrderState(userId)
  state.status = 'confirmed'
  state.confirmedAt = Date.now()
  state.updatedAt = Date.now()
  return state
}

export const clearOrderState = (userId: string) => {
  orderStates.delete(userId)
}

export const hasActiveOrder = (userId: string): boolean => {
  const state = orderStates.get(userId)
  if (!state) return false
  if (Date.now() - state.updatedAt > EXPIRY_MS) return false
  return state.status === 'pending' && Object.keys(state.items).length > 0
}