import api from './api'

export async function fetchFaceStatus() {
  const { data } = await api.get('/users/me/face')
  return data
}

export async function enrollFace(payload) {
  const { data } = await api.post('/users/me/face/enroll', payload)
  return data
}
