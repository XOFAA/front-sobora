import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { fetchMyTickets, requestTicketTransfer } from '../services/tickets'

function MyTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [transferForm, setTransferForm] = useState({
    toEmail: '',
    toPhone: '',
    toCpf: '',
    message: '',
  })
  const [transferMessage, setTransferMessage] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const data = await fetchMyTickets()
        if (active) setTickets(data || [])
      } catch (err) {
        if (active) setError('Nao foi possivel carregar seus ingressos.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const grouped = useMemo(() => {
    const map = new Map()
    tickets.forEach((ticket) => {
      const key = ticket.event?.id || 'unknown'
      if (!map.has(key)) {
        map.set(key, { event: ticket.event, items: [] })
      }
      map.get(key).items.push(ticket)
    })
    return Array.from(map.values())
  }, [tickets])

  const openTransfer = (ticket) => {
    setSelectedTicket(ticket)
    setTransferForm({ toEmail: '', toPhone: '', toCpf: '', message: '' })
    setTransferMessage('')
  }

  const handleTransfer = async () => {
    if (!selectedTicket) return
    setTransferMessage('')
    try {
      const data = await requestTicketTransfer(selectedTicket.id, transferForm)
      setTransferMessage(data?.message || 'Transferencia solicitada.')
    } catch (err) {
      setTransferMessage(err?.response?.data?.message || 'Falha ao transferir.')
    }
  }

  if (loading) {
    return <Typography color="text.secondary">Carregando ingressos...</Typography>
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Meus ingressos
        </Typography>
        <Typography color="text.secondary">
          Veja seus ingressos e transfira para outra pessoa.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        {grouped.length ? (
          grouped.map((group) => (
            <Grid key={group.event?.id || Math.random()} size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600}>
                    {group.event?.name || 'Evento'}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {group.event?.date
                      ? new Date(group.event.date).toLocaleString('pt-BR')
                      : 'Sem data'}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1}>
                    {group.items.map((ticket) => (
                      <Stack
                        key={ticket.id}
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        alignItems={{ md: 'center' }}
                        justifyContent="space-between"
                        sx={{ p: 1, borderRadius: 2, bgcolor: 'background.default' }}
                      >
                        <Box>
                          <Typography fontWeight={600}>{ticket.type}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            QR: {ticket.qrCode}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography color="text.secondary">
                            R$ {(ticket.price / 100).toFixed(2)}
                          </Typography>
                          <Button variant="outlined" onClick={() => openTransfer(ticket)}>
                            Transferir
                          </Button>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid size={{ xs: 12 }}>
            <Typography color="text.secondary">Voce ainda nao tem ingressos.</Typography>
          </Grid>
        )}
      </Grid>

      <Dialog open={Boolean(selectedTicket)} onClose={() => setSelectedTicket(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          Transferir ingresso
          <IconButton
            onClick={() => setSelectedTicket(null)}
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="CPF do destinatario"
              value={transferForm.toCpf}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, toCpf: e.target.value }))}
            />
            <TextField
              label="Email do destinatario"
              value={transferForm.toEmail}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, toEmail: e.target.value }))}
            />
            <TextField
              label="Telefone do destinatario"
              value={transferForm.toPhone}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, toPhone: e.target.value }))}
            />
            <TextField
              label="Mensagem (opcional)"
              multiline
              rows={3}
              value={transferForm.message}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, message: e.target.value }))}
            />
            {transferMessage ? <Alert severity="info">{transferMessage}</Alert> : null}
            <Button variant="contained" onClick={handleTransfer}>
              Enviar transferencia
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  )
}

export default MyTicketsPage
