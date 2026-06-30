export type UserOrderState = {
  items: Record<string, number> // menuId -> quantity
  updatedAt: number
}

const orderStates = new Map<string, UserOrderState>()
const EXPIRY_MS = 30 * 60 * 1000 // 30 นาทีแล้วล้างออเดอร์ทิ้ง

export const getOrderState = (userId: string): UserOrderState => {
  const state = orderStates.get(userId)
  if (!state || Date.now() - state.updatedAt > EXPIRY_MS) {
    const newState: UserOrderState = { items: {}, updatedAt: Date.now() }
    orderStates.set(userId, newState)
    return newState
  }
  state.updatedAt = Date.now()
  return state
}

export const updateOrderItem = (userId: string, menuId: string, quantity: number) => {
  const state = getOrderState(userId)
  if (quantity <= 0) {
    delete state.items[menuId]
  } else {
    state.items[menuId] = quantity
  }
  state.updatedAt = Date.now()
  return state
}

export const clearOrderState = (userId: string) => {
  orderStates.delete(userId)
}