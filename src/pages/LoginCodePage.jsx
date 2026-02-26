import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import OtpInput from '../components/auth/OtpInput'

const RESEND_SECONDS = 30

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
      setError('Digite o codigo de 6 digitos.')
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
      setSuccess('Codigo reenviado. Verifique seu email ou WhatsApp.')
      setResendLeft(RESEND_SECONDS)
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao reenviar codigo.')
    } finally {
      setResendingCode(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card sx={{ borderRadius: 4, boxShadow: '0 16px 44px rgba(16,24,40,0.12)' }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom textAlign="center">
                Validar <Box component="span" sx={{ color: '#5b3fc4' }}>Codigo</Box>
              </Typography>
              <Typography color="text.secondary" textAlign="center">
                Acabamos de enviar um codigo de validacao para <b>{identifierLabel || identifier || 'seu contato'}</b>.
                {' '}Por favor, digite o codigo abaixo:
              </Typography>
            </Box>

            <OtpInput length={6} value={code} onChange={setCode} />

            {error ? <Alert severity="error">{error}</Alert> : null}
            {success ? <Alert severity="success">{success}</Alert> : null}

            <Button
              variant="contained"
              onClick={handleLogin}
              disabled={loggingIn}
              sx={{ py: 1.1, fontSize: { xs: 18, sm: 22 }, fontWeight: 800, textTransform: 'none' }}
            >
              {loggingIn ? 'Validando...' : 'Validar Codigo'}
            </Button>
            <Divider />
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
              <Button
                variant="text"
                onClick={() => navigate('/login', { state: { from: { pathname: redirectTo, state: redirectState } } })}
              >
                Editar contato
              </Button>
              <Button variant="text" onClick={handleResend} disabled={resendLeft > 0 || resendingCode}>
                {resendLeft > 0 ? `Reenviar em ${resendLeft}s` : 'Reenviar codigo'}
              </Button>
            </Stack>
            <Typography textAlign="center" color="text.secondary" sx={{ pt: 1 }}>
              não tem mais acesso ao e-mail?
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}

export default LoginCodePage
