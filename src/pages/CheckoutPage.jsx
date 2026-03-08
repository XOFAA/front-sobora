import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import CheckRounded from '@mui/icons-material/CheckRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import LocationOnRounded from '@mui/icons-material/LocationOnRounded'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import LockRounded from '@mui/icons-material/LockRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded'
import DownloadRounded from '@mui/icons-material/DownloadRounded'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import PersonRounded from '@mui/icons-material/PersonRounded'
import ConfirmationNumberRounded from '@mui/icons-material/ConfirmationNumberRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded'
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import { createOrder } from '../services/orders'
import { useAuth } from '../contexts/AuthContext'
import SecurityInfoSection from '../components/common/SecurityInfoSection'

const STEPS = ['Ingressos', 'Dados', 'Pagamento', 'Confirmação']
const FIGMA_GREEN_GRADIENT = 'linear-gradient(90deg, #34A853 0%, #315951 100%)'

function formatPrice(value) {
  return ((value ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function StepHeader({ currentStep }) {
  return (
    <Box sx={{ width: '100%', py: 0.5 }}>
      <Box
        sx={{
          width: 'fit-content',
          mx: 'auto',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: {
            xs: `repeat(${STEPS.length}, minmax(70px, 86px))`,
            sm: `repeat(${STEPS.length}, 120px)`,
            md: `repeat(${STEPS.length}, 150px)`,
          },
          justifyItems: 'center',
          alignItems: 'flex-start',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: { xs: 35, sm: 60, md: 75 },
            right: { xs: 35, sm: 60, md: 75 },
            top: { xs: 15, sm: 16 },
            height: 2,
            bgcolor: '#E5E7EB',
            zIndex: 0,
          }}
        />
        {STEPS.map((label, index) => {
          const active = index === currentStep
          const done = index < currentStep
          return (
            <Stack key={label} spacing={0.9} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
              <Box
                sx={{
                  width: { xs: 32, sm: 34 },
                  height: { xs: 32, sm: 34 },
                  borderRadius: '10px',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: { xs: 12, sm: 14 },
                
                  bgcolor: active || done ? '#6E51C5' : '#ECEFF3',
                  color: active || done ? '#FFFFFF' : '#A7AFB9',
                  lineHeight: 1,
                }}
              >
                {index + 1}
              </Box>
              <Typography
                sx={{
                  fontWeight: active ? 700 : 600,
                  color: active ? '#6E51C5' : '#A7AFB9',
                  fontSize: { xs: '0.72rem', sm: '0.74rem' },
                  lineHeight: 1.1,
                  textAlign: 'center',
                }}
              >
                {label}
              </Typography>
            </Stack>
          )
        })}
      </Box>
    </Box>
  )
}

function PaymentMethodButton({ active, icon, label, onClick }) {
  return (
    <Button
      onClick={onClick}
      variant="outlined"
      startIcon={icon}
      sx={{
        minWidth: 0,
        flex: 1,
        borderRadius: '10px',
        py: 1.1,
        borderColor: active ? '#6D4CE7' : '#CBD5E1',
        bgcolor: active ? '#6D4CE7' : '#fff',
        color: active ? '#fff' : '#475569',
        '&:hover': {
          borderColor: active ? '#6D4CE7' : '#94A3B8',
          bgcolor: active ? '#6445d9' : '#F8FAFC',
        },
      }}
    >
      {label}
    </Button>
  )
}

function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponFeedback, setCouponFeedback] = useState('')
  const [resultOpen, setResultOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('credit')

  const [card, setCard] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holderName: '',
    holderCpf: '',
    installments: '1',
    saveCard: false,
  })

  const { items = [], event } = location.state || {}

  const summary = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const serviceFee = 0
    const discount = 0
    const total = Math.max(0, subtotal + serviceFee - discount)
    const quantity = items.reduce((acc, item) => acc + item.quantity, 0)
    return { subtotal, serviceFee, discount, total, quantity }
  }, [items])

  const eventDateLabel = event?.dateRange || event?.dateLabel || 'Data a definir'
  const eventLocationLabel = event?.location || 'Local a definir'
  const importantInfoItems = useMemo(() => {
    const raw = String(event?.importantInfo || '')
    return raw
      .split(/\r?\n/g)
      .map((item) => item.trim())
      .filter(Boolean)
  }, [event?.importantInfo])

  const organizerName =
    event?.organizer?.name ||
    event?.organizerName ||
    'Organizador do evento'
  const organizerLogo =
    event?.organizer?.logoUrl ||
    event?.organizerLogo ||
    ''
  const organizerTenantId = event?.organizer?.tenantId || event?.organizerTenantId || ''
  const organizerEmail = event?.organizer?.email || event?.organizerEmail || ''

  const pixCode = '00020126580014BR.GOV.BCB.PIX0136123456789015204000053039865406350.005802BR5920SOBORA EVENTOS LTDA6009SAO PAULO62070503***6304ABCD'
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}`

  if (!items.length) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={700}>
          Nenhum ingresso selecionado
        </Typography>
        <Typography color="text.secondary">
          Volte ao evento e selecione os ingressos para continuar.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Voltar
        </Button>
      </Stack>
    )
  }

  const goNext = () => setStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  const goBack = () => setStep((prev) => Math.max(prev - 1, 0))

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponFeedback('Digite um cupom para aplicar.')
      return
    }
    setCouponFeedback('Cupom será validado na confirmação da compra.')
  }

  const handleConfirmOrder = async () => {
    setError('')
    setLoading(true)
    try {
      const payload = items.map((item) => ({
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
        isHalf: item.isHalf,
      }))
      await createOrder({
        items: payload,
        couponCode: couponCode.trim() || undefined,
      })
      setStep(3)
      setResultOpen(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao finalizar o pedido.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrimaryAction = async () => {
    if (step < 2) {
      goNext()
      return
    }
    if (step === 2) {
      await handleConfirmOrder()
      return
    }
    navigate('/tickets', { replace: true })
  }

  const mainTitleByStep = {
    0: 'Ingressos selecionados',
    1: 'Informações do comprador',
    2: 'Forma de pagamento',
    3: 'Ingressos selecionados',
  }

  return (
    <Stack spacing={2.2} sx={{ pb: { xs: 2, md: 3 } }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          position: { xs: 'sticky', md: 'static' },
          top: { xs: 70, md: 'auto' },
          zIndex: { xs: 1090, md: 'auto' },
          backgroundColor: { xs: 'rgba(255,255,255,0.95)', md: '#fff' },
          backdropFilter: { xs: 'blur(6px)', md: 'none' },
        }}
      >
        <CardContent
          sx={{
            px: { xs: 1.2, md: 2 },
            py: 1.2,
            minHeight: 96,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            '&:last-child': { pb: 1.2 },
          }}
        >
          <StepHeader currentStep={step} />
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 0 }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="h4" fontWeight={700} sx={{ width: '100%' }}>
              {event?.name || 'Seu evento'}
            </Typography>
            <Chip
              label={event?.statusLabel || 'Disponível'}
              sx={{
                borderRadius: '10px',
                bgcolor: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #86EFAC',
                fontWeight: 700,
                alignSelf: { xs: 'flex-start', sm: 'center' },
              }}
            />
          </Stack>
          <Stack spacing={0.8} sx={{ mt: 0.8 }}>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <CalendarMonthRounded fontSize="small" sx={{ color: '#94A3B8' }} />
              <Typography variant="body2" color="text.secondary">
                {eventDateLabel}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <LocationOnRounded fontSize="small" sx={{ color: '#94A3B8' }} />
              <Typography variant="body2" color="text.secondary">
                {eventLocationLabel}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={0} sx={{ borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#6E51C5' }}>
                {mainTitleByStep[step]}
              </Typography>
              <Divider sx={{ my: 1.5 }} />

              {step === 0 || step === 3 ? (
                <Stack spacing={1.3}>
                  {items.map((item) => (
                    <Box
                      key={item.ticketTypeId}
                      sx={{
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        p: 1.4,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography fontWeight={700}>{item.name}</Typography>
                          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.3 }}>
                            <CalendarMonthRounded sx={{ fontSize: 14, color: '#94A3B8' }} />
                            <Typography variant="caption" color="text.secondary">
                              {eventDateLabel}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Quantidade: {item.quantity}
                          </Typography>
                          {item.description ? (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.6, whiteSpace: 'pre-line' }}
                            >
                              {item.description}
                            </Typography>
                          ) : null}
                     
                        </Box>
                        <Typography fontWeight={700} sx={{ color: '#6E51C5' }}>
                          {formatPrice(item.price * item.quantity)}
                        </Typography>
                      </Stack>

                      {item.isHalf ? (
                        <Box
                          sx={{
                            mt: 1,
                            p: 1,
                            borderRadius: '10px',
                            border: '1px solid #FCD34D',
                            bgcolor: '#FFF7E6',
                          }}
                        >
                         <Typography fontWeight={700} sx={{ mb: 0.5, color: '#FF9800' }}>
                        Documentos aceitos: <span style={{color:"#000",fontSize:'15px',fontWeight:"400"}}>Carteira de estudante, ID Jovem, 60+ ou laudo médico (PCD)</span>
                      </Typography>
                         <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                              *Apresentação obrigatória na entrada
                                            </Typography>
                        </Box>
                      ) : null}
                    </Box>
                  ))}

                  {step === 0 ? (
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackRounded />}
                      onClick={() => navigate(`/events/${event?.id || ''}`)}
                      sx={{ alignSelf: 'flex-start', borderRadius: '10px' }}
                    >
                      Voltar à página do evento
                    </Button>
                  ) : step === 3 ? (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignSelf: 'flex-start' }}>
                      <Button
                        variant="contained"
                        startIcon={<ConfirmationNumberRounded />}
                        onClick={() => navigate('/tickets', { replace: true })}
                        sx={{ borderRadius: '10px' }}
                      >
                        Meus ingressos
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ArrowBackRounded />}
                        onClick={() => navigate('/', { replace: true })}
                        sx={{ borderRadius: '10px' }}
                      >
                        Voltar à página inicial
                      </Button>
                    </Stack>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackRounded />}
                      onClick={() => navigate('/', { replace: true })}
                      sx={{ alignSelf: 'flex-start', borderRadius: '10px' }}
                    >
                      Voltar à página inicial
                    </Button>
                  )}
                </Stack>
              ) : null}

              {step === 1 ? (
                <Stack spacing={1.4}>
                  <Alert
                    icon={<InfoOutlined fontSize="small" />}
                    sx={{
                      borderRadius: '10px',
                      bgcolor: 'rgba(255, 152, 0, 0.12)',
                      color: '#000',
                      border: '1px solid rgba(255, 152, 0, 0.30)',
                      '& .MuiAlert-icon': { color: '#FF9800' },
                      '& .MuiAlert-message': {
                        fontSize: 12,
                        color: '#000',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 0.5,
                      },
                    }}
                  >
                    Não é possível alterar as informações do comprador aqui.
                    <Box
                      component="span"
                      onClick={() => navigate('/profile')}
                      sx={{ fontWeight: 700, cursor: 'pointer', color: '#FF9800' }}
                    >
                      Atualizar perfil
                    </Box>
                  </Alert>
                  <Stack spacing={1.2}>
                    <Typography variant="body2"><strong>Nome completo:</strong> {user?.name || '-'}</Typography>
                    <Typography variant="body2"><strong>E-mail:</strong> {user?.email || '-'}</Typography>
                    <Typography variant="body2"><strong>Telefone:</strong> {user?.phone || '-'}</Typography>
                    <Typography variant="body2"><strong>CPF:</strong> {user?.cpf || '-'}</Typography>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      variant="contained"
                      startIcon={<PersonRounded />}
                      onClick={() => navigate('/profile')}
                      sx={{ borderRadius: '10px' }}
                    >
                      Meu perfil
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackRounded />}
                      onClick={goBack}
                      sx={{ borderRadius: '10px' }}
                    >
                      Voltar à página anterior
                    </Button>
                  </Stack>
                </Stack>
              ) : null}

              {step === 2 ? (
                <Stack spacing={1.4}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <PaymentMethodButton
                      active={paymentMethod === 'credit'}
                      icon={<CreditCardRounded />}
                      label="Cartão de crédito"
                      onClick={() => setPaymentMethod('credit')}
                    />
                    <PaymentMethodButton
                      active={paymentMethod === 'debit'}
                      icon={<CreditCardRounded />}
                      label="Cartão de débito"
                      onClick={() => setPaymentMethod('debit')}
                    />
                    <PaymentMethodButton
                      active={paymentMethod === 'pix'}
                      icon={<QrCode2Rounded />}
                      label="PIX"
                      onClick={() => setPaymentMethod('pix')}
                    />
                    <PaymentMethodButton
                      active={paymentMethod === 'boleto'}
                      icon={<ReceiptLongRounded />}
                      label="Boleto"
                      onClick={() => setPaymentMethod('boleto')}
                    />
                  </Stack>

                  {(paymentMethod === 'credit' || paymentMethod === 'debit') ? (
                    <Box sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', p: 1.4 }}>
                      <Stack direction="row" spacing={1.2} sx={{ mb: 1 }}>
                        <Typography fontWeight={700} color="#475569">VISA</Typography>
                        <Typography fontWeight={700} color="#64748B">elo</Typography>
                        <Typography fontWeight={700} color="#64748B">master</Typography>
                      </Stack>
                      <Stack spacing={1}>
                        <TextField
                          size="small"
                          placeholder="Número do cartão"
                          value={card.number}
                          onChange={(e) => setCard((prev) => ({ ...prev, number: e.target.value }))}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <TextField
                            size="small"
                            placeholder="Validade"
                            value={card.expiry}
                            onChange={(e) => setCard((prev) => ({ ...prev, expiry: e.target.value }))}
                          />
                          <TextField
                            size="small"
                            placeholder="CVV"
                            value={card.cvv}
                            onChange={(e) => setCard((prev) => ({ ...prev, cvv: e.target.value }))}
                          />
                        </Stack>
                        {paymentMethod === 'credit' ? (
                          <TextField
                            size="small"
                            placeholder="Parcelamento"
                            value={card.installments}
                            onChange={(e) => setCard((prev) => ({ ...prev, installments: e.target.value }))}
                          />
                        ) : null}
                        <TextField
                          size="small"
                          placeholder="Nome, como está no cartão"
                          value={card.holderName}
                          onChange={(e) => setCard((prev) => ({ ...prev, holderName: e.target.value }))}
                        />
                        <TextField
                          size="small"
                          placeholder="CPF do titular do cartão"
                          value={card.holderCpf}
                          onChange={(e) => setCard((prev) => ({ ...prev, holderCpf: e.target.value }))}
                        />
                        <Stack direction="row" spacing={0.6} alignItems="center">
                          <input
                            id="save-card"
                            type="checkbox"
                            checked={card.saveCard}
                            onChange={(e) => setCard((prev) => ({ ...prev, saveCard: e.target.checked }))}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Salvar cartão para próximas compras
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  ) : null}

                  {paymentMethod === 'pix' ? (
                    <Stack spacing={1.2} alignItems="center" sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', p: 1.4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Escaneie o QR Code abaixo com seu aplicativo do banco:
                      </Typography>
                      <Box component="img" src={qrUrl} alt="QR Code PIX" sx={{ width: 170, height: 170, borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                      <Typography variant="caption" sx={{ color: '#6E51C5', fontWeight: 600 }}>
                        30:00 para expirar
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '10px', p: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pixCode}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => navigator.clipboard?.writeText(pixCode)}
                          sx={{ minWidth: 36, borderRadius: '10px' }}
                        >
                          <ContentCopyRounded fontSize="small" />
                        </Button>
                      </Stack>
                    </Stack>
                  ) : null}

                  {paymentMethod === 'boleto' ? (
                    <Stack spacing={1.2} sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', p: 1.4 }}>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Use o boleto e pague em qualquer banco ou lotérica:
                      </Typography>
                      <Box sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', p: 1.4, bgcolor: '#fff' }}>
                        <Typography sx={{ fontFamily: 'monospace', letterSpacing: 1.2, textAlign: 'center' }}>
                          || ||||| |||||| ||| |||| |||||| ||| |||||| |
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', p: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                          12345.67890 12345.678901 12345.678901 2 1234567890125
                        </Typography>
                        <Button size="small" onClick={() => {}} sx={{ minWidth: 36, borderRadius: '10px' }}>
                          <ContentCopyRounded fontSize="small" />
                        </Button>
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button
                          variant="contained"
                          startIcon={<DownloadRounded />}
                          sx={{ borderRadius: '10px' }}
                        >
                          Baixar boleto
                        </Button>
                        <Button variant="outlined" onClick={goBack} sx={{ borderRadius: '10px' }}>
                          Voltar à página anterior
                        </Button>
                      </Stack>
                    </Stack>
                  ) : null}

                  {(paymentMethod === 'credit' || paymentMethod === 'debit' || paymentMethod === 'pix') ? (
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackRounded />}
                      onClick={goBack}
                      sx={{ alignSelf: 'flex-start', borderRadius: '10px' }}
                    >
                      Voltar à página anterior
                    </Button>
                  ) : null}
                </Stack>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ borderRadius: '10px', border: '1px solid #E2E8F0', position: { md: 'sticky' }, top: { md: 88 } }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#6E51C5', mb: 1.2 }}>
                Informações do pedido
              </Typography>
              <Divider sx={{ mb: 1.2 }} />

              {event?.lastBatchAlertEnabled ? (
                <Alert
                  severity="info"
                  icon={<InfoOutlined fontSize="inherit" />}
                  sx={{ borderRadius: '10px', mb: 1.2, '& .MuiAlert-message': { fontSize: 12 } }}
                >
                  <strong>Último lote!</strong> Restam poucos ingressos
                </Alert>
              ) : null}

              {step === 0 || step === 3 ? (
                importantInfoItems.length ? (
                <Box sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', p: 1.2, mb: 1.4, bgcolor: '#F8FAFC' }}>
                  <Typography fontWeight={700} sx={{ color: '#6E51C5', mb: 0.7 }}>
                    Informações importantes
                  </Typography>
                  {importantInfoItems.map((item, index) => (
                    <Typography key={`important-info-${index}`} variant="caption" color="text.secondary" component="div">
                      • {item}
                    </Typography>
                  ))}
                </Box>
                ) : null
              ) : null}

              {step === 0 ? (
                <Box sx={{ mb: 1.4 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.8 }}>
                    Cupom de desconto
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      placeholder="Digite seu cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      sx={{ flex: 1 }}
                    />
                    <Button variant="contained" onClick={handleApplyCoupon} sx={{ borderRadius: '10px' }}>
                      Aplicar
                    </Button>
                  </Stack>
                  {couponFeedback ? (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {couponFeedback}
                    </Typography>
                  ) : null}
                </Box>
              ) : null}

              <Stack spacing={0.8}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body2">{formatPrice(summary.subtotal)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Taxa de serviço (10%)</Typography>
                  <Typography variant="body2">{formatPrice(summary.serviceFee)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Desconto</Typography>
                  <Typography variant="body2">- {formatPrice(summary.discount)}</Typography>
                </Stack>
              </Stack>

              <Divider sx={{ my: 1.2 }} />

              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Quantidade de ingressos:</Typography>
                <Typography variant="body2" fontWeight={600}>{summary.quantity}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.4 }}>
                <Typography fontWeight={700}>{step === 3 ? 'Total pago:' : 'Total a pagar:'}</Typography>
                <Typography fontWeight={800} sx={{ color: '#6E51C5' }}>{formatPrice(summary.total)}</Typography>
              </Stack>

              {error ? <Alert severity="error" sx={{ mb: 1.2, borderRadius: '10px' }}>{error}</Alert> : null}

              {step < 3 ? (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handlePrimaryAction}
                  disabled={loading}
                  sx={{
                    borderRadius: '10px',
                    py: 1,
                    fontWeight: 700,
                    background: FIGMA_GREEN_GRADIENT,
                    boxShadow: '0 12px 24px rgba(52, 168, 83, 0.22)',
                    '&:hover': {
                      opacity: 0.93,
                      boxShadow: '0 12px 24px rgba(52, 168, 83, 0.22)',
                    },
                  }}
                >
                  {loading ? 'Processando...' : step === 2 ? 'Finalizar compra' : 'Continuar compra'}
                </Button>
              ) : null}

              <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ mt: 1.2 }}>
                <LockRounded sx={{ color: '#16A34A', fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: '#16A34A' }}>
                  Compra 100% segura
                </Typography>
              </Stack>

              {step === 3 ? (
                <Box sx={{ mt: 1.6, border: '1px solid #E2E8F0', borderRadius: '10px', p: 1.2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    {organizerLogo ? (
                      <Box
                        component="img"
                        src={organizerLogo}
                        alt={organizerName}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '1px solid #E2E8F0',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '8px',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: '#EEF2FF',
                          color: '#6E51C5',
                          fontWeight: 700,
                          border: '1px solid #E2E8F0',
                          flexShrink: 0,
                        }}
                      >
                        {(organizerName || 'O').slice(0, 1).toUpperCase()}
                      </Box>
                    )}
                    <Typography fontWeight={700}>{organizerName}</Typography>
                  </Stack>
                  <Stack spacing={0.8}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<MailOutlineRounded />}
                      component={organizerEmail ? 'a' : 'button'}
                      href={organizerEmail ? `mailto:${organizerEmail}` : undefined}
                      disabled={!organizerEmail}
                      sx={{
                        borderRadius: '10px',
                        color: '#fff',
                        '&.Mui-disabled': { color: 'rgba(255,255,255,0.7)' },
                      }}
                    >
                      Entrar em contato
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<OpenInNewRounded />}
                      disabled={!organizerTenantId}
                      onClick={() => organizerTenantId && navigate(`/organizers/${organizerTenantId}`)}
                      sx={{ borderRadius: '10px' }}
                    >
                      Ver página do organizador
                    </Button>
                  </Stack>
                </Box>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <SecurityInfoSection />

      <Dialog
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogContent sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2.2, sm: 3.2 } }}>
          <Stack spacing={2} alignItems="center">
            <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="center">
              <Typography
                sx={{
                  fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem' },
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: '#2F3347',
                  textAlign: 'center',
                }}
              >
                Estamos processando sua compra!
              </Typography>
              <CheckRounded sx={{ color: '#22C55E', fontSize: { xs: 24, sm: 32 } }} />
            </Stack>
            <Typography
              sx={{
                fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                color: '#64748B',
                textAlign: 'center',
                maxWidth: 620,
              }}
            >
              Assim que o pagamento for confirmado, os seus ingressos estarão disponíveis para você!
            </Typography>
            <Button
              fullWidth
              variant="contained"
              startIcon={<ConfirmationNumberRounded />}
              onClick={() => navigate('/tickets', { replace: true })}
              sx={{
                mt: 0.3,
                borderRadius: '14px',
                height: { xs: 50, sm: 54 },
                fontSize: { xs: '1rem', sm: '1.06rem' },
                fontWeight: 700,
                background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)',
                boxShadow: 'none',
                '&:hover': {
                  background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)',
                  opacity: 0.95,
                  boxShadow: 'none',
                },
              }}
            >
              Meus ingressos
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CloseRounded />}
              onClick={() => setResultOpen(false)}
              sx={{
                borderRadius: '14px',
                height: { xs: 50, sm: 54 },
                fontSize: { xs: '1rem', sm: '1.06rem' },
                fontWeight: 700,
                borderColor: '#94A3B8',
                color: '#64748B',
                '&:hover': { borderColor: '#64748B', backgroundColor: '#F8FAFC' },
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

export default CheckoutPage

