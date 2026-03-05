import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
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
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import PlaceRounded from '@mui/icons-material/PlaceRounded'
import ConfirmationNumberRounded from '@mui/icons-material/ConfirmationNumberRounded'
import LanguageRounded from '@mui/icons-material/LanguageRounded'
import Instagram from '@mui/icons-material/Instagram'
import FacebookRounded from '@mui/icons-material/FacebookRounded'
import LinkedIn from '@mui/icons-material/LinkedIn'
import YouTube from '@mui/icons-material/YouTube'
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded'
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded'
import { fetchOrganizer } from '../services/organizers'
import SecurityInfoSection from '../components/common/SecurityInfoSection'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002'

const resolveImage = (value) => {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('/')) return `${apiBaseUrl}${value}`
  return `${apiBaseUrl}/${value}`
}

const getEventDates = (event) => {
  if (Array.isArray(event?.dates) && event.dates.length) return event.dates
  if (event?.date) return [event.date]
  return []
}

const formatEventDateRange = (event) => {
  const dates = getEventDates(event)
  if (!dates.length) return 'Sem data'
  if (dates.length === 1) return new Date(dates[0]).toLocaleString('pt-BR')
  const first = new Date(dates[0])
  const last = new Date(dates[dates.length - 1])
  return `De ${first.toLocaleString('pt-BR')} a ${last.toLocaleString('pt-BR')}`
}

const getEventImageRaw = (event) =>
  event?.thumbMobile ||
  event?.thumb ||
  event?.thumbDesktop ||
  event?.image ||
  event?.banner ||
  event?.cover ||
  ''

