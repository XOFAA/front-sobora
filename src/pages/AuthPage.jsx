import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function AuthPage() {
  const { register, requestCode } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [identifier, setIdentifier] = useState('')
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRequestCode = async () => {
    setError('')
    setSuccess('')
    if (!identifier) {
      setError('Informe email, celular ou CPF.')
      return
    }
    try {
      await requestCode(identifier)
      sessionStorage.setItem('login_identifier', identifier)
      navigate('/login/code', { state: { identifier } })
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao enviar codigo.')
    }
  }

  const handleRegister = async () => {
    setError('')
    setSuccess('')
    if (!registerForm.name || !registerForm.email || !registerForm.cpf) {
      setError('Preencha nome, email e CPF.')
      return
    }
    try {
      await register(registerForm)
      setIdentifier(registerForm.email)
      setTab(0)
      setSuccess('Cadastro realizado. Solicite o codigo para entrar.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao cadastrar.')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Acesse sua conta
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Use email, celular ou CPF para entrar.
          </Typography>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
            <Tab label="Entrar" />
            <Tab label="Criar conta" />
          </Tabs>
          <Divider sx={{ mb: 3 }} />
          {tab === 0 ? (
            <Stack spacing={2}>
              <TextField
                label="Email, celular ou CPF"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}
              <Button variant="contained" onClick={handleRequestCode}>
                Enviar codigo
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <TextField
                label="Nome completo"
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <TextField
                label="Email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <TextField
                label="Celular"
                value={registerForm.phone}
                onChange={(e) =>
                  setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
              <TextField
                label="CPF"
                value={registerForm.cpf}
                onChange={(e) =>
                  setRegisterForm((prev) => ({ ...prev, cpf: e.target.value }))
                }
              />
              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}
              <Button variant="contained" onClick={handleRegister}>
                Criar conta
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

export default AuthPage
