import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import CheckRounded from '@mui/icons-material/CheckRounded'
import AccessTimeFilledRounded from '@mui/icons-material/AccessTimeFilledRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import ForwardToInboxRounded from '@mui/icons-material/ForwardToInboxRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import OtpInput from '../components/auth/OtpInput'

const RESEND_SECONDS = 30

function LeftPanel() {
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'block' },
        bgcolor: '#5b45b2',
        background: 'linear-gradient(180deg, #6d4ce7 0%, #4a3b89 100%)',
        color: '#fff',
        p: { xs: 3, md: 4 },
        height: '100%',
      }}
    >
      <Stack spacing={2.5}>
        <Box component="img" src="/assets/sobora-logo.svg" alt="Sobora" sx={{ width: 160 }} />
        <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.25, maxWidth: 360 }}>
          Bem-vindo ao melhor marketplace de eventos culturais do Brasil
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.86)', maxWidth: 380 }}>
          Compre ingressos para os melhores shows, peças de teatro e eventos educativos, ou venda seus próprios eventos para milhares de pessoas.
        </Typography>
        <Stack spacing={1.6} sx={{ pt: 0.8 }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <CheckRounded sx={{ fontSize: 18 }} />
            <Typography>Compra 100% segura com recursos antifraude</Typography>
          </Stack>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <CheckRounded sx={{ fontSize: 18 }} />
            <Typography>Parcele a compra de seus ingressos em até 12x*</Typography>
          </Stack>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <CheckRounded sx={{ fontSize: 18 }} />
            <Typography>Canais de suporte disponíveis 24 horas</Typography>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

function LoginCodePage() {
  const { login, requestCode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier] = useState(() => {
    return location.state?.identifier || sessionStorage.getItem('login_identifier') || ''
  })
  const [identifierLabel] = useState(() => {
    return location.state?.identifierLabel || sessionStorage.getItem('login_identifier_label') || ''
  })
  const [redirectTo] = useState(() => {
    return location.state?.redirectTo || sessionStorage.getItem('post_login_redirect_to') || '/'
  })
  const [redirectState] = useState(() => {
    if (location.state?.redirectState) return location.state.redirectState
    try {
      return JSON.parse(sessionStorage.getItem('post_login_redirect_state') || 'null')
    } catch {
      return null
    }
  })
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendLeft, setResendLeft] = useState(RESEND_SECONDS)
  const [loggingIn, setLoggingIn] = useState(false)
  const [resendingCode, setResendingCode] = useState(false)
  const lastAutoSubmittedCodeRef = useRef('')

  useEffect(() => {
    if (location.state?.identifier) {
      sessionStorage.setItem('login_identifier', location.state.identifier)
    }
    if (location.state?.identifierLabel) {
      sessionStorage.setItem('login_identifier_label', location.state.identifierLabel)
    }
    if (location.state?.redirectTo) {
      sessionStorage.setItem('post_login_redirect_to', location.state.redirectTo)
    }
    if (location.state?.redirectState) {
      sessionStorage.setItem('post_login_redirect_state', JSON.stringify(location.state.redirectState))
    }
  }, [location.state?.identifier, location.state?.identifierLabel, location.state?.redirectTo, location.state?.redirectState])

  useEffect(() => {
    if (resendLeft <= 0) return undefined
    const timer = setInterval(() => {
      setResendLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendLeft])

  const handleLogin = async () => {
    if (loggingIn) return
    setError('')
    setSuccess('')
    if (code.length < 6) {
      setError('Digite o código de 6 dígitos.')
      return
    }
    try {
      setLoggingIn(true)
      await login(identifier, code)
      sessionStorage.removeItem('login_identifier')
      sessionStorage.removeItem('login_identifier_label')
      sessionStorage.removeItem('post_login_redirect_to')
      sessionStorage.removeItem('post_login_redirect_state')
      navigate(redirectTo || '/', { replace: true, state: redirectState || undefined })
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao entrar.')
    } finally {
      setLoggingIn(false)
    }
  }

  useEffect(() => {
    const cleanCode = String(code || '').replace(/\D/g, '')
    if (cleanCode.length !== 6) return
    if (!identifier || loggingIn) return
    if (lastAutoSubmittedCodeRef.current === cleanCode) return

    lastAutoSubmittedCodeRef.current = cleanCode
    handleLogin()
  }, [code, identifier, loggingIn])

  const handleResend = async () => {
    if (resendingCode) return
    setError('')
    setSuccess('')
    if (!identifier) {
      setError('Volte e informe email, celular ou CPF.')
      return
    }
    try {
      setResendingCode(true)
      await requestCode(identifier)
      setSuccess('Código reenviado. Verifique seu e-mail ou WhatsApp.')
      setResendLeft(RESEND_SECONDS)
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao reenviar código.')
    } finally {
      setResendingCode(false)
    }
  }

  const timerLabel = `${String(Math.floor(resendLeft / 60)).padStart(2, '0')}:${String(resendLeft % 60).padStart(2, '0')}`

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Card sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 24px 44px rgba(15,23,42,0.16)' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.02fr 1fr' } }}>
          <LeftPanel />
          <Box sx={{ p: { xs: 2.2, md: 3.8 }, bgcolor: '#fff' }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={700}>Verificação em duas etapas 📩</Typography>
                <Typography color="text.secondary">
                  Por segurança, enviamos um código de verificação para o e-mail: <b>{identifierLabel || identifier || 'seu contato'}</b>
                </Typography>
              </Box>

              <Box sx={{
                '& .MuiInputBase-root': { borderRadius: '10px', bgcolor: '#f4f1fb' },
              }}>
                <OtpInput length={6} value={code} onChange={setCode} />
              </Box>

              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}

              <Button variant="contained" onClick={handleLogin} disabled={loggingIn} sx={{ borderRadius: '10px', py: 1.2 }}>
                {loggingIn ? 'Validando...' : 'Validar código'}
              </Button>

              <Stack direction="row" spacing={0.8} justifyContent="center" alignItems="center">
                <AccessTimeFilledRounded sx={{ fontSize: 16, color: '#6d4ce7' }} />
                <Typography sx={{ color: '#6d4ce7', fontWeight: 700 }}>{timerLabel}</Typography>
                <Typography color="text.secondary">para reenviar</Typography>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
                <Button variant="text" startIcon={<EditRounded />} onClick={() => navigate('/login', { state: { from: { pathname: redirectTo, state: redirectState } } })}>
                  Editar cadastro
                </Button>
                <Button variant="text" startIcon={<ForwardToInboxRounded />} onClick={handleResend} disabled={resendLeft > 0 || resendingCode}>
                  Reenviar código
                </Button>
              </Stack>

              <Button variant="outlined" onClick={() => navigate('/login')} startIcon={<ArrowBackRounded />} sx={{ borderRadius: '10px' }}>
                Voltar ao login
              </Button>
              <Divider />
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                <Typography color="text.secondary">Não tem mais acesso aos dados de cadastro?</Typography>
                <Button variant="text" sx={{ textTransform: 'none', fontWeight: 700 }}>Clique aqui</Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Card>
    </Container>
  )
}

export default LoginCodePage

