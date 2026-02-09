import api from './api'

export async function fetchEvents() {
  const { data } = await api.get('/events')
  return data
}

export async function fetchEvent(id) {
  const { data } = await api.get(`/events/${id}`)
  return data
}

export async function fetchTicketTypes() {
  const { data } = await api.get('/ticket-types')
  return data
}
