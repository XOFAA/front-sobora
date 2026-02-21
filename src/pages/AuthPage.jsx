import { useState } from 'react'
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
import { useNavigate } from 'react-router-dom'
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
  const [tab, setTab] = useState(0)
  const [loginMethod, setLoginMethod] = useState('phone')
  const [loginInput, setLoginInput] = useState({
    email: '',
    cpf: '',
    phone: '',
    countryIso2: 'BR',
  })
  const [registerLoginMethod, setRegisterLoginMethod] = useState('phone')
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    countryIso2: 'BR',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRequestCode = async () => {
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
      await requestCode(identifier)
      sessionStorage.setItem('login_identifier', identifier)
      sessionStorage.setItem('login_identifier_label', identifierLabel)
      navigate('/login/code', { state: { identifier, identifierLabel } })
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao enviar codigo.')
    }
  }

  const handleRegister = async () => {
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
      await register(payload)
      const fallbackInput = {
        email: payload.email,
        cpf: payload.cpf,
        phone: registerForm.phone,
        countryIso2: registerForm.countryIso2,
      }
      const identifier = buildLoginIdentifier(registerLoginMethod, fallbackInput)
      const identifierLabel = getIdentifierLabel(registerLoginMethod, fallbackInput)
      await requestCode(identifier)
      setLoginMethod(registerLoginMethod)
      setLoginInput((prev) => ({
        ...prev,
        email: payload.email,
        cpf: payload.cpf,
        phone: registerForm.phone,
        countryIso2: registerForm.countryIso2,
      }))
      sessionStorage.setItem('login_identifier', identifier)
      sessionStorage.setItem('login_identifier_label', identifierLabel)
      navigate('/login/code', { state: { identifier, identifierLabel } })
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
              <FormControl fullWidth>
                <InputLabel id="register-login-method-label">Receber codigo por</InputLabel>
                <Select
                  labelId="register-login-method-label"
                  value={registerLoginMethod}
                  label="Receber codigo por"
                  onChange={(event) => setRegisterLoginMethod(event.target.value)}
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
      
              <TextField
                label="CPF"
                value={formatCpf(registerForm.cpf)}
                onChange={(e) =>
                  setRegisterForm((prev) => ({ ...prev, cpf: onlyDigits(e.target.value) }))
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
