import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { createOrder } from '../services/orders'
import { useAuth } from '../contexts/AuthContext'

const STEPS = ['Ingressos', 'Dados', 'Pagamento', 'Revisao']

function formatPrice(value) {
  return (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('credit')
  const [buyer, setBuyer] = useState({
    name: user?.name || '',
    email: user?.email || '',
    cpf: user?.cpf || '',
    phone: user?.phone || '',
  })
  const [card, setCard] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
    installments: '1',
  })

  const { items = [], event } = location.state || {}

  const summary = useMemo(() => {
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    return { total }
  }, [items])

  if (!items.length) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={700}>
          Nenhum ingresso selecionado
        </Typography>
        <Typography color="text.secondary">
          Volte ao evento e selecione os ingressos para continuar.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>Voltar</Button>
      </Stack>
    )
  }

  const goNext = () => setStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  const goBack = () => setStep((prev) => Math.max(prev - 1, 0))

  const handleConfirm = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const payload = items.map((item) => ({
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
      }))
      const data = await createOrder(payload)
      setSuccess(`Pedido criado com sucesso. ID: ${data?.order?.id || 'gerado'}.`)
      setStep(STEPS.length - 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao finalizar o pedido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Finalizar compra
        </Typography>
        <Typography color="text.secondary">
          {event?.name || 'Seu evento'}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {step === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Ingressos selecionados
            </Typography>
            <Stack spacing={2}>
              {items.map((item) => (
                <Stack key={item.ticketTypeId} direction="row" justifyContent="space-between">
                  <Box>
                    <Typography fontWeight={600}>{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quantidade: {item.quantity}
                    </Typography>
                  </Box>
                  <Typography fontWeight={700}>{formatPrice(item.price * item.quantity)}</Typography>
                </Stack>
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={600}>Total</Typography>
              <Typography fontWeight={700}>{formatPrice(summary.total)}</Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Dados do comprador
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Nome completo"
                value={buyer.name}
                onChange={(e) => setBuyer((prev) => ({ ...prev, name: e.target.value }))}
              />
              <TextField
                label="Email"
                value={buyer.email}
                onChange={(e) => setBuyer((prev) => ({ ...prev, email: e.target.value }))}
              />
              <TextField
                label="CPF"
                value={buyer.cpf}
                onChange={(e) => setBuyer((prev) => ({ ...prev, cpf: e.target.value }))}
              />
              <TextField
                label="Celular"
                value={buyer.phone}
                onChange={(e) => setBuyer((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </Stack>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Forma de pagamento
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <FormControlLabel value="credit" control={<Radio />} label="Cartao de credito" />
                <FormControlLabel value="debit" control={<Radio />} label="Cartao de debito" />
                <FormControlLabel value="pix" control={<Radio />} label="PIX" />
                <FormControlLabel value="boleto" control={<Radio />} label="Boleto bancario" />
              </RadioGroup>
            </FormControl>

            {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label="Nome no cartao"
                  value={card.name}
                  onChange={(e) => setCard((prev) => ({ ...prev, name: e.target.value }))}
                />
                <TextField
                  label="Numero do cartao"
                  value={card.number}
                  onChange={(e) => setCard((prev) => ({ ...prev, number: e.target.value }))}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Validade (MM/AA)"
                    value={card.expiry}
                    onChange={(e) => setCard((prev) => ({ ...prev, expiry: e.target.value }))}
                  />
                  <TextField
                    label="CVV"
                    value={card.cvv}
                    onChange={(e) => setCard((prev) => ({ ...prev, cvv: e.target.value }))}
                  />
                </Stack>
                {paymentMethod === 'credit' ? (
                  <TextField
                    label="Parcelas"
                    value={card.installments}
                    onChange={(e) => setCard((prev) => ({ ...prev, installments: e.target.value }))}
                  />
                ) : null}
              </Stack>
            )}

            {paymentMethod === 'pix' && (
              <Box sx={{ mt: 2 }}>
                <Typography color="text.secondary">
                  Ao confirmar, geraremos um QR Code PIX com validade de 15 minutos.
                </Typography>
              </Box>
            )}

            {paymentMethod === 'boleto' && (
              <Box sx={{ mt: 2 }}>
                <Typography color="text.secondary">
                  O boleto vence em 2 dias uteis. O ingresso sera liberado apos o pagamento.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Revisao
            </Typography>
            <Stack spacing={1}>
              <Typography fontWeight={600}>Evento</Typography>
              <Typography color="text.secondary">{event?.name || 'Seu evento'}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography fontWeight={600}>Total</Typography>
              <Typography color="text.secondary">{formatPrice(summary.total)}</Typography>
              <Typography fontWeight={600} sx={{ mt: 2 }}>
                Pagamento
              </Typography>
              <Typography color="text.secondary">
                {paymentMethod === 'credit' && 'Cartao de credito'}
                {paymentMethod === 'debit' && 'Cartao de debito'}
                {paymentMethod === 'pix' && 'PIX'}
                {paymentMethod === 'boleto' && 'Boleto'}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button variant="text" onClick={step === 0 ? () => navigate(-1) : goBack}>
          Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="contained" onClick={goNext}>
            Continuar
          </Button>
        ) : (
          <Button variant="contained" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Processando...' : 'Confirmar compra'}
          </Button>
        )}
      </Stack>
    </Stack>
  )
}

export default CheckoutPage
