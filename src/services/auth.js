import api from './api'

export async function requestLoginCode(identifier) {
  const { data } = await api.post('/users/request-code', { identifier })
  return data
}

export async function registerUser(payload) {
  const { data } = await api.post('/users/register', payload)
  return data
}

export async function loginWithCode(identifier, code) {
  const { data } = await api.post('/auth/login', { identifier, code })
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me')
  return data
}

export async function updateMe(payload) {
  const { data } = await api.patch('/users/me', payload)
  return data
}
