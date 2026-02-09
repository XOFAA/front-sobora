import { useEffect, useMemo, useState } from 'react'
import { Box, Stack, TextField, Typography } from '@mui/material'
import SearchRounded from '@mui/icons-material/SearchRounded'
import EventSlider from '../components/event/EventSlider'
import { fetchEvents } from '../services/events'

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
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Descubra experiencias incriveis
        </Typography>
        <Typography color="text.secondary">
          Eventos selecionados e ingressos sem complicacao.
        </Typography>
      </Box>
      <Box sx={{ maxWidth: 520 }}>
        <TextField
          fullWidth
          placeholder="Buscar eventos, cidades ou temas..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          InputProps={{ startAdornment: <SearchRounded sx={{ mr: 1 }} /> }}
        />
      </Box>

      {loading ? (
        <Typography color="text.secondary">Carregando eventos...</Typography>
      ) : (
        <EventSlider events={filtered} />
      )}
    </Stack>
  )
}

export default HomePage
