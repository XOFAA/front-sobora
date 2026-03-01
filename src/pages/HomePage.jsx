import { useEffect, useMemo, useState } from 'react'
import { Avatar, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { Card, CardContent, Chip } from '@mui/material'
import Grid from '@mui/material/Grid'
import SearchRounded from '@mui/icons-material/SearchRounded'
import ConfirmationNumberRounded from '@mui/icons-material/ConfirmationNumberRounded'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'
import EmojiEmotionsRounded from '@mui/icons-material/EmojiEmotionsRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import PlaceRounded from '@mui/icons-material/PlaceRounded'
import FormatListBulletedRounded from '@mui/icons-material/FormatListBulletedRounded'
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded'
import TheaterComedyRounded from '@mui/icons-material/TheaterComedyRounded'
import TravelExploreRounded from '@mui/icons-material/TravelExploreRounded'
import SchoolRounded from '@mui/icons-material/SchoolRounded'
import SportsSoccerRounded from '@mui/icons-material/SportsSoccerRounded'
import RecordVoiceOverRounded from '@mui/icons-material/RecordVoiceOverRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import { keyframes } from '@emotion/react'
import EventSlider from '../components/event/EventSlider'
import FaqSection from '../components/faq/FaqSection'
import { fetchEvents, fetchTicketTypes } from '../services/events'
import { useLocation, useNavigate } from 'react-router-dom'

const HOW_IT_WORKS = [
  {
    title: 'Encontre seu evento',
    description: 'Busque entre milhares de eventos culturais ou navegue pelas categorias.',
    icon: SearchRounded,
  },
  {
    title: 'Escolha seus ingressos',
    description: 'Selecione a quantidade e os tipos de ingressos desejados.',
    icon: ConfirmationNumberRounded,
  },
  {
    title: 'Pague com segurança',
    description: 'Finalize sua compra com pagamento seguro e instantâneo.',
    icon: CreditCardRounded,
  },
  {
    title: 'Curta o evento',
    description: 'Receba seus ingressos digitalmente e aproveite a experiência.',
    icon: EmojiEmotionsRounded,
  },
]

const movingGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`

const EVENT_CATEGORIES = [
  { key: 'ALL', label: 'Todos', icon: FormatListBulletedRounded },
  { key: 'SHOWS', label: 'Shows', icon: MusicNoteRounded },
  { key: 'TEATRO', label: 'Teatro', icon: TheaterComedyRounded },
  { key: 'TURISMO', label: 'Turismo', icon: TravelExploreRounded },
  { key: 'EDUCATIVO', label: 'Educativo', icon: SchoolRounded },
  { key: 'ESPORTES', label: 'Esportes', icon: SportsSoccerRounded },
  { key: 'PALESTRAS', label: 'Palestras', icon: RecordVoiceOverRounded },
  { key: 'CURSOS', label: 'Cursos', icon: MenuBookRounded },
]

const CATEGORY_MATCHERS = [
  { key: 'SHOWS', terms: ['show', 'shows', 'musica', 'música', 'musical', 'festival'] },
  { key: 'TEATRO', terms: ['teatro', 'peca', 'peça'] },
  { key: 'TURISMO', terms: ['turismo', 'viagem', 'tour', 'passeio'] },
  { key: 'EDUCATIVO', terms: ['educativo', 'educacao', 'educação', 'workshop', 'oficina'] },
  { key: 'ESPORTES', terms: ['esporte', 'esportes', 'corrida', 'maratona', 'futebol'] },
  { key: 'PALESTRAS', terms: ['palestra', 'palestras', 'conferencia', 'conferência', 'talk'] },
  { key: 'CURSOS', terms: ['curso', 'cursos', 'aula', 'treinamento'] },
]

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const resolveEventCategory = (event) => {
  const values = [
    event?.category,
    event?.categoryName,
    event?.type,
    event?.segment,
    event?.tag,
    ...(Array.isArray(event?.tags) ? event.tags : []),
  ]
    .map((value) => (typeof value === 'string' ? value : ''))
    .filter(Boolean)

  if (!values.length) return null

  const normalized = values.map(normalizeText).join(' ')
  const match = CATEGORY_MATCHERS.find((item) =>
    item.terms.some((term) => normalized.includes(normalizeText(term))),
  )
  return match ? match.key : null
}

const getEventMinPriceLabel = (event, minPriceFromTickets) => {
  const raw =
    minPriceFromTickets ??
    event?.minPrice ??
    event?.startingPrice ??
    event?.startPrice ??
    event?.price ??
    event?.minimumPrice ??
    null

  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    const formatted = (raw / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    return `R$ ${formatted.replace('R$\u00A0', '')}`
  }
  return '--'
}

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002'

const resolveImage = (value) => {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('/')) return `${apiBaseUrl}${value}`
  return `${apiBaseUrl}/${value}`
}

const getEventImageRaw = (event) =>
  event?.thumbMobile ||
  event?.thumb ||
  event?.thumbDesktop ||
  event?.image ||
  event?.banner ||
  event?.cover ||
  ''

const getTenantLogoRaw = (event) =>
  event?.tenant?.logoUrl ||
  event?.tenantLogo ||
  event?.organizerLogo ||
  ''

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

function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [eventsCategory, setEventsCategory] = useState('ALL')
  const [ticketMetaByEventId, setTicketMetaByEventId] = useState({})

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.replace('#', '')
    if (!id) return
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [eventsData, ticketTypesData] = await Promise.all([
          fetchEvents(),
          fetchTicketTypes(),
        ])
        if (!active) return
        setEvents(eventsData || [])

        const map = (ticketTypesData || []).reduce((acc, ticket) => {
          const eventId = ticket?.eventId
          const price = typeof ticket?.price === 'number' ? ticket.price : null
          if (!eventId || price == null) return acc

          const current = acc[eventId] || {
            minPaidPrice: null,
            hasPaid: false,
            hasFree: false,
            freeLimitPerUser: null,
          }

          if (price > 0) {
            current.hasPaid = true
            current.minPaidPrice =
              current.minPaidPrice == null ? price : Math.min(current.minPaidPrice, price)
          } else {
            current.hasFree = true
            const freeLimit = Number.isInteger(ticket?.maxFreePerUser) && ticket.maxFreePerUser > 0
              ? ticket.maxFreePerUser
              : null
            if (freeLimit != null) {
              current.freeLimitPerUser =
                current.freeLimitPerUser == null
                  ? freeLimit
                  : Math.min(current.freeLimitPerUser, freeLimit)
            }
          }

          acc[eventId] = current
          return acc
        }, {})
        setTicketMetaByEventId(map)
      } catch {
        if (active) setEvents([])
        if (active) setTicketMetaByEventId({})
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return events
    return events.filter((event) =>
      [event.name, event.location].some((value) =>
        String(value || '').toLowerCase().includes(term),
      ),
    )
  }, [events, search])

  const filteredEvents = useMemo(() => {
    if (eventsCategory === 'ALL') return events
    return events.filter((event) => resolveEventCategory(event) === eventsCategory)
  }, [events, eventsCategory])

  return (
    <Stack spacing={0}>
      <Box sx={{ textAlign: 'center', pb: { xs: 3.5, md: 4.5 } }}>
        <Typography variant="h4" fontWeight={700}>
          Descubra experiências{' '}
          <Box component="span" sx={{ color: '#6d4ce7' }}>
            incríveis
          </Box>
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.7 }}>
          Shows, espetáculos teatrais, eventos educativos e muito mais. Compre ingressos com
          segurança e facilidade.
        </Typography>

        <Box sx={{ maxWidth: 520, mx: 'auto', mt: 2.2 }}>
          <TextField
            fullWidth
            placeholder="Buscar eventos, cidades ou temas..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          pt: { xs: 2.5, md: 3 },
          pb: { xs: 4, md: 5 },
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            left: '50%',
            width: '100dvw',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)',
            backgroundSize: '260% 260%',
            animation: `${movingGradient} 9s ease-in-out infinite`,
            zIndex: 0,
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {loading ? (
            <Typography color="rgba(255,255,255,0.9)">Carregando eventos...</Typography>
          ) : (
            <EventSlider events={filtered} lightMode />
          )}
        </Box>
      </Box>

      <Box id="eventos" sx={{ pt: { xs: 4, md: 5 }, scrollMarginTop: { xs: 90, md: 110 } }}>
        <Stack spacing={0.6} sx={{ textAlign: 'center', mb: { xs: 2.5, md: 3 } }}>
          <Typography variant="h5" fontWeight={700}>
            Mais eventos
          </Typography>
          <Typography color="text.secondary">
            Descubra os melhores eventos culturais e outros formatos que estão por vir.
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            flexWrap: 'wrap',
            justifyContent: 'center',
            rowGap: 1,
            mb: { xs: 2.5, md: 3 },
          }}
        >
        {EVENT_CATEGORIES.map((category) => {
          const Icon = category.icon
          return (
            <Chip
              key={category.key}
              label={category.label}
              clickable
              color="default"
              variant="filled"
              onClick={() => setEventsCategory(category.key)}
              icon={<Icon sx={{ fontSize: 18 }} />}
              sx={{
                fontWeight: 600,
                px: 0.5,
                borderRadius: '10px',
                bgcolor: eventsCategory === category.key ? '#5f45da' : '#fff',
                color: eventsCategory === category.key ? '#fff' : '#5f45da',
                border: eventsCategory === category.key ? '1px solid #5f45da' : '1px solid #e5e7eb',
                boxShadow: eventsCategory === category.key ? '0 10px 18px rgba(109, 76, 231, 0.28)' : 'none',
                '& .MuiChip-icon': {
                  color: eventsCategory === category.key ? '#fff' : '#5f45da',
                },
              }}
            />
          )
        })}
        </Stack>

        {loading ? (
          <Typography color="text.secondary" align="center">
            Carregando eventos...
          </Typography>
        ) : filteredEvents.length ? (
          <Grid container spacing={2}>
            {filteredEvents.slice(0, 6).map((event) => {
              const imageRaw = getEventImageRaw(event)
              const image = imageRaw ? resolveImage(imageRaw) : ''
              const tenantLogoRaw = getTenantLogoRaw(event)
              const tenantLogo = tenantLogoRaw ? resolveImage(tenantLogoRaw) : ''
              const tenantName = event?.tenant?.tradeName || event?.tenant?.name || 'Organizador'
              const categoryKey = resolveEventCategory(event)
              const categoryLabel =
                EVENT_CATEGORIES.find((item) => item.key === categoryKey)?.label || 'Evento'
              const ticketMeta = ticketMetaByEventId[event.id] || {}
              const isFreeOnly = Boolean(ticketMeta.hasFree) && !Boolean(ticketMeta.hasPaid)
              const minPrice = ticketMeta.minPaidPrice
              const freeLimit = ticketMeta.freeLimitPerUser
              const priceLabel = isFreeOnly
                ? 'Gratuito'
                : getEventMinPriceLabel(event, minPrice)
              const priceCaption = isFreeOnly ? 'Ingresso' : 'Ingressos a partir de'
              const freeLimitLabel =
                isFreeOnly && freeLimit
                  ? `Resgate de ate ${freeLimit} por usuario`
                  : null

              return (
                <Grid key={event.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '14px',
                      border: '1px solid',
                      borderColor: 'rgba(15, 23, 42, 0.12)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: '#fff',
                      boxShadow: '0 14px 26px rgba(15, 23, 42, 0.08)',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        height: 180,
                        bgcolor: 'grey.100',
                        background: image
                          ? 'transparent'
                          : 'linear-gradient(135deg, #dbeafe 0%, #e2e8f0 100%)',
                      }}
                    >
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
                          label={categoryLabel}
                          size="small"
                          sx={{
                            alignSelf: 'flex-start',
                            bgcolor: 'rgba(109, 40, 217, 0.12)',
                            color: '#6d4ce7',
                            fontWeight: 700,
                          }}
                        />
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar src={tenantLogo || undefined} sx={{ width: 26, height: 26, bgcolor: '#ede9fe', color: '#6d4ce7', fontSize: '0.75rem' }}>
                            {String(tenantName).slice(0, 1).toUpperCase()}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {tenantName}
                          </Typography>
                        </Stack>
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
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <ConfirmationNumberRounded fontSize="small" sx={{ color: '#9ca3af' }} />
                            <Stack spacing={0} alignItems="flex-start">
                              <Typography variant="caption" color="text.secondary">
                                {priceCaption}
                              </Typography>
                              <Typography fontWeight={700} sx={{ color: '#6d4ce7' }}>
                                {priceLabel}
                              </Typography>
                              {freeLimitLabel ? (
                                <Typography variant="caption" color="text.secondary">
                                  {freeLimitLabel}
                                </Typography>
                              ) : null}
                            </Stack>
                          </Stack>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate(`/events/${event.id}`)}
                            startIcon={<AddRounded sx={{ fontSize: 16 }} />}
                            sx={{
                              borderRadius: '10px',
                              px: 2,
                              bgcolor: '#6d4ce7',
                              '&:hover': { bgcolor: '#5a3fd6' },
                            }}
                          >
                            {isFreeOnly ? 'Resgatar' : 'Comprar'}
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
            Nenhum evento encontrado nesta categoria.
          </Typography>
        )}
      </Box>

      <Box id="como-funciona" sx={{ pt: { xs: 4, md: 5 }, scrollMarginTop: { xs: 90, md: 110 } }}>
        <Stack spacing={1} sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
          <Typography variant="h5" fontWeight={700}>
            Como funciona?
          </Typography>
          <Typography color="text.secondary">
            É muito fácil comprar e transferir ingressos na Sobora!
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon
            return (
              <Box
                key={item.title}
                sx={{
                  px: 2.5,
                  py: 3,
                  borderRadius: "10px",
                  color: '#fff',
                  background: 'linear-gradient(160deg, #6b4cd6 0%, #5640b3 100%)',
                  boxShadow: '0 14px 30px rgba(67, 56, 103, 0.25)',
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.8)',
                    display: 'grid',
                    placeItems: 'center',
                    mx: 'auto',
                    mb: 1.5,
                  }}
                >
                  <Icon sx={{ fontSize: 22 }} />
                </Box>
                <Typography fontWeight={700} sx={{ mb: 0.8 }}>
                  {item.title}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
                  {item.description}
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Box>

      <Box sx={{ pt: { xs: 4, md: 5 } }}>
        <FaqSection />
      </Box>
      <Box
        id="criar-evento"
        sx={{ pt: { xs: 4, md: 5 }, pb: { xs: 1, md: 2 }, textAlign: 'center', scrollMarginTop: { xs: 90, md: 110 } }}
      >
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>
            Organiza eventos?
          </Typography>
          <Typography color="text.secondary">
            Venda seus ingressos na Sobora e alcance milhares de pessoas interessadas em cultura.
            Oferecemos uma plataforma completa para gerenciar vendas, comissões competitivas e suporte especializado.
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          sx={{
            borderRadius: "10px",
            px: 3,
            py: 1,
            mb:3,
            background: 'linear-gradient(135deg, #6b4cd6 0%, #5640b3 100%)',
          }}
        >
          Criar meu evento
        </Button>
      </Box>
    </Stack>
  )
}

export default HomePage
