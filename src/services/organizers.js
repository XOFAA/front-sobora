import api from './api'

export async function fetchOrganizer(tenantId) {
  const { data } = await api.get(`/organizers/${tenantId}`)
  return data
}
