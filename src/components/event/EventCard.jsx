import { Box, Stack, Typography } from '@mui/material'
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

function EventCard({ event, lightMeta = false }) {
  const navigate = useNavigate()

  const image =
    event.thumbMobile ||
    event.thumb ||
    event.thumbDesktop ||
    event.image ||
    ''

  return (
    <Box
      sx={{
        cursor: 'pointer',
        width: '100%',
        maxWidth: '100%',
      }}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <Box
        sx={{
          height: { xs: 200, sm: 240, md: 460 },
          borderRadius: { xs: 2, md: 2 },
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {image ? (
          <Box
            component="img"
            src={resolveImage(image)}
            alt={event.name}
            loading="lazy"
            draggable={false}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : null}
      </Box>

      <Stack
        spacing={0.6}
        className="event-card-meta"
        sx={{
          mt: { xs: 1.25, md: 2 },
          alignItems: 'center',
          textAlign: 'center',
          px: { xs: 1, md: 0 },
        }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            color: lightMeta ? '#f5f0ff' : 'text.primary',
            fontSize: { xs: '1rem', sm: '1.05rem', md: '1.25rem' },
            lineHeight: 1.15,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {event.name}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <CalendarMonthRounded
            fontSize="small"
            sx={{ color: lightMeta ? 'rgba(255,255,255,0.72)' : 'text.disabled' }}
          />
          <Typography
            variant="body2"
            color={lightMeta ? 'rgba(255,255,255,0.9)' : 'text.secondary'}
            sx={{
              fontSize: { xs: '0.8rem', md: '0.875rem' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: { xs: 260, sm: 340, md: '100%' },
            }}
          >
            {formatEventDateRange(event)}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <LocationOnRounded
            fontSize="small"
            sx={{ color: lightMeta ? 'rgba(255,255,255,0.72)' : 'text.disabled' }}
          />
          <Typography
            variant="body2"
            color={lightMeta ? 'rgba(255,255,255,0.9)' : 'text.secondary'}
            sx={{
              fontSize: { xs: '0.8rem', md: '0.875rem' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: { xs: 260, sm: 340, md: '100%' },
            }}
          >
            {event.location || 'Local a definir'}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}

export default EventCard
