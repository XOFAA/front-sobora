import api from './api'

export async function createOrder(items) {
  const payload = Array.isArray(items) ? { items } : items
  const { data } = await api.post('/orders', payload)
  return data
}

export async function fetchMyOrders() {
  const { data } = await api.get('/orders/me')
  return data
}
