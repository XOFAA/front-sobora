import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import LocationOnRounded from '@mui/icons-material/LocationOnRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import { fetchEvent, fetchTicketTypes } from '../services/events'
import { createOrder } from '../services/orders'
import { useAuth } from '../contexts/AuthContext'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002'

const resolveImage = (value) => {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('/')) return `${apiBaseUrl}${value}`
  return `${apiBaseUrl}/${value}`
}

function formatEventDateRange(event) {
  const dates = Array.isArray(event?.dates) && event.dates.length ? event.dates : event?.date ? [event.date] : []
  if (!dates.length) return 'Sem data'
  if (dates.length === 1) return new Date(dates[0]).toLocaleString('pt-BR')
  const first = new Date(dates[0])
  const last = new Date(dates[dates.length - 1])
  return `De ${first.toLocaleString('pt-BR')} a ${last.toLocaleString('pt-BR')}`
}

function EventDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [ticketTypes, setTicketTypes] = useState([])
  const [quantities, setQuantities] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const [eventData, ticketData] = await Promise.all([
          fetchEvent(id),
          fetchTicketTypes(),
        ])
        if (!active) return
        setEvent(eventData)
        const filtered = (ticketData || []).filter((ticket) => ticket.eventId === id && ticket.isActive !== false)
        setTicketTypes(filtered)
      } catch (err) {
        if (active) setError('Nao foi possivel carregar o evento.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  const totalItems = useMemo(
    () => Object.values(quantities).reduce((acc, value) => acc + value, 0),
    [quantities],
  )

  const totalPrice = useMemo(() => {
    return ticketTypes.reduce((acc, ticket) => {
      const qty = quantities[ticket.id] || 0
      return acc + qty * (ticket.price || 0)
    }, 0)
  }, [ticketTypes, quantities])

  const handleCheckout = async () => {
    setError('')
    setSuccess('')
    if (!user) {
      navigate('/login')
      return
    }
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }))
    if (!items.length) {
      setError('Selecione ao menos um ingresso.')
      return
    }
    try {
      await createOrder(items)
      setSuccess('Pedido criado com sucesso. Pagamento em modo mock.')
      setQuantities({})
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Falha ao criar pedido',
      )
    }
  }

  if (loading) {
    return <Typography color="text.secondary">Carregando evento...</Typography>
  }

  if (!event) {
    return <Typography color="text.secondary">Evento nao encontrado.</Typography>
  }

  return (
    <Stack spacing={3}>
      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ height: { xs: 220, md: 320 }, bgcolor: 'background.default' }}>
          {event.thumbDesktop ? (
            <Box
              component="img"
              src={resolveImage(event.thumbDesktop)}
              alt={event.name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null}
        </Box>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" fontWeight={700}>
              {event.name}
            </Typography>
            <Chip label="Disponivel" />
          </Stack>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarMonthRounded fontSize="small" color="disabled" />
              <Typography color="text.secondary">{formatEventDateRange(event)}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOnRounded fontSize="small" color="disabled" />
              <Typography color="text.secondary">{event.location}</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Sobre o evento
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {event.description ? (
                <Box
                  sx={{
                    '& img': { maxWidth: '100%', borderRadius: 2 },
                    '& p': { marginTop: 0 },
                  }}
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              ) : (
                <Typography color="text.secondary">Descricao ainda nao informada.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Selecione seus ingressos
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {ticketTypes.length ? (
                  ticketTypes.map((ticket) => {
                    const qty = quantities[ticket.id] || 0
                    return (
                      <Stack
                        key={ticket.id}
                        spacing={1}
                        sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 2 }}
                      >
                        <Stack direction="row" justifyContent="space-between">
                          <Typography fontWeight={600}>{ticket.name}</Typography>
                          <Typography fontWeight={600}>
                            R$ {(ticket.price / 100).toFixed(2)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [ticket.id]: Math.max(0, qty - 1),
                              }))
                            }
                          >
                            -
                          </Button>
                          <Box
                            sx={{
                              minWidth: 42,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 2,
                              bgcolor: 'background.default',
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            {qty}
                          </Box>
                          <Button
                            variant="outlined"
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [ticket.id]: qty + 1,
                              }))
                            }
                          >
                            +
                          </Button>
                        </Stack>
                      </Stack>
                    )
                  })
                ) : (
                  <Typography color="text.secondary">Nenhum ingresso disponivel.</Typography>
                )}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Typography fontWeight={600}>
                  Total de ingressos: {totalItems}
                </Typography>
                <Typography fontWeight={700}>
                  Total: R$ {(totalPrice / 100).toFixed(2)}
                </Typography>
                {error ? <Alert severity="error">{error}</Alert> : null}
                {success ? <Alert severity="success">{success}</Alert> : null}
                <Button variant="contained" onClick={handleCheckout} disabled={!ticketTypes.length}>
                  Finalizar compra (mock)
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default EventDetailsPage
