import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import CloseRounded from '@mui/icons-material/CloseRounded'
import PlaceRounded from '@mui/icons-material/PlaceRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded'
import SendRounded from '@mui/icons-material/SendRounded'
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded'
import VpnKeyRounded from '@mui/icons-material/VpnKeyRounded'
import { useAuth } from '../contexts/AuthContext'
import {
  acceptTicketTransferByCode,
  cancelTicketTransfer,
  fetchMyTickets,
  requestTicketTransfer,
} from '../services/tickets'
import { fetchEvent } from '../services/events'
import QRCode from 'qrcode'

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

const getEventDates = (event) => {
  if (Array.isArray(event?.dates) && event.dates.length) return event.dates
  if (event?.date) return [event.date]
  return []
}

const getLastEventDate = (event) => {
  const values = getEventDates(event)
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
  if (!values.length) return null
  return new Date(Math.max(...values.map((date) => date.getTime())))
}

const formatEventDateRange = (event) => {
  const dates = getEventDates(event)
  if (!dates.length) return 'Sem data'
  if (dates.length === 1) return new Date(dates[0]).toLocaleString('pt-BR')
  const first = new Date(dates[0])
  const last = new Date(dates[dates.length - 1])
  return `De ${first.toLocaleString('pt-BR')} a ${last.toLocaleString('pt-BR')}`
}

const getOrderMeta = (ticket) => {
  const orderValue = ticket.order
  const orderIdFromObject =
    orderValue && typeof orderValue === 'object'
      ? (orderValue.id ?? orderValue.orderId ?? orderValue._id ?? null)
      : null
  const orderCodeFromObject =
    orderValue && typeof orderValue === 'object'
      ? (orderValue.code ?? orderValue.orderCode ?? orderValue.number ?? null)
      : null
  const orderCreatedAtFromObject =
    orderValue && typeof orderValue === 'object'
      ? (orderValue.createdAt ?? orderValue.created_at ?? null)
      : null
  const orderPrimitive =
    orderValue && typeof orderValue !== 'object' ? orderValue : null

  const orderId =
    ticket.orderId ??
    ticket.order_id ??
    ticket.orderID ??
    ticket.purchaseId ??
    ticket.purchase_id ??
    orderIdFromObject ??
    orderPrimitive ??
    null

  const orderCode =
    ticket.orderCode ??
    ticket.order_code ??
    ticket.orderNumber ??
    ticket.order_number ??
    orderCodeFromObject ??
    null

  const orderCreatedAt =
    ticket.orderCreatedAt ??
    ticket.order_created_at ??
    orderCreatedAtFromObject ??
    ticket.createdAt ??
    ticket.created_at ??
    null

  const fallbackBucket = [
    ticket.event?.id || ticket.eventId || 'event',
    ticket.orderStatus || 'status',
    ticket.paymentStatus || 'payment',
    orderCreatedAt ? new Date(orderCreatedAt).toISOString().slice(0, 19) : 'no-date',
  ].join('|')

  const keyRaw = orderId ?? orderCode ?? fallbackBucket

  return {
    key: String(keyRaw),
    orderId: orderId ?? null,
    orderCode: orderCode ?? null,
    orderCreatedAt: orderCreatedAt ?? null,
  }
}

const getTransferExpiryDate = (ticket) => {
  const expiresAt = ticket?.transfer?.expiresAt
  if (!expiresAt) return null
  const date = new Date(expiresAt)
  return Number.isNaN(date.getTime()) ? null : date
}

const isTransferPending = (ticket, nowMs) => {
  if (ticket?.transfer?.status !== 'PENDING') return false
  const expiry = getTransferExpiryDate(ticket)
  if (!expiry) return true
  return expiry.getTime() > nowMs
}

const getTransferRemainingMs = (ticket, nowMs) => {
  const expiry = getTransferExpiryDate(ticket)
  if (!expiry) return 0
  return Math.max(0, expiry.getTime() - nowMs)
}

