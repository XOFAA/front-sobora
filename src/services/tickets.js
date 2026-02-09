import api from './api'

export async function fetchMyTickets() {
  const { data } = await api.get('/tickets/me')
  return data
}

export async function requestTicketTransfer(ticketId, payload) {
  const { data } = await api.post(`/tickets/${ticketId}/transfer`, payload)
  return data
}

export async function acceptTicketTransfer(token, payload) {
  const { data } = await api.post(`/tickets/transfer/accept/${token}`, payload)
  return data
}
