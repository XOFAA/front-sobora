import { Box, Chip, Stack, Typography } from '@mui/material'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import LocationOnRounded from '@mui/icons-material/LocationOnRounded'
import { useNavigate } from 'react-router-dom'

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

function getEventStatus(event) {
  const dates = Array.isArray(event?.dates) && event.dates.length ? event.dates : event?.date ? [event.date] : []
  if (!dates.length) return 'Proximo'
  const last = new Date(dates[dates.length - 1])
  return last < new Date() ? 'Encerrado' : 'Proximo'
}

function EventCard({ event }) {
  const navigate = useNavigate()
  const status = getEventStatus(event)

  return (
    <Box sx={{ cursor: 'pointer' }} onClick={() => navigate(`/events/${event.id}`)}>
      <Box
        sx={{
          height: { xs: 260, md: 360 },
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0px 20px 36px rgba(15, 23, 42, 0.18)',
          backgroundColor: 'background.default',
        }}
      >
        {event.thumbDesktop ? (
          <Box
            component="img"
            src={resolveImage(event.thumbDesktop)}
            alt={event.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
      </Box>
      <Stack spacing={0.6} sx={{ mt: 2, alignItems: 'center', textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={800}>
          {event.name}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <CalendarMonthRounded fontSize="small" color="disabled" />
          <Typography variant="body2" color="text.secondary">
            {formatEventDateRange(event)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <LocationOnRounded fontSize="small" color="disabled" />
          <Typography variant="body2" color="text.secondary">
            {event.location || 'Local a definir'}
          </Typography>
        </Stack>
        <Chip
          label={status}
          color={status === 'Encerrado' ? 'default' : 'primary'}
          sx={{ mt: 1 }}
        />
      </Stack>
    </Box>
  )
}

export default EventCard
