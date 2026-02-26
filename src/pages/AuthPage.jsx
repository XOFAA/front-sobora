import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import PhoneIphoneRounded from '@mui/icons-material/PhoneIphoneRounded'
import EmailRounded from '@mui/icons-material/EmailRounded'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PhoneWithCountryField from '../components/inputs/PhoneWithCountryField'
import {
  buildLoginIdentifier,
  COUNTRY_OPTIONS,
  formatCpf,
  getIdentifierLabel,
  isValidCpfLength,
  onlyDigits,
  normalizePhoneNumber,
  validatePhoneLocalLength,
} from '../utils/contact'

function AuthPage() {
  const { register, requestCode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(0)
  const [loginMethod, setLoginMethod] = useState('phone')
  const [loginInput, setLoginInput] = useState({
    email: '',
    cpf: '',
    phone: '',
    countryIso2: 'BR',
  })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    countryIso2: 'BR',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [requestingCode, setRequestingCode] = useState(false)
  const [registering, setRegistering] = useState(false)
  const redirectState = useMemo(() => {
    if (location.state?.from?.state) return location.state.from.state
    try {
      return JSON.parse(sessionStorage.getItem('post_login_redirect_state') || 'null')
    } catch {
      return null
    }
  }, [location.state?.from?.state])
  const redirectTo = location.state?.from?.pathname || sessionStorage.getItem('post_login_redirect_to') || '/'

  useEffect(() => {
    if (!location.state?.from?.pathname) return
    sessionStorage.setItem('post_login_redirect_to', location.state.from.pathname)
    sessionStorage.setItem('post_login_redirect_state', JSON.stringify(location.state.from.state || null))
  }, [location.state?.from?.pathname, location.state?.from?.state])

  const handleRequestCode = async () => {
    if (requestingCode) return
    setError('')
    setSuccess('')

    if (loginMethod === 'phone' && !validatePhoneLocalLength(loginInput.phone, loginInput.countryIso2)) {
      const country = COUNTRY_OPTIONS.find((item) => item.iso2 === loginInput.countryIso2) || COUNTRY_OPTIONS[0]
      setError(`Telefone invalido para ${country.name}.`)
      return
    }
    if (loginMethod === 'cpf' && !isValidCpfLength(loginInput.cpf)) {
      setError('CPF invalido. Informe 11 digitos.')
      return
    }

    const identifier = buildLoginIdentifier(loginMethod, loginInput)
    const identifierLabel = getIdentifierLabel(loginMethod, loginInput)
    if (!identifier) {
      setError('Informe um identificador valido para entrar.')
      return
    }
    try {
      setRequestingCode(true)
      await requestCode(identifier)
      sessionStorage.setItem('login_identifier', identifier)
      sessionStorage.setItem('login_identifier_label', identifierLabel)
      navigate('/login/code', { state: { identifier, identifierLabel, redirectTo, redirectState } })
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao enviar codigo.')
    } finally {
      setRequestingCode(false)
    }
  }

  const handleRegister = async () => {
    if (registering) return
    setError('')
    setSuccess('')
    if (!validatePhoneLocalLength(registerForm.phone, registerForm.countryIso2)) {
      const country = COUNTRY_OPTIONS.find((item) => item.iso2 === registerForm.countryIso2) || COUNTRY_OPTIONS[0]
      setError(`Telefone invalido para ${country.name}.`)
      return
    }
    if (!isValidCpfLength(registerForm.cpf)) {
      setError('CPF invalido. Informe 11 digitos.')
      return
    }
    const payload = {
      name: registerForm.name.trim(),
      email: registerForm.email.trim(),
      cpf: onlyDigits(registerForm.cpf),
      phone: normalizePhoneNumber(registerForm.phone, registerForm.countryIso2),
    }
    if (!payload.name || !payload.email || !payload.cpf || !payload.phone) {
      setError('Preencha nome, email, telefone e CPF.')
      return
    }
    try {
      setRegistering(true)
      await register(payload)
      const fallbackInput = {
        email: payload.email,
        cpf: payload.cpf,
        phone: registerForm.phone,
        countryIso2: registerForm.countryIso2,
      }
      const registerCodeMethod = 'email'
      const identifier = buildLoginIdentifier(registerCodeMethod, fallbackInput)
      const identifierLabel = getIdentifierLabel(registerCodeMethod, fallbackInput)
      await requestCode(identifier)
      setLoginMethod(registerCodeMethod)
      setLoginInput((prev) => ({
        ...prev,
        email: payload.email,
        cpf: payload.cpf,
        phone: registerForm.phone,
        countryIso2: registerForm.countryIso2,
      }))
      sessionStorage.setItem('login_identifier', identifier)
      sessionStorage.setItem('login_identifier_label', identifierLabel)
      navigate('/login/code', { state: { identifier, identifierLabel, redirectTo, redirectState } })
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao cadastrar.')
    } finally {
      setRegistering(false)
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
            Escolha como deseja entrar e informe o dado correspondente.
          </Typography>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
            <Tab label="Entrar" />
            <Tab label="Criar conta" />
          </Tabs>
          <Divider sx={{ mb: 3 }} />
          {tab === 0 ? (
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="login-method-label">Como deseja entrar</InputLabel>
                <Select
                  labelId="login-method-label"
                  value={loginMethod}
                  label="Como deseja entrar"
                  onChange={(event) => setLoginMethod(event.target.value)}
                >
                  <MenuItem value="phone">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneIphoneRounded fontSize="small" />
                      <Typography>Telefone</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="email">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EmailRounded fontSize="small" />
                      <Typography>Email</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="cpf">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BadgeRounded fontSize="small" />
                      <Typography>CPF</Typography>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
              {loginMethod === 'phone' ? (
                <PhoneWithCountryField
                  countryIso2={loginInput.countryIso2}
                  phone={loginInput.phone}
                  onCountryChange={(value) => setLoginInput((prev) => ({ ...prev, countryIso2: value }))}
                  onPhoneChange={(value) => setLoginInput((prev) => ({ ...prev, phone: value }))}
                  label="Telefone"
                />
              ) : null}
              {loginMethod === 'email' ? (
                <TextField
                  label="Email"
                  value={loginInput.email}
                  onChange={(e) => setLoginInput((prev) => ({ ...prev, email: e.target.value }))}
                  fullWidth
                />
              ) : null}
              {loginMethod === 'cpf' ? (
                <TextField
                  label="CPF"
                  value={formatCpf(loginInput.cpf)}
                  onChange={(e) => setLoginInput((prev) => ({ ...prev, cpf: onlyDigits(e.target.value) }))}
                  fullWidth
                />
              ) : null}
              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}
              <Button variant="contained" onClick={handleRequestCode} disabled={requestingCode}>
                {requestingCode ? 'Enviando...' : 'Enviar codigo'}
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
              <PhoneWithCountryField
                countryIso2={registerForm.countryIso2}
                phone={registerForm.phone}
                onCountryChange={(value) =>
                  setRegisterForm((prev) => ({ ...prev, countryIso2: value }))
                }
                onPhoneChange={(value) =>
                  setRegisterForm((prev) => ({ ...prev, phone: value }))
                }
                label="Telefone"
              />

              <TextField
                label="CPF"
                value={formatCpf(registerForm.cpf)}
                onChange={(e) =>
                  setRegisterForm((prev) => ({ ...prev, cpf: onlyDigits(e.target.value) }))
                }
              />
              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}
              <Button variant="contained" onClick={handleRegister} disabled={registering}>
                {registering ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

export default AuthPage
