import { useEffect, useMemo, useState } from 'react'
import { Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import SearchRounded from '@mui/icons-material/SearchRounded'
import ConfirmationNumberRounded from '@mui/icons-material/ConfirmationNumberRounded'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'
import EmojiEmotionsRounded from '@mui/icons-material/EmojiEmotionsRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import { keyframes } from '@emotion/react'
import EventSlider from '../components/event/EventSlider'
import FaqSection from '../components/faq/FaqSection'
import { fetchEvents } from '../services/events'

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

function HomePage() {
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const data = await fetchEvents()
        if (active) setEvents(data || [])
      } catch {
        if (active) setEvents([])
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
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    variant="contained"
                    sx={{ borderRadius: 999, px: 1.5, py: 0.4, minWidth: 0, fontSize: '0.75rem' }}
                    startIcon={<SearchRounded sx={{ fontSize: 14 }} />}
                  >
                    Buscar
                  </Button>
                </InputAdornment>
              ),
            }}
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

      <Box sx={{ pt: { xs: 4, md: 5 } }}>
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
      <Box sx={{ pt: { xs: 4, md: 5 }, pb: { xs: 1, md: 2 }, textAlign: 'center' }}>
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