const formatRemaining = (ms) => {
  const safe = Math.max(0, ms)
  const totalSeconds = Math.floor(safe / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function MyTicketsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('ACTIVE')
  const [tickets, setTickets] = useState([])
  const [eventImagesById, setEventImagesById] = useState({})
  const [expandedOrders, setExpandedOrders] = useState({})
  const [nowMs, setNowMs] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [qrTicket, setQrTicket] = useState(null)
  const [qrImage, setQrImage] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [cancelingTransferId, setCancelingTransferId] = useState('')
  const [transferForm, setTransferForm] = useState({
    toEmail: '',
    toPhone: '',
    toCpf: '',
    message: '',
  })
  const [transferMessage, setTransferMessage] = useState('')
  const [transferCode, setTransferCode] = useState('')
  const [acceptForm, setAcceptForm] = useState({
    code: '',
    toCpf: '',
    toEmail: '',
    toPhone: '',
    name: '',
  })
  const [acceptMessage, setAcceptMessage] = useState('')
  const [acceptLoading, setAcceptLoading] = useState(false)

  const loadTickets = async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const data = await fetchMyTickets()
      setTickets(data || [])
    } catch {
      setError('Nao foi possivel carregar seus ingressos.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  useEffect(() => {
    if (!user) return
    setAcceptForm((prev) => ({
      ...prev,
      toCpf: user.cpf || prev.toCpf,
      toEmail: user.email || prev.toEmail,
      toPhone: user.phone || prev.toPhone,
      name: user.name || prev.name,
    }))
  }, [user])

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    const loadMissingEventImages = async () => {
      const eventMap = new Map()
      tickets.forEach((ticket) => {
        if (ticket.event?.id && !eventMap.has(ticket.event.id)) {
          eventMap.set(ticket.event.id, ticket.event)
        }
      })

      const idsToFetch = Array.from(eventMap.entries())
        .filter(([eventId, event]) => !getEventImageRaw(event) && eventImagesById[eventId] === undefined)
        .map(([eventId]) => eventId)

      if (!idsToFetch.length) return

      const results = await Promise.all(
        idsToFetch.map(async (eventId) => {
          try {
            const fullEvent = await fetchEvent(eventId)
            const imageRaw = getEventImageRaw(fullEvent)
            return [eventId, imageRaw ? resolveImage(imageRaw) : '']
          } catch {
            return [eventId, '']
          }
        }),
      )

      if (!active) return
      setEventImagesById((prev) => ({ ...prev, ...Object.fromEntries(results) }))
    }

    loadMissingEventImages()
    return () => {
      active = false
    }
  }, [tickets, eventImagesById])

  const grouped = useMemo(() => {
    const isCanceled = (ticket) =>
      ticket.orderStatus === 'CANCELED' || ticket.paymentStatus === 'FAILED'
    const isPaid = (ticket) =>
      ticket.orderStatus === 'PAID' || ticket.paymentStatus === 'SUCCEEDED'
    const isPending = (ticket) => !isCanceled(ticket) && !isPaid(ticket)

    const map = new Map()
    tickets.forEach((ticket) => {
      const meta = getOrderMeta(ticket)
      const key = meta.key
      if (!map.has(key)) {
        map.set(key, {
          key,
          orderId: meta.orderId,
          orderCode: meta.orderCode,
          orderCreatedAt: meta.orderCreatedAt,
          event: ticket.event,
          items: [],
        })
      }
      map.get(key).items.push(ticket)
    })

    return Array.from(map.values()).map((group) => {
      const isEnded = group.items.every((item) => {
        const endedAt = getLastEventDate(item.event)
        return endedAt ? endedAt.getTime() < Date.now() : false
      })
      const allCanceled = group.items.every(isCanceled)
      const hasPaid = group.items.some(isPaid)
      const hasPending = group.items.some(isPending)

      let section = 'PENDING'
      if (allCanceled) section = 'CANCELED'
      else if (isEnded) section = 'ENDED'
      else if (hasPaid) section = 'ACTIVE'
      else if (hasPending) section = 'PENDING'

      const eventId = group.items[0]?.event?.id
      const imageRaw = getEventImageRaw(group.items[0]?.event)
      const image = imageRaw ? resolveImage(imageRaw) : (eventImagesById[eventId] || '')

      return {
        ...group,
        event: group.items[0]?.event || group.event,
        section,
        image,
      }
    })
  }, [tickets, eventImagesById])

  const tabCounts = useMemo(
    () =>
      grouped.reduce(
        (acc, group) => {
          acc[group.section] += 1
          return acc
        },
        { ACTIVE: 0, PENDING: 0, CANCELED: 0, ENDED: 0 },
      ),
    [grouped],
  )

  const filteredGroups = useMemo(
    () => grouped.filter((group) => group.section === tab),
    [grouped, tab],
  )

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
    (ticket.orderStatus === 'PAID' || ticket.paymentStatus === 'SUCCEEDED') &&
    !isTransferPending(ticket, nowMs)

  const canTransfer = (ticket) => {
    if (ticket.orderStatus === 'CANCELED') return false
    if (ticket.paymentStatus === 'FAILED') return false
    if (!canShowQr(ticket)) return false
    if (ticket.used) return false
    if (isTransferPending(ticket, nowMs)) return false
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

  const toggleOrderDetails = (key) => {
    setExpandedOrders((prev) => ({ ...prev, [key]: !prev[key] }))
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
    setTransferCode('')
    try {
      const data = await requestTicketTransfer(selectedTicket.id, transferForm)
      setTransferMessage(data?.message || 'Transferencia solicitada.')
      setActionMessage(data?.message || 'Transferencia solicitada.')
      setTransferCode(data?.transfer?.code || data?.code || '')
      await loadTickets(true)
    } catch (err) {
      setTransferMessage(err?.response?.data?.message || 'Falha ao transferir.')
    }
  }

  const handleAcceptTransfer = async () => {
    setAcceptMessage('')
    if (!acceptForm.code) {
      setAcceptMessage('Informe o codigo recebido.')
      return
    }
    if (!acceptForm.toCpf || !acceptForm.toEmail || !acceptForm.toPhone) {
      setAcceptMessage('Complete CPF, e-mail e telefone para resgatar o ingresso.')
      return
    }
    setAcceptLoading(true)
    try {
      const payload = {
        toCpf: acceptForm.toCpf,
        toEmail: acceptForm.toEmail,
        toPhone: acceptForm.toPhone,
        name: acceptForm.name,
      }
      const data = await acceptTicketTransferByCode(acceptForm.code, payload)
      setAcceptMessage(data?.message || 'Transferencia aceita com sucesso.')
      setActionMessage(data?.message || 'Transferencia aceita com sucesso.')
      setAcceptForm((prev) => ({ ...prev, code: '' }))
      await loadTickets(true)
    } catch (err) {
      setAcceptMessage(err?.response?.data?.message || 'Falha ao aceitar transferencia.')
    } finally {
      setAcceptLoading(false)
    }
  }

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setActionMessage('Codigo copiado.')
    } catch {
      setActionMessage('Nao foi possivel copiar o codigo.')
    }
  }

  const handleCancelTransfer = async (ticket) => {
    const transferId = ticket?.transfer?.id
    if (!transferId) return
    setCancelingTransferId(transferId)
    setActionMessage('')
    try {
      const data = await cancelTicketTransfer(transferId)
      setActionMessage(data?.message || 'Transferencia cancelada.')
      await loadTickets(true)
    } catch (err) {
      setActionMessage(err?.response?.data?.message || 'Falha ao cancelar transferencia.')
    } finally {
      setCancelingTransferId('')
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

      <Card
        sx={{
          borderRadius: 3,
          color: '#fff',
          background: 'linear-gradient(135deg, #6b4cd6 0%, #5640b3 100%)',
          boxShadow: '0 16px 28px rgba(67, 56, 103, 0.25)',
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  Resgatar ingresso
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
                  Digite o código enviado pelo remetente para receber o ingresso.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  size="small"
                  label="Código"
                  value={acceptForm.code}
                  onChange={(e) => setAcceptForm((prev) => ({ ...prev, code: e.target.value }))}
                  sx={{ bgcolor: '#fff', borderRadius: 2, minWidth: { xs: '100%', sm: 200 } }}
                  InputLabelProps={{ sx: { color: 'rgba(0,0,0,0.6)' } }}
                  inputProps={{ maxLength: 6 }}
                />
                <Button
                  variant="contained"
                  startIcon={<VpnKeyRounded />}
                  onClick={handleAcceptTransfer}
                  disabled={acceptLoading}
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    background: '#fff',
                    color: '#4a36a6',
                    '&:hover': { background: '#efeafc' },
                  }}
                >
                  {acceptLoading ? 'Resgatando...' : 'Resgatar'}
                </Button>
              </Stack>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                label="CPF"
                value={acceptForm.toCpf}
                onChange={(e) => setAcceptForm((prev) => ({ ...prev, toCpf: e.target.value }))}
                sx={{ bgcolor: '#fff', borderRadius: 2, flex: 1 }}
                InputLabelProps={{ sx: { color: 'rgba(0,0,0,0.6)' } }}
              />
              <TextField
                size="small"
                label="E-mail"
                value={acceptForm.toEmail}
                onChange={(e) => setAcceptForm((prev) => ({ ...prev, toEmail: e.target.value }))}
                sx={{ bgcolor: '#fff', borderRadius: 2, flex: 1 }}
                InputLabelProps={{ sx: { color: 'rgba(0,0,0,0.6)' } }}
              />
              <TextField
                size="small"
                label="Telefone"
                value={acceptForm.toPhone}
                onChange={(e) => setAcceptForm((prev) => ({ ...prev, toPhone: e.target.value }))}
                sx={{ bgcolor: '#fff', borderRadius: 2, flex: 1 }}
                InputLabelProps={{ sx: { color: 'rgba(0,0,0,0.6)' } }}
              />
            </Stack>
            <TextField
              size="small"
              label="Nome completo"
              value={acceptForm.name}
              onChange={(e) => setAcceptForm((prev) => ({ ...prev, name: e.target.value }))}
              sx={{ bgcolor: '#fff', borderRadius: 2 }}
              InputLabelProps={{ sx: { color: 'rgba(0,0,0,0.6)' } }}
            />

            {acceptMessage ? <Alert severity="info">{acceptMessage}</Alert> : null}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="ACTIVE" label={`Ativos (${tabCounts.ACTIVE})`} />
          <Tab value="PENDING" label={`Pendentes (${tabCounts.PENDING})`} />
          <Tab value="CANCELED" label={`Cancelados (${tabCounts.CANCELED})`} />
          <Tab value="ENDED" label={`Encerrados (${tabCounts.ENDED})`} />
        </Tabs>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionMessage ? <Alert severity="info">{actionMessage}</Alert> : null}

      <Grid container spacing={2}>
        {filteredGroups.length ? (
          filteredGroups.map((group, index) => (
            <Grid key={group.key || group.orderId || `group-${index}`} size={{ xs: 12, md: 6, xl: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: "10px",
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: 180,
                    bgcolor: 'grey.200',
                    background: group.image
                      ? 'transparent'
                      : 'linear-gradient(135deg, #dbeafe 0%, #e2e8f0 100%)',
                  }}
                >
                  {group.image ? (
                    <Box
                      component="img"
                      src={group.image}
                      alt={group.event?.name || 'Evento'}
                      loading="lazy"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : null}
                </Box>
                <CardContent>
                  <Typography variant="h6" fontWeight={600}>
                    {group.event?.name || 'Evento'}
                  </Typography>
                  {group.orderCode || group.orderId ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Pedido #{group.orderCode || group.orderId}
                    </Typography>
                  ) : null}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                    <CalendarMonthRounded fontSize="small" color="disabled" />
                    <Typography variant="body2" color="text.secondary">
                      {formatEventDateRange(group.event)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                    <PlaceRounded fontSize="small" color="disabled" />
                    <Typography variant="body2" color="text.secondary">
                      {group.event?.location || 'Local a definir'}
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    variant="text"
                    onClick={() => toggleOrderDetails(group.key)}
                    sx={{ p: 0, minWidth: 0, alignSelf: 'flex-start' }}
                  >
                    {expandedOrders[group.key] ? 'Ocultar detalhes' : `Ver detalhes (${group.items.length} ingressos)`}
                  </Button>
                  <Collapse in={Boolean(expandedOrders[group.key])} unmountOnExit>
                    <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                      {group.items.map((ticket) => (
                        <Card
                          key={ticket.id}
                          variant="outlined"
                          sx={{ borderRadius: "10px", p: 1.5, bgcolor: 'grey.50' }}
                        >
                          <Stack spacing={1.2}>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              justifyContent="space-between"
                              alignItems={{ sm: 'flex-start' }}
                            >
                              <Box>
                                <Typography fontWeight={600}>
                                  {ticket.type}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Valor: R$aaa {(ticket.price / 100).toFixed(2)}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
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
                                {isTransferPending(ticket, nowMs) ? (
                                  <Chip
                                    size="small"
                                    label={`Transferindo (${formatRemaining(getTransferRemainingMs(ticket, nowMs))})`}
                                    color="warning"
                                  />
                                ) : null}
                                {ticket.transfer?.status === 'EXPIRED' ? (
                                  <Chip size="small" label="Transferencia expirada" color="default" />
                                ) : null}
                              </Stack>
                            </Stack>

                            {isTransferPending(ticket, nowMs) &&
                            ticket.transfer?.fromUserId === user?.id &&
                            ticket.transfer?.code ? (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                  Codigo: {ticket.transfer.code}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopyCode(ticket.transfer.code)}
                                  aria-label="Copiar codigo"
                                >
                                  <ContentCopyRounded fontSize="small" />
                                </IconButton>
                              </Stack>
                            ) : null}

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<QrCode2Rounded />}
                                onClick={() => openQr(ticket)}
                                disabled={!canShowQr(ticket)}
                                sx={{ minWidth: { sm: 140 } }}
                              >
                                Ver ingresso
                              </Button>
                              {isTransferPending(ticket, nowMs) &&
                              ticket.transfer?.fromUserId === user?.id ? (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => handleCancelTransfer(ticket)}
                                  disabled={cancelingTransferId === ticket.transfer.id}
                                  sx={{ minWidth: { sm: 180 } }}
                                >
                                  {cancelingTransferId === ticket.transfer.id
                                    ? 'Cancelando...'
                                    : 'Cancelar transferencia'}
                                </Button>
                              ) : null}
                              {canTransfer(ticket) ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<SendRounded />}
                                  onClick={() => openTransfer(ticket)}
                                  sx={{ minWidth: { sm: 140 } }}
                                >
                                  Transferir
                                </Button>
                              ) : null}
                            </Stack>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid size={{ xs: 12 }}>
            <Typography color="text.secondary">
              {grouped.length
                ? 'Nao ha ingressos nesta aba.'
                : 'Voce ainda nao tem ingressos.'}
            </Typography>
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
            {transferCode ? (
              <Alert severity="success">Codigo para compartilhar: {transferCode}</Alert>
            ) : null}
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
