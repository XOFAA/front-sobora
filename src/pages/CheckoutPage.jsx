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
import { useLocation, useNavigate } from 'react-router-dom'
import { createOrder } from '../services/orders'
import { useAuth } from '../contexts/AuthContext'

const STEPS = ['Ingressos', 'Dados', 'Pagamento', 'Confirmacao']

function formatPrice(value) {
  return ((value ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function StepHeader({ currentStep }) {
  return (
    <Stack direction="row" justifyContent="center" spacing={{ xs: 1, md: 3 }} sx={{ py: 1 }}>
      {STEPS.map((label, index) => {
        const active = index === currentStep
        const done = index < currentStep
        return (
          <Stack key={label} spacing={0.6} alignItems="center" sx={{ minWidth: { xs: 62, md: 90 } }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
                fontWeight: 700,
                bgcolor: active || done ? '#6D4CE7' : '#E5E7EB',
                color: active || done ? '#fff' : '#94A3B8',
              }}
            >
              {index + 1}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: active ? 700 : 500,
                color: active ? '#6D4CE7' : '#94A3B8',
              }}
            >
              {label}
            </Typography>
          </Stack>
        )
      })}
    </Stack>
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

  const organizerName =
    event?.organizer?.name ||
    event?.organizerName ||
    'Organizador do evento'
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
      <Card elevation={0} sx={{ borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        <CardContent sx={{ py: 1.2 }}>
          <StepHeader currentStep={step} />
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" fontWeight={700}>
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
              <Typography variant="h6" fontWeight={700} sx={{ color: '#6D4CE7' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.6 }}>
                            Acesso ao setor conforme disponibilidade do evento.
                          </Typography>
                        </Box>
                        <Typography fontWeight={700} sx={{ color: '#6D4CE7' }}>
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
                          <Typography variant="caption" sx={{ color: '#C2410C', fontWeight: 700 }}>
                            Documentos aceitos:
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#7C2D12' }}>
                            {' '}Carteira de estudante, ID Jovem, 60+ ou laudo médico (PCD)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#7C2D12', display: 'block', mt: 0.4 }}>
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
                    severity="info"
                    sx={{ borderRadius: '10px', '& .MuiAlert-message': { fontSize: 12 } }}
                  >
                    Não é possível alterar as informações do comprador aqui. Atualizar perfil
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
                      onClick={() => navigate('/profile')}
                      sx={{ borderRadius: '10px' }}
                    >
                      Meu perfil
                    </Button>
                    <Button
                      variant="outlined"
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
                      <Typography variant="caption" sx={{ color: '#6D4CE7', fontWeight: 600 }}>
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
              <Typography variant="h6" fontWeight={700} sx={{ color: '#6D4CE7', mb: 1.2 }}>
                Informações do pedido
              </Typography>

              <Alert
                severity="info"
                icon={<InfoOutlined fontSize="inherit" />}
                sx={{ borderRadius: '10px', mb: 1.2, '& .MuiAlert-message': { fontSize: 12 } }}
              >
                <strong>Último lote!</strong> Restam poucos ingressos
              </Alert>

              {step === 0 || step === 3 ? (
                <Box sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', p: 1.2, mb: 1.4, bgcolor: '#F8FAFC' }}>
                  <Typography fontWeight={700} sx={{ color: '#6D4CE7', mb: 0.7 }}>
                    Informações importantes
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    • Classificação: 14 anos (menores apenas acompanhados dos pais)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    • Duração aproximada: 3 horas
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    • Estacionamento no local: R$ 80,00
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    • Acesso para pessoas com mobilidade reduzida
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    • Ingressos sujeitos à disponibilidade
                  </Typography>
                </Box>
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
                <Typography fontWeight={800} sx={{ color: '#6D4CE7' }}>{formatPrice(summary.total)}</Typography>
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
                    bgcolor: '#1F7A4D',
                    '&:hover': { bgcolor: '#19643F' },
                  }}
                >
                  {loading ? 'Processando...' : step === 2 ? 'Confirmar compra' : 'Continuar compra'}
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/tickets', { replace: true })}
                  sx={{ borderRadius: '10px', py: 1, fontWeight: 700 }}
                >
                  Meus ingressos
                </Button>
              )}

              <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ mt: 1.2 }}>
                <LockRounded sx={{ color: '#16A34A', fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: '#16A34A' }}>
                  Compra 100% segura
                </Typography>
              </Stack>

              {step === 3 ? (
                <Box sx={{ mt: 1.6, border: '1px solid #E2E8F0', borderRadius: '10px', p: 1.2 }}>
                  <Typography fontWeight={700} sx={{ mb: 0.8 }}>{organizerName}</Typography>
                  <Stack spacing={0.8}>
                    <Button
                      variant="outlined"
                      size="small"
                      component={organizerEmail ? 'a' : 'button'}
                      href={organizerEmail ? `mailto:${organizerEmail}` : undefined}
                      disabled={!organizerEmail}
                      sx={{ borderRadius: '10px' }}
                    >
                      Entrar em contato
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
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

      <Dialog open={resultOpen} onClose={() => {}} disableEscapeKeyDown maxWidth="sm" fullWidth>
        <DialogContent sx={{ py: 3 }}>
          <Stack spacing={1.6} alignItems="center">
            <Stack direction="row" spacing={0.6} alignItems="center">
              <Typography variant="h6" fontWeight={700}>Estamos processando sua compra</Typography>
              <Box sx={{ color: '#16A34A', display: 'grid', placeItems: 'center' }}>
                <CheckRounded fontSize="small" />
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary" align="center">
              Assim que o pagamento for confirmado, os seus ingressos estarão disponíveis para você.
            </Typography>
            <Button fullWidth variant="contained" onClick={() => navigate('/tickets', { replace: true })} sx={{ borderRadius: '10px' }}>
              Meus ingressos
            </Button>
            <Button fullWidth variant="outlined" onClick={() => navigate('/', { replace: true })} sx={{ borderRadius: '10px' }}>
              Voltar à página inicial
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  )
}

export default CheckoutPage
