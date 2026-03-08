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
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import ConfirmationNumberRounded from '@mui/icons-material/ConfirmationNumberRounded'
import DownloadRounded from '@mui/icons-material/DownloadRounded'
import WorkOutlineRounded from '@mui/icons-material/WorkOutlineRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded'
import InfoRounded from '@mui/icons-material/InfoRounded'
import { useAuth } from '../contexts/AuthContext'
import {
  acceptTicketTransferByCode,
  cancelTicketTransfer,
  fetchTransfersSent,
  fetchMyTickets,
  requestTicketTransfer,
} from '../services/tickets'
import { fetchEvent } from '../services/events'
import { fetchMyOrders } from '../services/orders'
import QRCode from 'qrcode'
import { useNavigate } from 'react-router-dom'
import PhoneWithCountryField from '../components/inputs/PhoneWithCountryField'
import { COUNTRY_OPTIONS, normalizePhoneNumber, validatePhoneLocalLength } from '../utils/contact'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

const formatDateTime = (value) => {
  if (!value) return 'Sem data'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Sem data' : date.toLocaleString('pt-BR')
}

const formatPriceOrFree = (value) => {
  const amount = value ?? 0
  if (amount === 0) return 'Gratuito'
  return (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const getGoogleWalletLink = (ticket) => {
  const candidates = [
    ticket?.googleWalletUrl,
    ticket?.google_wallet_url,
    ticket?.walletUrl,
    ticket?.wallet_url,
    ticket?.walletPassUrl,
    ticket?.wallet_pass_url,
    ticket?.saveToGoogleWalletUrl,
    ticket?.save_to_google_wallet_url,
    ticket?.passUrl,
    ticket?.pass_url,
  ]
  return candidates.find((value) => typeof value === 'string' && value.trim()) || ''
}

const getEventCategoryLabel = (event) =>
  event?.category?.name || event?.categoryName || event?.category || 'Evento'

const getOrganizerName = (event) =>
  event?.tenant?.tradeName || event?.tenant?.name || event?.organizer?.name || event?.organizerName || 'Organizador'

const getOrganizerLogo = (event) =>
  resolveImage(
    event?.tenant?.logoUrl ||
      event?.organizer?.logoUrl ||
      event?.organizerLogo ||
      '',
  )

function MyTicketsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('ACTIVE')
  const [tickets, setTickets] = useState([])
  const [transfersSent, setTransfersSent] = useState([])
  const [orders, setOrders] = useState([])
  const [eventImagesById, setEventImagesById] = useState({})
  const [eventDetailsById, setEventDetailsById] = useState({})
  const [expandedOrderKey, setExpandedOrderKey] = useState(null)
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
    phone: '',
    countryIso2: 'BR',
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
  const [acceptSuccess, setAcceptSuccess] = useState(false)

  const loadTickets = async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const [ticketsData, transfersData, ordersData] = await Promise.all([
        fetchMyTickets(),
        fetchTransfersSent(),
        fetchMyOrders(),
      ])
      setTickets(ticketsData || [])
      setTransfersSent(transfersData || [])
      setOrders(ordersData || [])
    } catch {
      setError('Não foi possível carregar seus ingressos.')
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
    const loadMissingEventData = async () => {
      const eventMap = new Map()
      tickets.forEach((ticket) => {
        if (ticket.event?.id && !eventMap.has(ticket.event.id)) {
          eventMap.set(ticket.event.id, ticket.event)
        }
      })

      const idsToFetch = Array.from(eventMap.entries())
        .filter(([eventId, event]) => {
          const missingImage = !getEventImageRaw(event) && eventImagesById[eventId] === undefined
          const missingOrganizer = !getOrganizerName(event) || getOrganizerName(event) === 'Organizador'
          const missingLogo = !getOrganizerLogo(event)
          return missingImage || missingOrganizer || missingLogo
        })
        .map(([eventId]) => eventId)

      if (!idsToFetch.length) return

      const results = await Promise.all(
        idsToFetch.map(async (eventId) => {
          try {
            const fullEvent = await fetchEvent(eventId)
            const imageRaw = getEventImageRaw(fullEvent)
            return [eventId, { image: imageRaw ? resolveImage(imageRaw) : '', event: fullEvent || {} }]
          } catch {
            return [eventId, { image: '', event: {} }]
          }
        }),
      )

      if (!active) return
      setEventImagesById((prev) => ({
        ...prev,
        ...Object.fromEntries(results.map(([eventId, data]) => [eventId, data.image])),
      }))
      setEventDetailsById((prev) => ({
        ...prev,
        ...Object.fromEntries(results.map(([eventId, data]) => [eventId, data.event])),
      }))
    }

    loadMissingEventData()
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

  const tabCounts = useMemo(() => {
    const base = grouped.reduce(
      (acc, group) => {
        acc[group.section] += 1
        return acc
      },
      { ACTIVE: 0, PENDING: 0, CANCELED: 0, ENDED: 0 },
    )
    return { ...base, TRANSFERRED: transfersSent.length, ORDERS: orders.length }
  }, [grouped, transfersSent, orders])

  const filteredGroups = useMemo(
    () => grouped.filter((group) => group.section === tab),
    [grouped, tab],
  )

  const getPaymentLabel = (ticket) => {
    if ((ticket.price ?? 0) === 0 && (ticket.paymentStatus === 'SUCCEEDED' || ticket.orderStatus === 'PAID')) {
      return { label: 'Gratuito', color: 'info' }
    }
    if (ticket.orderStatus === 'CANCELED') return { label: 'Cancelado', color: 'error' }
    if (ticket.paymentStatus === 'SUCCEEDED' || ticket.orderStatus === 'PAID') {
      return { label: 'Pago', color: 'success' }
    }
    if (ticket.paymentStatus === 'FAILED') return { label: 'Falhou', color: 'error' }
    return { label: 'Pendente', color: 'warning' }
  }

  const getOrderStatusLabel = (order) => {
    if ((order.total ?? 0) === 0 && order.status === 'PAID') {
      return { label: 'Gratuito', color: 'info' }
    }
    return {
      label: order.status === 'PAID' ? 'Pago' : order.status,
      color: order.status === 'PAID' ? 'success' : 'default',
    }
  }

  const getOrderPaymentText = (order) => {
    if ((order.total ?? 0) === 0) return 'Gratuito'
    return order.paymentStatus || 'Não informado'
  }

  const getUseLabel = (ticket) =>
    ticket.used ? { label: 'Validado', color: 'success' } : { label: 'Não validado', color: 'default' }

  const getTicketStatusBadges = (ticket) => {
    const styles = {
      valido: { label: 'Válido', sx: { bgcolor: '#D9F4E4', color: '#2E9B5D', border: '1px solid #A9E2C4' } },
      processando: { label: 'Processando', sx: { bgcolor: '#D8EEF9', color: '#3A7EA4', border: '1px solid #B6DDF2' } },
      utilizado: { label: 'Utilizado', sx: { bgcolor: '#F9DDE8', color: '#A84D6E', border: '1px solid #F0BED1' } },
      transferido: { label: 'Transferido', sx: { bgcolor: '#E9E2FF', color: '#6E51C5', border: '1px solid #D8CCFF' } },
      enviado: { label: 'Enviado', sx: { bgcolor: '#FDECC8', color: '#B87C1D', border: '1px solid #F8DFA5' } },
      encerrado: { label: 'Encerrado', sx: { bgcolor: '#ECEFF3', color: '#64748B', border: '1px solid #D5DCE5' } },
      cancelado: { label: 'Cancelado', sx: { bgcolor: '#FCE1DF', color: '#C44545', border: '1px solid #F7C2BE' } },
    }

    const badges = []

    const orderStatus = ticket?.orderStatus || ''
    const paymentStatus = ticket?.paymentStatus || ''
    const transferStatus = ticket?.transfer?.status || ''
    const isEnded = (() => {
      const lastDate = getLastEventDate(ticket?.event)
      return lastDate ? lastDate.getTime() < Date.now() : false
    })()

    const isCanceled =
      orderStatus === 'CANCELED' || orderStatus === 'REFUNDED' || paymentStatus === 'FAILED' || paymentStatus === 'REFUNDED'
    const isProcessing = orderStatus === 'PENDING' || paymentStatus === 'PENDING'
    const isUsed = Boolean(ticket?.used)
    const isSentTransfer = transferStatus === 'PENDING' && ticket?.transfer?.fromUserId === user?.id
    const isTransferred = transferStatus === 'COMPLETED'
    const isValid =
      !isCanceled &&
      !isProcessing &&
      !isUsed &&
      !isEnded &&
      (orderStatus === 'PAID' || paymentStatus === 'SUCCEEDED' || (ticket?.price ?? 0) === 0)

    if (isValid) badges.push(styles.valido)
    if (isProcessing) badges.push(styles.processando)
    if (isUsed) badges.push(styles.utilizado)
    if (isTransferred) badges.push(styles.transferido)
    if (isSentTransfer) badges.push(styles.enviado)
    if (isEnded) badges.push(styles.encerrado)
    if (isCanceled) badges.push(styles.cancelado)

    return badges
  }

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
    setTransferForm({ phone: '', countryIso2: 'BR', message: '' })
    setTransferMessage('')
  }

  const openQr = (ticket) => {
    setQrTicket(ticket)
  }

  const toggleOrderDetails = (key) => {
    setExpandedOrderKey((prev) => (prev === key ? null : key))
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
      if (!validatePhoneLocalLength(transferForm.phone, transferForm.countryIso2)) {
        const country = COUNTRY_OPTIONS.find((item) => item.iso2 === transferForm.countryIso2) || COUNTRY_OPTIONS[0]
        setTransferMessage(`Telefone inválido para ${country.name}.`)
        return
      }
      const payload = {
        toPhone: normalizePhoneNumber(transferForm.phone, transferForm.countryIso2),
        message: transferForm.message,
      }
      const data = await requestTicketTransfer(selectedTicket.id, payload)
      setTransferMessage(data?.message || 'Transferência solicitada.')
      setActionMessage(data?.message || 'Transferência solicitada.')
      setTransferCode(data?.transfer?.code || data?.code || '')
      await loadTickets(true)
    } catch (err) {
      setTransferMessage(err?.response?.data?.message || 'Falha ao transferir.')
    }
  }

  const handleAcceptTransfer = async () => {
    setAcceptMessage('')
    setAcceptSuccess(false)
    if (!acceptForm.code) {
      setAcceptMessage('Informe o código recebido.')
      return
    }
    setAcceptLoading(true)
    try {
      const payload = {
        toCpf: user?.cpf,
        toEmail: user?.email,
        toPhone: user?.phone,
        name: user?.name,
      }
      const data = await acceptTicketTransferByCode(acceptForm.code, payload)
      setAcceptMessage(data?.message || 'Transferência aceita com sucesso.')
      setAcceptSuccess(true)
      setActionMessage(data?.message || 'Transferência aceita com sucesso.')
      setAcceptForm((prev) => ({ ...prev, code: '' }))
      await loadTickets(true)
      setTab('ACTIVE')
      setTimeout(() => {
        navigate('/tickets')
      }, 800)
    } catch (err) {
      setAcceptMessage(err?.response?.data?.message || 'Falha ao aceitar transferência.')
    } finally {
      setAcceptLoading(false)
    }
  }

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setActionMessage('Código copiado.')
    } catch {
      setActionMessage('Não foi possível copiar o código.')
    }
  }

  const getTransferStatusLabel = (status) => {
    if (status === 'COMPLETED') return { label: 'Concluída', color: 'success' }
    if (status === 'CANCELED') return { label: 'Cancelada', color: 'default' }
    if (status === 'EXPIRED') return { label: 'Expirada', color: 'default' }
    return { label: 'Pendente', color: 'warning' }
  }

  const handleDownloadTransfersReport = () => {
    if (!transfersSent.length) return
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const title = 'Relatório de transferências'
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(title, 40, 40)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Gerado em: ${formatDateTime(new Date())}`, 40, 58)

    const rows = transfersSent.map((transfer) => ([
      transfer.event?.name || 'Evento',
      transfer.ticketType?.name || 'Ingresso',
      transfer.toUser?.name || transfer.toEmail || transfer.toPhone || 'Não informado',
      transfer.toPhone || '-',
      getTransferStatusLabel(transfer.status).label,
      formatDateTime(transfer.createdAt),
      transfer.status === 'COMPLETED' ? formatDateTime(transfer.updatedAt) : '-',
    ]))

    autoTable(doc, {
      startY: 80,
      head: [['Evento', 'Tipo', 'Destinatário', 'Telefone', 'Status', 'Enviado em', 'Aceito em']],
      body: rows,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [109, 40, 217] },
    })

    const fileDate = new Date().toISOString().slice(0, 10)
    doc.save(`transferencias-${fileDate}.pdf`)
  }

  const handleDownloadTicket = async (ticket) => {
    if (!ticket?.qrCode) {
      setActionMessage('Este ingresso não possui QR Code para download.')
      return
    }
    try {
      const dataUrl = await QRCode.toDataURL(ticket.qrCode, { width: 720, margin: 1 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `ingresso-${ticket.id || 'qrcode'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setActionMessage('QR Code do ingresso baixado.')
    } catch {
      setActionMessage('Não foi possível baixar o QR Code.')
    }
  }

  const handleOpenGoogleWallet = (ticket) => {
    const walletUrl = getGoogleWalletLink(ticket)
    if (!walletUrl) {
      setActionMessage('Este ingresso ainda não possui link para Google Wallet.')
      return
    }
    window.open(walletUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCancelTransfer = async (ticket) => {
    const transferId = ticket?.transfer?.id
    if (!transferId) return
    setCancelingTransferId(transferId)
    setActionMessage('')
    try {
      const data = await cancelTicketTransfer(transferId)
      setActionMessage(data?.message || 'Transferência cancelada.')
      await loadTickets(true)
    } catch (err) {
      setActionMessage(err?.response?.data?.message || 'Falha ao cancelar transferência.')
    } finally {
      setCancelingTransferId('')
    }
  }

  if (loading) {
    return <Typography color="text.secondary">Carregando ingressos...</Typography>
  }

  return (
    <Stack spacing={3} sx={{ pb: 4 }}>
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
          borderRadius: '10px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)',
          boxShadow: '0 18px 32px rgba(67, 56, 103, 0.28)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(600px 220px at 10% 0%, rgba(255,255,255,0.22), transparent 60%), radial-gradient(700px 260px at 90% 100%, rgba(255,255,255,0.12), transparent 60%)',
            opacity: 0.9,
          }}
        />
        <CardContent>
          <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ md: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  Resgatar ingresso
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
                  Digite o código de 6 dígitos enviado pelo remetente para receber o ingresso.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="stretch">
                <TextField
                  size="small"
                  label="Código"
                  value={acceptForm.code}
                  onChange={(e) => setAcceptForm((prev) => ({ ...prev, code: e.target.value }))}
                  sx={{
                    bgcolor: '#fff',
                    borderRadius: 2,
                    minWidth: { xs: '100%', sm: 220 },
                  }}
                  InputLabelProps={{ sx: { color: 'rgba(0,0,0,0.6)' } }}
                  inputProps={{ maxLength: 6, style: { letterSpacing: 6, fontWeight: 600 } }}
                />
                <Button
                  variant="contained"
                  startIcon={<VpnKeyRounded />}
                  onClick={handleAcceptTransfer}
                  disabled={acceptLoading}
                  sx={{
                    borderRadius: '10px',
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

            {acceptMessage ? (
              <Alert severity={acceptSuccess ? 'success' : 'info'} icon={acceptSuccess ? <CheckCircleRounded /> : undefined}>
                {acceptMessage}
              </Alert>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              height: 2,
              borderRadius: '2px',
              background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)',
            },
          }}
        >
          <Tab
            value="ACTIVE"
            label={`Ativos (${tabCounts.ACTIVE})`}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: '#64748B',
              '&.Mui-selected': {
                background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              },
            }}
          />
          <Tab value="PENDING" label={`Pendentes (${tabCounts.PENDING})`} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748B', '&.Mui-selected': { background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } }} />
          <Tab value="CANCELED" label={`Cancelados (${tabCounts.CANCELED})`} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748B', '&.Mui-selected': { background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } }} />
          <Tab value="ENDED" label={`Encerrados (${tabCounts.ENDED})`} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748B', '&.Mui-selected': { background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } }} />
          <Tab value="TRANSFERRED" label={`Transferidos (${tabCounts.TRANSFERRED})`} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748B', '&.Mui-selected': { background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } }} />
          <Tab value="ORDERS" label={`Pedidos (${tabCounts.ORDERS})`} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748B', '&.Mui-selected': { background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } }} />
        </Tabs>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionMessage ? <Alert severity="info">{actionMessage}</Alert> : null}

      {tab === 'ORDERS' ? (
        <Grid container spacing={2}>
          {orders.length ? (
            orders.map((order) => (
              <Grid key={order.id} size={{ xs: 12, md: 6 }}>
                <Card sx={{ borderRadius: '10px', border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      {/** Status do pedido: pedidos gratuitos não devem aparecer como "Pago". */}
                      {(() => {
                        const orderStatusMeta = getOrderStatusLabel(order)
                        return (
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Typography fontWeight={700}>
                          {order.event?.name || 'Pedido'}
                        </Typography>
                        <Chip
                          size="small"
                          label={orderStatusMeta.label}
                          color={orderStatusMeta.color}
                        />
                      </Stack>
                        )
                      })()}
                      <Typography variant="body2" color="text.secondary">
                        Pedido #{order.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Data da compra: {formatDateTime(order.createdAt)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pagamento: {getOrderPaymentText(order)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total: {formatPriceOrFree(order.total)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ingressos: {order.ticketsCount}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <Typography color="text.secondary">Você ainda não tem pedidos.</Typography>
            </Grid>
          )}
        </Grid>
      ) : tab === 'TRANSFERRED' ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
              <Typography fontWeight={600}>Transferências enviadas</Typography>
              <Button
                variant="outlined"
                onClick={handleDownloadTransfersReport}
                disabled={!transfersSent.length}
              >
                Baixar relatório (PDF)
              </Button>
            </Stack>
          </Grid>
          {transfersSent.length ? (
            transfersSent.map((transfer) => (
              <Grid key={transfer.id} size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      background:
                        'linear-gradient(90deg, rgba(110, 81, 197, 0.16) 0%, rgba(87, 71, 168, 0.18) 100%)',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Typography fontWeight={700}>
                        {transfer.event?.name || 'Evento'}
                      </Typography>
                      <Chip
                        size="small"
                        label={getTransferStatusLabel(transfer.status).label}
                        color={getTransferStatusLabel(transfer.status).color}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {transfer.event?.date ? formatDateTime(transfer.event.date) : 'Data a definir'}
                    </Typography>
                  </Box>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Typography variant="body2" color="text.secondary">
                        Tipo: {transfer.ticketType?.name || 'Ingresso'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Destinatário: {transfer.toUser?.name || transfer.toEmail || transfer.toPhone || 'Não informado'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Enviado em: {formatDateTime(transfer.createdAt)}
                      </Typography>
                      {transfer.status === 'COMPLETED' ? (
                        <Typography variant="body2" color="text.secondary">
                          Aceito em: {formatDateTime(transfer.updatedAt)}
                        </Typography>
                      ) : null}
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        {transfer.toEmail ? (
                          <Chip size="small" label={transfer.toEmail} />
                        ) : null}
                        {transfer.toPhone ? (
                          <Chip size="small" label={transfer.toPhone} />
                        ) : null}
                        {transfer.toCpf ? (
                          <Chip size="small" label={`CPF: ${transfer.toCpf}`} />
                        ) : null}
                      </Stack>
                      {transfer.status === 'PENDING' && transfer.code ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Código: {transfer.code}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyCode(transfer.code)}
                            aria-label="Copiar código"
                          >
                            <ContentCopyRounded fontSize="small" />
                          </IconButton>
                        </Stack>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <Typography color="text.secondary">Você ainda não transferiu ingressos.</Typography>
            </Grid>
          )}
        </Grid>
      ) : (
        <Grid container spacing={2}>
        {filteredGroups.length ? (
          filteredGroups.map((group, index) => (
            <Grid key={group.key || group.orderId || `group-${index}`} size={{ xs: 12, md: 6, xl: 4 }}>
              {(() => {
                const expandKey = `${group.key || group.orderId || 'group'}-${group.event?.id || 'event'}-${index}`
                const hydratedEvent = {
                  ...(eventDetailsById[group.event?.id] || {}),
                  ...(group.event || {}),
                }
                return (
              <Card
                sx={{
                  borderRadius: '10px',
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
                      alt={hydratedEvent?.name || 'Evento'}
                      loading="lazy"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : null}
                </Box>
                <CardContent>
                  <Chip
                    size="small"
                    label={getEventCategoryLabel(group.event)}
                    sx={{
                      mb: 1,
                      borderRadius: '8px',
                      height: 24,
                      background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  />
                  <Typography sx={{ fontSize: { xs: '1.15rem', sm: '1.3rem' }, fontWeight: 700, lineHeight: 1.25 }}>
                    {hydratedEvent?.name || 'Evento'}
                  </Typography>
                  {group.orderCode || group.orderId ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Pedido #{group.orderCode || group.orderId}
                    </Typography>
                  ) : null}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                    <CalendarMonthRounded fontSize="small" color="disabled" />
                    <Typography variant="body2" color="text.secondary">
                      {formatEventDateRange(hydratedEvent)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                    <PlaceRounded fontSize="small" color="disabled" />
                    <Typography variant="body2" color="text.secondary">
                      {hydratedEvent?.location || 'Local a definir'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                    {getOrganizerLogo(hydratedEvent) ? (
                      <Box
                        component="img"
                        src={getOrganizerLogo(hydratedEvent)}
                        alt={getOrganizerName(hydratedEvent)}
                        sx={{ width: 24, height: 24, borderRadius: '6px', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '6px',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: '#0F1F5A',
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {getOrganizerName(hydratedEvent).slice(0, 1).toUpperCase()}
                      </Box>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {getOrganizerName(hydratedEvent)}
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <Button
                    variant="contained"
                    startIcon={expandedOrderKey === expandKey ? <ExpandLessRounded /> : <ExpandMoreRounded />}
                    onClick={() => toggleOrderDetails(expandKey)}
                    sx={{
                      alignSelf: 'flex-start',
                      borderRadius: '12px',
                      px: 2.2,
                      py: 1,
                      fontSize:14,
                      fontWeight: 700,
                      background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)',
                      color: '#fff',
                      '&:hover': { background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)', opacity: 0.95 },
                    }}
                  >
                    {expandedOrderKey === expandKey
                      ? `Ocultar detalhes (${group.items.length} ingressos)`
                      : `Ver detalhes (${group.items.length} ingressos)`}
                  </Button>
                  <Collapse in={expandedOrderKey === expandKey} unmountOnExit>
                    <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                      {group.items.map((ticket) => (
                        <Card
                          key={ticket.id}
                          variant="outlined"
                          sx={{ borderRadius: '12px', p: 1.5, bgcolor: '#fff', borderColor: '#E2E8F0' }}
                        >
                          <Stack spacing={1.15}>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              justifyContent="space-between"
                              alignItems={{ sm: 'flex-start' }}
                            >
                              <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1rem' } }}>
                                  {ticket.type}
                                </Typography>
                                <Typography sx={{ color: '#6E51C5', fontSize: { xs: '1.3rem', sm: '1.4rem' }, fontWeight: 700 }}>
                                  {formatPriceOrFree(ticket.price)}
                                </Typography>
                              </Box>
                              <Stack spacing={0.5} sx={{ minWidth: 110 }}>
                                {getTicketStatusBadges(ticket).map((badge) => (
                                  <Chip
                                    key={`${ticket.id}-${badge.label}`}
                                    size="small"
                                    label={badge.label}
                                    sx={{
                                      height: 22,
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      borderRadius: '8px',
                                      ...badge.sx,
                                    }}
                                  />
                                ))}
                                {ticket.transfer?.status === 'EXPIRED' ? (
                                  <Chip
                                    size="small"
                                    label="Transferência expirada"
                                    sx={{
                                      height: 22,
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      borderRadius: '8px',
                                      bgcolor: '#ECEFF3',
                                      color: '#64748B',
                                      border: '1px solid #D5DCE5',
                                    }}
                                  />
                                ) : null}
                                {isTransferPending(ticket, nowMs) ? (
                                  <Chip
                                    size="small"
                                    label={`Transferindo (${formatRemaining(getTransferRemainingMs(ticket, nowMs))})`}
                                    sx={{
                                      height: 22,
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      borderRadius: '8px',
                                      bgcolor: '#FDECC8',
                                      color: '#B87C1D',
                                      border: '1px solid #F8DFA5',
                                    }}
                                  />
                                ) : null}
                              </Stack>
                            </Stack>

                            <Typography variant="body2" color="text.secondary">
                              {ticket?.description || 'Acesso ao setor conforme disponibilidade do evento.'}
                            </Typography>


                            {isTransferPending(ticket, nowMs) &&
                            ticket.transfer?.fromUserId === user?.id &&
                            ticket.transfer?.code ? (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                  Código: {ticket.transfer.code}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopyCode(ticket.transfer.code)}
                                  aria-label="Copiar código"
                                >
                                  <ContentCopyRounded fontSize="small" />
                                </IconButton>
                              </Stack>
                            ) : null}

                            <Button
                              variant="contained"
                              startIcon={<ConfirmationNumberRounded />}
                              onClick={() => openQr(ticket)}
                              disabled={!canShowQr(ticket)}
                              sx={{
                                borderRadius: '12px',
                                height: { xs: 40, sm: 42 },
                                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                                fontWeight: 700,
                                background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)',
                                '&:hover': { background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)', opacity: 0.95 },
                              }}
                            >
                              Ver ingresso
                            </Button>

                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="outlined"
                                onClick={() => handleDownloadTicket(ticket)}
                                sx={{ flex: 1, minWidth: 0, borderRadius: '12px', borderColor: '#94A3B8', color: '#64748B' }}
                              >
                                <DownloadRounded />
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => handleOpenGoogleWallet(ticket)}
                                sx={{ flex: 1, minWidth: 0, borderRadius: '12px', borderColor: '#94A3B8', color: '#64748B' }}
                              >
                                <WorkOutlineRounded />
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => canTransfer(ticket) && openTransfer(ticket)}
                                disabled={!canTransfer(ticket)}
                                sx={{ flex: 1, minWidth: 0, borderRadius: '12px', borderColor: '#94A3B8', color: '#64748B' }}
                              >
                                <SendRounded />
                              </Button>
                            </Stack>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Collapse>
                </CardContent>
              </Card>
                )
              })()}
            </Grid>
          ))
        ) : (
          <Grid size={{ xs: 12 }}>
            <Typography color="text.secondary">
              {grouped.length
                ? 'Não há ingressos nesta aba.'
                : 'Você ainda não tem ingressos.'}
            </Typography>
          </Grid>
        )}
      </Grid>
      )}

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
            <PhoneWithCountryField
              countryIso2={transferForm.countryIso2}
              phone={transferForm.phone}
              onCountryChange={(value) => setTransferForm((prev) => ({ ...prev, countryIso2: value }))}
              onPhoneChange={(value) => setTransferForm((prev) => ({ ...prev, phone: value }))}
              label="Telefone do destinatário"
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
              <Box
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 2,
                  bgcolor: 'grey.50',
                  textAlign: 'center',
                }}
              >
                <ConfirmationNumberRounded sx={{ fontSize: 40, color: '#6d4ce7' }} />
                <Typography fontWeight={700} sx={{ mt: 1 }}>
                  Ingresso transferido com sucesso!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Código para compartilhar: {transferCode}
                </Typography>
                <Button
                  sx={{ mt: 1.5 }}
                  variant="contained"
                  onClick={() => {
                    setSelectedTicket(null)
                    setTab('TRANSFERRED')
                  }}
                >
                  Ver ingressos transferidos
                </Button>
              </Box>
            ) : null}
            <Button variant="contained" onClick={handleTransfer}>
              Enviar transferência
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(qrTicket)}
        onClose={() => setQrTicket(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px' } }}
      >
        <DialogTitle sx={{ pr: 6, pt: 2.2, textAlign: 'center', fontWeight: 700, fontSize: { xs: '1.45rem', sm: '1.65rem' } }}>
          QR Code do ingresso
          <IconButton
            onClick={() => setQrTicket(null)}
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0.5 }}>
          <Stack spacing={1.6} alignItems="center" sx={{ pb: 1.2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontSize: { xs: '0.95rem', sm: '1rem' } }}>
              Apresente este QR code ao validador para ter acesso ao evento.
            </Typography>

            <Box
              sx={{
                width: '100%',
                borderRadius: '10px',
                border: '1px solid #B0BEC5',
                bgcolor: '#EAF0F5',
                px: 1.2,
                py: 0.8,
              }}
            >
              <Stack direction="row" spacing={0.8} justifyContent="center" alignItems="center">
                <InfoRounded sx={{ color: '#1E4D72', fontSize: 16 }} />
                <Typography sx={{ fontSize: '0.82rem', color: '#1E4D72', fontWeight: 600 }}>
                  Agilize sua entrada no evento.
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: '#1E4D72', fontWeight: 700 }}>
                  Fazer cadastro facial
                </Typography>
              </Stack>
            </Box>

            <Box
              sx={{
                width: 214,
                height: 214,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#fff',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
              }}
            >
              {qrLoading ? (
                <Typography color="text.secondary">Gerando QR Code...</Typography>
              ) : qrImage ? (
                <Box component="img" src={qrImage} alt="QR Code" sx={{ width: 190, height: 190 }} />
              ) : (
                <Typography color="text.secondary">Não foi possível gerar o QR Code.</Typography>
              )}
            </Box>

            {qrTicket ? (
              <Stack spacing={0.5} alignItems="center">
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Typography sx={{ fontSize: { xs: '1rem', sm: '1.08rem' } }}>
                    Tipo de ingresso: <strong>{qrTicket.type}</strong>
                  </Typography>
                  <Chip
                    size="small"
                    label={getUseLabel(qrTicket).label}
                    color={getUseLabel(qrTicket).color}
                    sx={{ height: 22, fontSize: '0.76rem' }}
                  />
                </Stack>
              </Stack>
            ) : null}

            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
              <Button
                variant="outlined"
                onClick={() => qrTicket && handleDownloadTicket(qrTicket)}
                sx={{ flex: 1, minWidth: 0, borderRadius: '10px', borderColor: '#94A3B8', color: '#64748B' }}
              >
                <DownloadRounded />
              </Button>
              <Button
                variant="outlined"
                onClick={() => qrTicket && handleOpenGoogleWallet(qrTicket)}
                sx={{ flex: 1, minWidth: 0, borderRadius: '10px', borderColor: '#94A3B8', color: '#64748B' }}
              >
                <WorkOutlineRounded />
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  if (!qrTicket || !canTransfer(qrTicket)) return
                  setQrTicket(null)
                  openTransfer(qrTicket)
                }}
                disabled={!qrTicket || !canTransfer(qrTicket)}
                sx={{ flex: 1, minWidth: 0, borderRadius: '10px', borderColor: '#94A3B8', color: '#64748B' }}
              >
                <SendRounded />
              </Button>
            </Stack>

            <Button
              fullWidth
              variant="contained"
              startIcon={<CloseRounded />}
              onClick={() => setQrTicket(null)}
              sx={{
                mt: 0.4,
                borderRadius: '10px',
                py: 1,
                fontWeight: 700,
                background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)',
                '&:hover': { background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)', opacity: 0.95 },
              }}
            >
              Fechar
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  )
}

export default MyTicketsPage
