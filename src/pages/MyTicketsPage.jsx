import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import PlaceRounded from '@mui/icons-material/PlaceRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded'
import SendRounded from '@mui/icons-material/SendRounded'
import { fetchMyTickets, requestTicketTransfer } from '../services/tickets'
import QRCode from 'qrcode'

function MyTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [qrTicket, setQrTicket] = useState(null)
  const [qrImage, setQrImage] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
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

  const getPaymentLabel = (ticket) => {
    if (ticket.orderStatus === 'CANCELED') return { label: 'Cancelado', color: 'error' }
    if (ticket.paymentStatus === 'SUCCEEDED' || ticket.orderStatus === 'PAID') {
      return { label: 'Pago', color: 'success' }
    }
    if (ticket.paymentStatus === 'FAILED') return { label: 'Falhou', color: 'error' }
    return { label: 'Pendente', color: 'warning' }
  }

  const getUseLabel = (ticket) =>
    ticket.used ? { label: 'Validado', color: 'success' } : { label: 'Nao validado', color: 'default' }

  const canShowQr = (ticket) =>
    ticket.orderStatus === 'PAID' || ticket.paymentStatus === 'SUCCEEDED'

  const canTransfer = (ticket) => {
    if (ticket.orderStatus === 'CANCELED') return false
    if (ticket.paymentStatus === 'FAILED') return false
    if (!canShowQr(ticket)) return false
    if (ticket.used) return false
    return true
  }

  const openTransfer = (ticket) => {
    setSelectedTicket(ticket)
    setTransferForm({ toEmail: '', toPhone: '', toCpf: '', message: '' })
    setTransferMessage('')
  }

  const openQr = (ticket) => {
    setQrTicket(ticket)
  }

  useEffect(() => {
    let active = true
    const generateQr = async () => {
      if (!qrTicket?.qrCode) return
      setQrLoading(true)
      try {
        const dataUrl = await QRCode.toDataURL(qrTicket.qrCode, { width: 240, margin: 1 })
        if (active) setQrImage(dataUrl)
      } catch {
        if (active) setQrImage('')
      } finally {
        if (active) setQrLoading(false)
      }
    }
    generateQr()
    return () => {
      active = false
    }
  }, [qrTicket])

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
                  <Grid container spacing={2}>
                    {group.items.map((ticket) => (
                      <Grid key={ticket.id} size={{ xs: 12, md: 6 }}>
                        <Card
                          variant="outlined"
                          sx={{
                            p: { xs: 2, md: 2.5 },
                            borderRadius: 3,
                            bgcolor: 'background.paper',
                            boxShadow: '0px 16px 32px rgba(15, 23, 42, 0.16)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              background:
                                'radial-gradient(circle at 10% 0%, rgba(110,81,197,0.18), transparent 55%)',
                              pointerEvents: 'none',
                            }}
                          />
                          <Stack spacing={2} sx={{ position: 'relative' }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                              <Box>
                                <Typography variant="h6" fontWeight={700}>
                                  {ticket.event?.name || 'Evento'}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                  <CalendarMonthRounded fontSize="small" color="disabled" />
                                  <Typography variant="body2" color="text.secondary">
                                    {ticket.event?.date
                                      ? new Date(ticket.event.date).toLocaleString('pt-BR')
                                      : 'Sem data'}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                  <PlaceRounded fontSize="small" color="disabled" />
                                  <Typography variant="body2" color="text.secondary">
                                    {ticket.event?.location || 'Local a definir'}
                                  </Typography>
                                </Stack>
                              </Box>

                              <Box>
                                <Typography fontWeight={600}>
                                  Tipo ingresso: {ticket.type}
                                </Typography>
                                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                                  Valor: R$ {(ticket.price / 100).toFixed(2)}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                  <Chip
                                    size="small"
                                    label={getPaymentLabel(ticket).label}
                                    color={getPaymentLabel(ticket).color}
                                  />
                                  <Chip
                                    size="small"
                                    label={getUseLabel(ticket).label}
                                    color={getUseLabel(ticket).color}
                                  />
                                </Stack>
                              </Box>
                            </Stack>

                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1.5}
                              alignItems={{ sm: 'center' }}
                              justifyContent="flex-end"
                            >
                              <Button
                                variant="contained"
                                startIcon={<QrCode2Rounded />}
                                onClick={() => openQr(ticket)}
                                disabled={!canShowQr(ticket)}
                                sx={{ minWidth: { xs: '100%', sm: 180 } }}
                              >
                                Ver ingresso
                              </Button>
                              {canTransfer(ticket) ? (
                                <Button
                                  variant="outlined"
                                  startIcon={<SendRounded />}
                                  onClick={() => openTransfer(ticket)}
                                  sx={{ minWidth: { xs: '100%', sm: 180 } }}
                                >
                                  Transferir
                                </Button>
                              ) : null}
                            </Stack>
                          </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
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

      <Dialog open={Boolean(qrTicket)} onClose={() => setQrTicket(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          QR Code do ingresso
          <IconButton
            onClick={() => setQrTicket(null)}
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center" sx={{ pt: 1 }}>
            <Box
              sx={{
                width: 260,
                height: 260,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                borderRadius: 2,
              }}
            >
              {qrLoading ? (
                <Typography color="text.secondary">Gerando QR Code...</Typography>
              ) : qrImage ? (
                <Box component="img" src={qrImage} alt="QR Code" sx={{ width: 240, height: 240 }} />
              ) : (
                <Typography color="text.secondary">Nao foi possivel gerar o QR Code.</Typography>
              )}
            </Box>
            {qrTicket ? (
              <Stack spacing={0.5} alignItems="center">
                <Typography fontWeight={600}>{qrTicket.type}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Codigo: {qrTicket.qrCode}
                </Typography>
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  )
}

export default MyTicketsPage
