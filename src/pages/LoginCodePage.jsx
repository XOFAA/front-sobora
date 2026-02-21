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
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendLeft, setResendLeft] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (location.state?.identifier) {
      sessionStorage.setItem('login_identifier', location.state.identifier)
    }
    if (location.state?.identifierLabel) {
      sessionStorage.setItem('login_identifier_label', location.state.identifierLabel)
    }
  }, [location.state?.identifier, location.state?.identifierLabel])

  useEffect(() => {
    if (resendLeft <= 0) return undefined
    const timer = setInterval(() => {
      setResendLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendLeft])

  const handleLogin = async () => {
    setError('')
    setSuccess('')
    if (code.length < 6) {
      setError('Digite o codigo de 6 digitos.')
      return
    }
    try {
      await login(identifier, code)
      sessionStorage.removeItem('login_identifier')
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao entrar.')
    }
  }

  const handleResend = async () => {
    setError('')
    setSuccess('')
    if (!identifier) {
      setError('Volte e informe email, celular ou CPF.')
      return
    }
    try {
      await requestCode(identifier)
      setSuccess('Codigo reenviado. Verifique seu email ou WhatsApp.')
      setResendLeft(RESEND_SECONDS)
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao reenviar codigo.')
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
              sx={{ py: 1.1, fontSize: 26, fontWeight: 800, textTransform: 'none' }}
            >
              Validar Codigo
            </Button>
            <Divider />
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
              <Button variant="text" onClick={() => navigate('/login')}>
                Editar contato
              </Button>
              <Button variant="text" onClick={handleResend} disabled={resendLeft > 0}>
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
