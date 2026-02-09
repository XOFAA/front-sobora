import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sobora_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
