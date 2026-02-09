import api from './api'

export async function createOrder(items) {
  const { data } = await api.post('/orders', { items })
  return data
}

export async function fetchMyOrders() {
  const { data } = await api.get('/orders/me')
  return data
}
