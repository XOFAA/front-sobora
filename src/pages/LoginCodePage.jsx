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

const RESEND_SECONDS = 60

function LoginCodePage() {
  const { login, requestCode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendLeft, setResendLeft] = useState(RESEND_SECONDS)

  useEffect(() => {
    const fromState = location.state?.identifier
    const fromStorage = sessionStorage.getItem('login_identifier')
    if (fromState) {
      setIdentifier(fromState)
      sessionStorage.setItem('login_identifier', fromState)
    } else if (fromStorage) {
      setIdentifier(fromStorage)
    }
  }, [location.state])

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
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Digite o codigo
              </Typography>
              <Typography color="text.secondary">
                Enviamos um codigo de 6 digitos para {identifier || 'seu contato'}.
              </Typography>
            </Box>

            <OtpInput length={6} value={code} onChange={setCode} />

            {error ? <Alert severity="error">{error}</Alert> : null}
            {success ? <Alert severity="success">{success}</Alert> : null}

            <Button variant="contained" onClick={handleLogin}>
              Entrar
            </Button>
            <Divider />
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button variant="text" onClick={() => navigate('/login')}>
                Editar contato
              </Button>
              <Button variant="text" onClick={handleResend} disabled={resendLeft > 0}>
                {resendLeft > 0 ? `Reenviar em ${resendLeft}s` : 'Reenviar codigo'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}

export default LoginCodePage
