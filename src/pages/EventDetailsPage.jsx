import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Drawer,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import LocationOnRounded from '@mui/icons-material/LocationOnRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { fetchEvent, fetchTicketTypes } from '../services/events'
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

const YOUTUBE_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?(?:[^\s"'<>]*?&)?\s*v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})(?:[&?][^\s"'<>]*)?/gi
const YOUTUBE_TOKEN_REGEX = /\[\[YOUTUBE:([A-Za-z0-9_-]{6,})\]\]/g

function injectYouTubeTokens(html) {
  if (!html) return ''
  const normalized = html.replace(/&amp;/g, '&')
  return normalized.replace(YOUTUBE_URL_REGEX, (_match, id) => `[[YOUTUBE:${id}]]`)
}

function renderDescriptionWithEmbeds(html) {
  const withTokens = injectYouTubeTokens(html)
  if (!withTokens) return []
  const parts = withTokens.split(YOUTUBE_TOKEN_REGEX)
  const blocks = []
  for (let i = 0; i < parts.length; i += 1) {
    const value = parts[i]
    if (!value) continue
    if (i % 2 === 1) {
      blocks.push({ type: 'youtube', id: value })
    } else {
      blocks.push({ type: 'html', html: value })
    }
  }
  return blocks
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
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false)

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

  const minPrice = useMemo(() => {
    const prices = ticketTypes.map((ticket) => ticket.price || 0).filter((price) => price > 0)
    if (!prices.length) return null
    return Math.min(...prices)
  }, [ticketTypes])

  const formatPrice = (value) => `R$ ${(value / 100).toFixed(2)}`

  const descriptionBlocks = useMemo(
    () => renderDescriptionWithEmbeds(event?.description || ''),
    [event?.description],
  )

  const handleCheckout = () => {
    setError('')
    setSuccess('')
    const selected = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => {
        const ticketType = ticketTypes.find((ticket) => ticket.id === ticketTypeId)
        return {
          ticketTypeId,
          quantity,
          name: ticketType?.name || 'Ingresso',
          price: ticketType?.price || 0,
        }
      })
    if (!selected.length) {
      setError('Selecione ao menos um ingresso.')
      return
    }
    navigate('/checkout', {
      state: {
        event: {
          id: event.id,
          name: event.name,
        },
        items: selected,
      },
    })
  }

  if (loading) {
    return <Typography color="text.secondary">Carregando evento...</Typography>
  }

  if (!event) {
    return <Typography color="text.secondary">Evento nao encontrado.</Typography>
  }

  const ticketList = (
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
                  {formatPrice(ticket.price || 0)}
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
  )

  return (
    <Stack spacing={3} sx={{ pb: { xs: 10, md: 0 } }}>
      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ height: { xs: 220, md: "auto" }, bgcolor: 'background.default' }}>
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
                <Stack spacing={2}>
                  {descriptionBlocks.map((block, index) => {
                    if (block.type === 'youtube') {
                      return (
                        <Box
                          key={`${block.id}-${index}`}
                          sx={{
                            position: 'relative',
                            width: '100%',
                            paddingTop: '56.25%',
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: 'background.default',
                          }}
                        >
                          <Box
                            component="iframe"
                            src={`https://www.youtube.com/embed/${block.id}`}
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              border: 0,
                            }}
                          />
                        </Box>
                      )
                    }
                    return (
                      <Box
                        key={`html-${index}`}
                        sx={{
                          '& img': { maxWidth: '100%', borderRadius: 2 },
                          '& p': { marginTop: 0 },
                          '& a': { wordBreak: 'break-word' },
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                        }}
                        dangerouslySetInnerHTML={{ __html: block.html }}
                      />
                    )
                  })}
                </Stack>
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
              {ticketList}
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Typography fontWeight={600}>
                  Total de ingressos: {totalItems}
                </Typography>
                <Typography fontWeight={700}>
                  Total: {formatPrice(totalPrice)}
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

      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: { xs: 'flex', md: 'none' },
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 2,
          py: 1.5,
          zIndex: 1200,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Ingressos
            </Typography>
            <Typography fontWeight={700}>
              {minPrice != null ? `A partir de ${formatPrice(minPrice)}` : 'Ver ingressos'}
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => setTicketSheetOpen(true)} disabled={!ticketTypes.length}>
            Comprar
          </Button>
        </Stack>
      </Box>

      <Drawer
        anchor="bottom"
        open={ticketSheetOpen}
        onClose={() => setTicketSheetOpen(false)}
        PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, p: 2 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Ingressos
          </Typography>
          <IconButton onClick={() => setTicketSheetOpen(false)} aria-label="Fechar">
            <CloseRounded />
          </IconButton>
        </Box>
        {ticketList}
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1}>
          <Typography fontWeight={600}>
            Total de ingressos: {totalItems}
          </Typography>
          <Typography fontWeight={700}>
            Total: {formatPrice(totalPrice)}
          </Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}
          <Button variant="contained" onClick={handleCheckout} disabled={!ticketTypes.length}>
            Finalizar compra (mock)
          </Button>
        </Stack>
      </Drawer>
    </Stack>
  )
}

export default EventDetailsPage
