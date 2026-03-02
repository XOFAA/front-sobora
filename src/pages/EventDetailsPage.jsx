import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
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
import MapRounded from '@mui/icons-material/MapRounded'
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded'
import ShareRounded from '@mui/icons-material/ShareRounded'
import DirectionsRounded from '@mui/icons-material/DirectionsRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded'
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { fetchEvent, fetchTicketTypes } from '../services/events'
import { createOrder } from '../services/orders'
import { useAuth } from '../contexts/AuthContext'
import SecurityInfoSection from '../components/common/SecurityInfoSection'

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

function isFixedHalfTicketType(ticket) {
  const name = String(ticket?.name || '').toLowerCase()
  const type = String(ticket?.type || '').toLowerCase()
  const category = String(ticket?.category || '').toLowerCase()
  const kind = String(ticket?.kind || '').toLowerCase()
  const code = String(ticket?.code || '').toLowerCase()

  return (
    Boolean(ticket?.isHalfPrice) ||
    Boolean(ticket?.isHalf) ||
    Boolean(ticket?.halfPriceOnly) ||
    type === 'half' ||
    category === 'half' ||
    kind === 'half' ||
    code === 'half' ||
    /meia[\s-]?entrada/.test(name)
  )
}

function EventDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [ticketTypes, setTicketTypes] = useState([])
  const [quantities, setQuantities] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const restoredSelectionRef = useRef(false)

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
        const fromEvent = Array.isArray(eventData?.ticketTypes)
          ? eventData.ticketTypes.filter((ticket) => ticket?.eventId === id)
          : []
        const fromTicketEndpoint = (ticketData || []).filter((ticket) => ticket?.eventId === id)
        const mergedById = new Map()
        ;[...fromTicketEndpoint, ...fromEvent].forEach((ticket) => {
          if (!ticket?.id) return
          const previous = mergedById.get(ticket.id) || {}
          mergedById.set(ticket.id, { ...previous, ...ticket })
        })
        const activeTickets = Array.from(mergedById.values()).filter((ticket) => ticket.isActive !== false)
        setTicketTypes(activeTickets)
      } catch (err) {
        if (active) setError('NÃ£o foi possÃ­vel carregar o evento.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id])
  useEffect(() => {
    if (restoredSelectionRef.current) return
    const prefill = location.state?.prefillTicketQuantities
    if (!prefill || typeof prefill !== 'object') return

    const next = Object.entries(prefill).reduce((acc, [ticketTypeId, qty]) => {
      const parsedQty = Number(qty)
      if (Number.isInteger(parsedQty) && parsedQty > 0) {
        acc[ticketTypeId] = parsedQty
      }
      return acc
    }, {})

    if (Object.keys(next).length) {
      setQuantities(next)
      setSuccess('Seus ingressos selecionados foram restaurados.')
    }

    restoredSelectionRef.current = true
    const { prefillTicketQuantities, ...rest } = location.state || {}
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: Object.keys(rest).length ? rest : null,
    })
  }, [location.hash, location.pathname, location.search, location.state, navigate])

  const totalItems = useMemo(
    () => Object.values(quantities).reduce((acc, value) => acc + value, 0),
    [quantities],
  )

  const totalPrice = useMemo(() => {
    return ticketTypes.reduce((acc, ticket) => {
      const qty = quantities[ticket.id] || 0
      const unitPrice = ticket.price || 0
      return acc + qty * unitPrice
    }, 0)
  }, [ticketTypes, quantities])

  const isFreeOnlyEvent = useMemo(
    () => ticketTypes.length > 0 && ticketTypes.every((ticket) => (ticket.price || 0) === 0),
    [ticketTypes],
  )

  const getMaxSelectableByTicket = (ticket) => {
    const stockLimit = Number.isInteger(ticket?.quantity) ? Math.max(ticket.quantity, 0) : Number.POSITIVE_INFINITY
    const isLimitedFree =
      (ticket?.price || 0) === 0 &&
      Number.isInteger(ticket?.maxFreePerUser) &&
      (ticket?.maxFreePerUser || 0) > 0
    const freeLimit = isLimitedFree ? ticket.maxFreePerUser : Number.POSITIVE_INFINITY
    return Math.min(stockLimit, freeLimit)
  }

  const minPrice = useMemo(() => {
    const prices = ticketTypes.map((ticket) => ticket.price || 0).filter((price) => price > 0)
    if (!prices.length) return null
    return Math.min(...prices)
  }, [ticketTypes])
  const orderedTicketTypes = useMemo(() => {
    if (!ticketTypes.length) return []
    const childrenByParent = new Map()
    const orphanHalfTickets = []
    const baseTickets = []
    const byId = new Map(ticketTypes.map((ticket) => [ticket.id, ticket]))

    ticketTypes.forEach((ticket) => {
      const isHalf = isFixedHalfTicketType(ticket)
      const parentId = ticket?.parentTicketTypeId || null
      if (isHalf && parentId) {
        if (byId.has(parentId)) {
          const current = childrenByParent.get(parentId) || []
          current.push(ticket)
          childrenByParent.set(parentId, current)
        } else {
          orphanHalfTickets.push(ticket)
        }
        return
      }
      baseTickets.push(ticket)
    })

    const ordered = []
    baseTickets.forEach((base) => {
      ordered.push(base)
      const children = childrenByParent.get(base.id) || []
      children.forEach((child) => ordered.push(child))
    })
    orphanHalfTickets.forEach((ticket) => ordered.push(ticket))
    return ordered
  }, [ticketTypes])

  const formatPrice = (value) =>
    ((value ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const formatTicketPrice = (value) => ((value ?? 0) === 0 ? 'Gratuito' : formatPrice(value))

  const getEventDateLabel = (value) => {
    if (!value) return 'Data a definir'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'Data a definir' : date.toLocaleString('pt-BR')
  }

  const getEventDateRange = (value) => {
    const values = Array.isArray(value?.dates) && value.dates.length ? value.dates : value?.date ? [value.date] : []
    if (!values.length) return []
    const parsed = values.map((item) => new Date(item)).filter((item) => !Number.isNaN(item.getTime()))
    if (!parsed.length) return []
    return [parsed[0], parsed[parsed.length - 1]]
  }

  const toGoogleCalendarDate = (date) => {
    const pad = (n) => String(n).padStart(2, '0')
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  }

  const descriptionBlocks = useMemo(
    () => renderDescriptionWithEmbeds(event?.description || ''),
    [event?.description],
  )

  const handleCheckout = () => {
    setError('')
    setSuccess('')
    if (isEventPast) {
      setError('Este evento ja encerrou e nao aceita novas compras ou resgates.')
      return
    }
    const selected = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => {
        const ticketType = ticketTypes.find((ticket) => ticket.id === ticketTypeId)
        const isHalf = isFixedHalfTicketType(ticketType)
        const unitPrice = ticketType?.price || 0
        return {
          ticketTypeId,
          quantity,
          name: ticketType?.name || 'Ingresso',
          price: unitPrice,
          isHalf,
        }
      })
    if (!selected.length) {
      setError('Selecione ao menos um ingresso.')
      return
    }
    const isFreeOnlySelection = selected.every((item) => (item.price || 0) === 0)
    const selectedQuantities = selected.reduce((acc, item) => {
      acc[item.ticketTypeId] = item.quantity
      return acc
    }, {})
    if (!user && isFreeOnlySelection) {
      navigate('/login', {
        state: {
          from: {
            pathname: location.pathname,
            state: {
              prefillTicketQuantities: selectedQuantities,
            },
          },
        },
      })
      return
    }
    if (isFreeOnlySelection) {
      setRedeemLoading(true)
      createOrder(
        selected.map((item) => ({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          isHalf: item.isHalf,
        })),
      )
        .then(() => {
          setRedeemOpen(true)
          setQuantities({})
        })
        .catch((err) => {
          setError(err?.response?.data?.message || 'Falha ao resgatar ingresso gratuito.')
        })
        .finally(() => {
          setRedeemLoading(false)
        })
      return
    }
    navigate('/checkout', {
      state: {
        event: {
          id: event.id,
          name: event.name,
          dateRange: formatEventDateRange(event),
          location: event.location,
          statusLabel: isEventPast ? 'Encerrado' : 'DisponÃ­vel',
          organizer: {
            name: organizerName,
            email: organizerContactEmail || '',
            tenantId: organizerTenantId || '',
          },
        },
        items: selected,
      },
    })
  }

  const handleShare = async () => {
    const url = window.location.href
    const title = event?.name || 'Evento'
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      // ignore
    }
  }

  const handleDirections = () => {
    const query = event?.location || ''
    const lat = event?.latitude
    const lng = event?.longitude
    const mapsUrl =
      typeof lat === 'number' && typeof lng === 'number'
        ? `https://www.google.com/maps?q=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    window.open(mapsUrl, '_blank')
  }

  const handleAddToCalendar = () => {
    const [start, end] = getEventDateRange(event)
    const startDate = start || (event?.date ? new Date(event.date) : null)
    const endDate = end || startDate
    if (!startDate || !endDate) return

    const details = event?.description ? event.description.replace(/<[^>]*>/g, '') : ''
    const location = event?.location || ''
    const calendarUrl =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(event?.name || 'Evento')}` +
      `&dates=${toGoogleCalendarDate(startDate)}/${toGoogleCalendarDate(endDate)}` +
      `&details=${encodeURIComponent(details)}` +
      `&location=${encodeURIComponent(location)}`

    window.open(calendarUrl, '_blank')
  }

  const isEventPast = (() => {
    const [start, end] = getEventDateRange(event)
    const lastDate = end || start || (event?.date ? new Date(event.date) : null)
    if (!lastDate) return false
    return lastDate.getTime() < Date.now()
  })()

  if (loading) {
    return <Typography color="text.secondary">Carregando evento...</Typography>
  }

  if (!event) {
    return <Typography color="text.secondary">Evento nÃ£o encontrado.</Typography>
  }

  const organizerName = event?.tenant?.tradeName || event?.tenant?.name || 'Organizador'
  const organizerLogoRaw = event?.tenant?.logoUrl || ''
  const organizerLogo = organizerLogoRaw ? resolveImage(organizerLogoRaw) : ''
  const organizerTenantId = event?.tenant?.id || event?.tenantId || ''
  const organizerDescription = event?.tenant?.description || 'Conheca mais sobre este organizador.'
  const organizerContactEmail = event?.tenant?.contactEmail || ''

  const ticketList = (
    <Stack spacing={2}>
      {isEventPast ? (
        <Alert severity="warning">Evento encerrado. Nao ha mais selecao de ingressos.</Alert>
      ) : ticketTypes.length ? (
        orderedTicketTypes.map((ticket) => {
          const qty = quantities[ticket.id] || 0
          const maxSelectable = getMaxSelectableByTicket(ticket)
          const hasReachedLimit = qty >= maxSelectable
          const isFixedHalfTicket = isFixedHalfTicketType(ticket)
          const unitPrice = ticket.price || 0
          return (
            <Stack
              key={ticket.id}
              spacing={1}
              sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 2 }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={700}>{ticket.name}</Typography>
                  {ticket.description ? (
                    <Typography variant="body2" color="text.secondary">
                      {ticket.description}
                    </Typography>
                  ) : null}
                </Box>
                <Typography fontWeight={700} sx={{ color: '#6d4ce7' }}>
                  {formatTicketPrice(unitPrice)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarMonthRounded fontSize="small" color="disabled" />
                <Typography variant="body2" color="text.secondary">
                  {getEventDateLabel(event?.date)}
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
                  disabled={hasReachedLimit}
                  onClick={() =>
                    setQuantities((prev) => ({
                      ...prev,
                      [ticket.id]: Math.min(maxSelectable, qty + 1),
                    }))
                  }
                >
                  +
                </Button>
              </Stack>
              {(ticket.price || 0) === 0 && Number.isInteger(ticket.maxFreePerUser) && ticket.maxFreePerUser > 0 ? (
                <Typography variant="caption" color="text.secondary">
                  Limite por usuario: {ticket.maxFreePerUser}
                </Typography>
              ) : null}
              {isFixedHalfTicket ? (
                <Box>
                  {qty > 0 ? (
                    <Box
                      sx={{
                        mt: 1,
                        px: 1.5,
                        py: 1,
                        borderRadius: 1.5,
                        bgcolor: '#fff7ed',
                        border: '1px solid #fdba74',
                        color: '#9a3412',
                        fontSize: '0.82rem',
                      }}
                    >
                      <Typography fontWeight={700} sx={{ mb: 0.5, color: '#ea580c' }}>
                        Documentos aceitos para meia-entrada:
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        <li>Carteira de estudante (com validade)</li>
                        <li>Carteirinha do id jovem</li>
                        <li>Documento que comprove 60+ anos</li>
                        <li>Laudo mÃ©dico (PCD)</li>
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        *ApresentaÃ§Ã£o obrigatÃ³ria na entrada
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Meia-entrada nÃ£o disponÃ­vel
                </Typography>
              )}
            </Stack>
          )
        })
      ) : (
        <Typography color="text.secondary">Nenhum ingresso disponÃ­vel.</Typography>
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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 0 }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="h4" fontWeight={700} sx={{ width: '100%' }}>
              {event.name}
            </Typography>
            <Chip
              label={isEventPast ? 'Encerrado' : 'Disponivel'}
              sx={{
                borderRadius: '10px',
                bgcolor: isEventPast ? '#FEE2E2' : '#DCFCE7',
                color: isEventPast ? '#B91C1C' : '#16A34A',
                border: `1px solid ${isEventPast ? '#FCA5A5' : '#86EFAC'}`,
                fontWeight: 700,
                alignSelf: { xs: 'flex-start', sm: 'center' },
              }}
            />
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mt: 1.2, width: 'fit-content', cursor: organizerTenantId ? 'pointer' : 'default' }}
            onClick={() => organizerTenantId && navigate(`/organizers/${organizerTenantId}`)}
          >
            <Avatar
              src={organizerLogo || undefined}
              sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: '#ede9fe', color: '#6d4ce7', fontSize: '0.8rem' }}
            >
              {String(organizerName).slice(0, 1).toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              Organizado por {organizerName}
            </Typography>
          </Stack>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <CalendarMonthRounded fontSize="small" color="disabled" />
              <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{formatEventDateRange(event)}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <LocationOnRounded fontSize="small" color="disabled" />
              <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{event.location}</Typography>
            </Stack>
          </Stack>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ mt: 2, flexWrap: 'wrap' }}
          >
            <Button
              variant="outlined"
              startIcon={<MapRounded />}
              onClick={() => setMapOpen(true)}
              sx={{
                borderRadius: '10px',
                borderColor: '#CBD5E1',
                color: '#475569',
                fontWeight: 600,
                px: 1.6,
                py: 0.9,
                '& .MuiButton-startIcon': { color: '#64748B' },
                '&:hover': { borderColor: '#94A3B8', backgroundColor: '#F8FAFC' },
              }}
            >
              Mapa do evento
            </Button>
            <Button
              variant="outlined"
              startIcon={<EventAvailableRounded />}
              onClick={handleAddToCalendar}
              sx={{
                borderRadius: '10px',
                borderColor: '#CBD5E1',
                color: '#475569',
                fontWeight: 600,
                px: 1.6,
                py: 0.9,
                '& .MuiButton-startIcon': { color: '#64748B' },
                '&:hover': { borderColor: '#94A3B8', backgroundColor: '#F8FAFC' },
              }}
            >
              Adicionar ao calendÃ¡rio
            </Button>
            <Button
              variant="outlined"
              startIcon={<DirectionsRounded />}
              onClick={handleDirections}
              sx={{
                borderRadius: '10px',
                borderColor: '#CBD5E1',
                color: '#475569',
                fontWeight: 600,
                px: 1.6,
                py: 0.9,
                '& .MuiButton-startIcon': { color: '#64748B' },
                '&:hover': { borderColor: '#94A3B8', backgroundColor: '#F8FAFC' },
              }}
            >
              Saiba como chegar
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareRounded />}
              onClick={handleShare}
              sx={{
                borderRadius: '10px',
                borderColor: '#CBD5E1',
                color: '#475569',
                fontWeight: 600,
                px: 1.6,
                py: 0.9,
                '& .MuiButton-startIcon': { color: '#64748B' },
                '&:hover': { borderColor: '#94A3B8', backgroundColor: '#F8FAFC' },
              }}
            >
              Compartilhar
            </Button>
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
                <Typography color="text.secondary">DescriÃ§Ã£o ainda nÃ£o informada.</Typography>
              )}
              <Divider sx={{ my: 2 }} />
              <Card
                variant="outlined"
                sx={{
                  borderRadius: '10px',
                  borderColor: '#d7dce5',
                  boxShadow: 'none',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack spacing={1.4}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={organizerLogo || undefined}
                        sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: '#ede9fe', color: '#6d4ce7' }}
                      >
                        {String(organizerName).slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} sx={{ lineHeight: 1.2 }}>
                          {organizerName}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {organizerDescription}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <Button
                        variant="outlined"
                        startIcon={<MailOutlineRounded />}
                        component={organizerContactEmail ? 'a' : 'button'}
                        href={organizerContactEmail ? `mailto:${organizerContactEmail}` : undefined}
                        disabled={!organizerContactEmail}
                        sx={{ borderRadius: '10px' }}
                      >
                        Entrar em contato
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<OpenInNewRounded />}
                        onClick={() => organizerTenantId && navigate(`/organizers/${organizerTenantId}`)}
                        disabled={!organizerTenantId}
                        sx={{ borderRadius: '10px' }}
                      >
                        Ver pÃ¡gina do organizador
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
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
              {isEventPast ? (
                <Alert severity="warning">Evento encerrado. Compras e resgates indisponiveis.</Alert>
              ) : (
                <Stack spacing={1}>
                  <Typography fontWeight={600}>
                    Total de ingressos: {totalItems}
                  </Typography>
                  <Typography fontWeight={700}>
                    Total: {isFreeOnlyEvent ? 'Gratuito' : formatPrice(totalPrice)}
                  </Typography>
                  {error ? <Alert severity="error">{error}</Alert> : null}
                  {success ? <Alert severity="success">{success}</Alert> : null}
                  <Button variant="contained" onClick={handleCheckout} disabled={!ticketTypes.length || redeemLoading}>
                    {redeemLoading
                      ? 'Resgatando...'
                      : isFreeOnlyEvent
                        ? 'Resgatar ingresso'
                        : 'Finalizar compra'}
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {!isFreeOnlyEvent ? <SecurityInfoSection /> : null}

      {!isEventPast ? (
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
                {isFreeOnlyEvent ? 'Gratuito' : (minPrice != null ? `A partir de ${formatPrice(minPrice)}` : 'Ver ingressos')}
              </Typography>
            </Box>
            <Button variant="contained" onClick={() => setTicketSheetOpen(true)} disabled={!ticketTypes.length}>
              {isFreeOnlyEvent ? 'Resgatar' : 'Comprar'}
            </Button>
          </Stack>
        </Box>
      ) : null}

      {!isEventPast ? (
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
              Total: {isFreeOnlyEvent ? 'Gratuito' : formatPrice(totalPrice)}
            </Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {success ? <Alert severity="success">{success}</Alert> : null}
            <Button variant="contained" onClick={handleCheckout} disabled={!ticketTypes.length || redeemLoading}>
              {redeemLoading
                ? 'Resgatando...'
                : isFreeOnlyEvent
                  ? 'Resgatar ingresso'
                  : 'Finalizar compra'}
            </Button>
          </Stack>
        </Drawer>
      ) : null}

      <Dialog open={mapOpen} onClose={() => setMapOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          Mapa do evento
          <IconButton
            onClick={() => setMapOpen(false)}
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {event?.mapImage ? (
            <Box
              component="img"
              src={resolveImage(event.mapImage)}
              alt={`Mapa do evento ${event.name || ''}`.trim()}
              sx={{
                width: '100%',
                maxHeight: 420,
                borderRadius: 2,
                bgcolor: '#f8fafc',
                border: '1px solid',
                borderColor: 'divider',
                objectFit: 'contain',
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: 260,
                borderRadius: 2,
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              Mapa do evento indisponÃ­vel
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={redeemOpen} onClose={() => setRedeemOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ py: 4 }}>
          <Stack spacing={2} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#DCFCE7',
                display: 'grid',
                placeItems: 'center',
                color: '#16A34A',
              }}
            >
              <CheckRounded fontSize="large" />
            </Box>
            <Stack spacing={0.5} alignItems="center">
              <Typography fontWeight={700} textAlign="center">
                Ingresso resgatado com sucesso
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Seus ingressos jÃ¡ estÃ£o disponÃ­veis para visualizaÃ§Ã£o.
              </Typography>
            </Stack>
            <Button
              variant="contained"
              onClick={() => navigate('/tickets', { replace: true })}
            >
              Ver meus ingressos
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  )
}

export default EventDetailsPage




