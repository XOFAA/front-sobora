import api from './api'

export async function fetchMyTickets() {
  const { data } = await api.get('/tickets/me')
  return data
}

export async function fetchTransfersSent() {
  const { data } = await api.get('/tickets/transfers/sent')
  return data
}

export async function requestTicketTransfer(ticketId, payload) {
  const { data } = await api.post(`/tickets/${ticketId}/transfer`, payload)
  return data
}

export async function cancelTicketTransfer(transferId) {
  const { data } = await api.post(`/tickets/transfer/${transferId}/cancel`)
  return data
}

export async function acceptTicketTransferByCode(code, payload) {
  const { data } = await api.post('/tickets/transfer/accept', { code, ...payload })
  return data
}