const formatPrice = (value) => ((value ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const getEventMinPriceLabel = (event) => {
  const prices = (event?.ticketTypes || [])
    .map((ticket) => (typeof ticket?.price === 'number' ? ticket.price : null))
    .filter((value) => value != null && value >= 0)
  if (!prices.length) return '--'
  const paid = prices.filter((value) => value > 0)
  if (!paid.length) return 'Gratuito'
  return formatPrice(Math.min(...paid))
}

function OrganizerPage() {
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [organizer, setOrganizer] = useState(null)
  const [events, setEvents] = useState([])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchOrganizer(tenantId)
        if (!active) return
        setOrganizer(data?.organizer || null)
        setEvents(Array.isArray(data?.events) ? data.events : [])
      } catch (err) {
        if (!active) return
        setError(err?.response?.data?.message || 'Não foi possível carregar o organizador.')
      } finally {
        if (active) setLoading(false)
      }
    }
    if (tenantId) load()
    return () => {
      active = false
    }
  }, [tenantId])

  const stats = useMemo(() => {
    const totalEvents = events.length
    const totalTickets = events.reduce(
      (acc, event) => acc + (event?.ticketTypes || []).reduce((sum, ticket) => sum + (ticket?.quantity || 0), 0),
      0,
    )
    return { totalEvents, totalTickets }
  }, [events])

  const socialLinks = useMemo(() => {
    if (!organizer) return []
    return [
      { key: 'website', label: 'Site', value: organizer.websiteUrl, icon: <LanguageRounded fontSize="small" /> },
      { key: 'instagram', label: 'Instagram', value: organizer.instagramUrl, icon: <Instagram fontSize="small" /> },
      { key: 'facebook', label: 'Facebook', value: organizer.facebookUrl, icon: <FacebookRounded fontSize="small" /> },
      { key: 'linkedin', label: 'LinkedIn', value: organizer.linkedinUrl, icon: <LinkedIn fontSize="small" /> },
      { key: 'x', label: 'X', value: organizer.xUrl },
      { key: 'youtube', label: 'YouTube', value: organizer.youtubeUrl, icon: <YouTube fontSize="small" /> },
    ].filter((item) => Boolean(item.value))
  }, [organizer])

  if (loading) {
    return <Typography color="text.secondary">Carregando organizador...</Typography>
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!organizer) {
    return <Typography color="text.secondary">Organizador não encontrado.</Typography>
  }

  const organizerName = organizer.tradeName || organizer.name || 'Organizador'
  const organizerLogo = organizer.logoUrl ? resolveImage(organizer.logoUrl) : ''
  const organizerContactEmail = organizer.contactEmail || ''

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Home
        </Typography>
        <Typography variant="body2" color="text.disabled">/</Typography>
        <Typography variant="body2" color="text.secondary">Organizadores</Typography>
        <Typography variant="body2" color="text.disabled">/</Typography>
        <Typography variant="body2" fontWeight={600}>{organizerName}</Typography>
      </Stack>

      <Card sx={{ borderRadius: '10px' }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar src={organizerLogo || undefined} sx={{ width: 44, height: 44, borderRadius: '8px', bgcolor: '#ede9fe', color: '#6E51C5' }}>
                {String(organizerName).slice(0, 1).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{organizerName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {organizer.description || 'Sem descrição informada.'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Typography variant="body2" color="text.secondary">
                {stats.totalEvents} eventos realizados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.totalTickets} ingressos gerados
              </Typography>
            </Stack>

            {socialLinks.length ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<MailOutlineRounded fontSize="small" />}
                  component={organizerContactEmail ? 'a' : 'button'}
                  href={organizerContactEmail ? `mailto:${organizerContactEmail}` : undefined}
                  disabled={!organizerContactEmail}
                  sx={{ borderRadius: '10px' }}
                >
                  Entrar em contato
                </Button>
                {socialLinks.map((social) => (
                  <Button
                    key={social.key}
                    variant="outlined"
                    size="small"
                    startIcon={social.icon}
                    endIcon={<OpenInNewRounded sx={{ fontSize: 16 }} />}
                    component="a"
                    href={social.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ borderRadius: '10px' }}
                  >
                    {social.label}
                  </Button>
                ))}
              </Stack>
            ) : null}
            {!socialLinks.length ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<MailOutlineRounded fontSize="small" />}
                component={organizerContactEmail ? 'a' : 'button'}
                href={organizerContactEmail ? `mailto:${organizerContactEmail}` : undefined}
                disabled={!organizerContactEmail}
                sx={{ borderRadius: '10px', alignSelf: 'flex-start' }}
              >
                Entrar em contato
              </Button>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1} sx={{ textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700}>Meus eventos</Typography>
      </Stack>

      {events.length ? (
        <Grid container spacing={2}>
          {events.map((event) => {
            const imageRaw = getEventImageRaw(event)
            const image = imageRaw ? resolveImage(imageRaw) : ''
            const minPriceLabel = getEventMinPriceLabel(event)

            return (
              <Grid key={event.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: '100%', borderRadius: '10px', border: '1px solid', borderColor: 'rgba(15, 23, 42, 0.12)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ position: 'relative', height: 180, bgcolor: 'grey.100' }}>
                    {image ? (
                      <Box
                        component="img"
                        src={image}
                        alt={event.name || 'Evento'}
                        loading="lazy"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : null}
                  </Box>
                  <CardContent sx={{ flex: 1 }}>
                    <Stack spacing={1}>
                      <Chip
                        label="Evento"
                        size="small"
                        sx={{
                          alignSelf: 'flex-start',
                          borderRadius: '10px',
                          bgcolor: 'rgba(109, 40, 217, 0.12)',
                          color: '#6E51C5',
                          fontWeight: 700,
                        }}
                      />
                      <Typography fontWeight={700} sx={{ lineHeight: 1.25 }}>
                        {event.name || 'Evento'}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarMonthRounded fontSize="small" color="disabled" />
                        <Typography variant="body2" color="text.secondary">
                          {formatEventDateRange(event)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PlaceRounded fontSize="small" color="disabled" />
                        <Typography variant="body2" color="text.secondary">
                          {event.location || 'Local a definir'}
                        </Typography>
                      </Stack>
                      <Divider />
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <ConfirmationNumberRounded fontSize="small" sx={{ color: '#9ca3af' }} />
                          <Stack spacing={0}>
                            <Typography variant="caption" color="text.secondary">
                              Ingressos a partir de
                            </Typography>
                            <Typography fontWeight={700} sx={{ color: '#6E51C5' }}>
                              {minPriceLabel}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => navigate(`/events/${event.id}`)}
                          sx={{ borderRadius: '10px', px: 2, bgcolor: '#6d4ce7', '&:hover': { bgcolor: '#5a3fd6' } }}
                        >
                          Ver evento
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      ) : (
        <Typography color="text.secondary" align="center">
          Este organizador ainda não possui eventos publicados.
        </Typography>
      )}

      <SecurityInfoSection />
    </Stack>
  )
}

export default OrganizerPage


