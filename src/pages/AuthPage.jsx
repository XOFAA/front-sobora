import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import PhoneIphoneRounded from '@mui/icons-material/PhoneIphoneRounded'
import EmailRounded from '@mui/icons-material/EmailRounded'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import PersonAddAlt1Rounded from '@mui/icons-material/PersonAddAlt1Rounded'
import LoginRounded from '@mui/icons-material/LoginRounded'
import StorefrontRounded from '@mui/icons-material/StorefrontRounded'
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

const authFieldSx = {
  '& .MuiInputBase-root': {
    borderRadius: '10px',
    backgroundColor: '#f4f1fb',
  },
}

const selectMenuItems = [
  { value: 'phone', label: 'Telefone', icon: <PhoneIphoneRounded fontSize="small" /> },
  { value: 'email', label: 'Email', icon: <EmailRounded fontSize="small" /> },
  { value: 'cpf', label: 'CPF', icon: <BadgeRounded fontSize="small" /> },
]

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

function AuthPage() {
  const { register, requestCode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(0)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
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
      setError(`Telefone inválido para ${country.name}.`)
      return
    }
    if (loginMethod === 'cpf' && !isValidCpfLength(loginInput.cpf)) {
      setError('CPF inválido. Informe 11 dígitos.')
      return
    }

    const identifier = buildLoginIdentifier(loginMethod, loginInput)
    const identifierLabel = getIdentifierLabel(loginMethod, loginInput)
    if (!identifier) {
      setError('Informe um identificador válido para entrar.')
      return
    }
    try {
      setRequestingCode(true)
      await requestCode(identifier)
      sessionStorage.setItem('login_identifier', identifier)
      sessionStorage.setItem('login_identifier_label', identifierLabel)
      navigate('/login/code', { state: { identifier, identifierLabel, redirectTo, redirectState } })
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao enviar código.')
    } finally {
      setRequestingCode(false)
    }
  }

  const handleRegister = async () => {
    if (registering) return
    setError('')
    setSuccess('')
    if (!acceptedTerms) {
      setError('Aceite os termos para continuar.')
      return
    }
    if (!validatePhoneLocalLength(registerForm.phone, registerForm.countryIso2)) {
      const country = COUNTRY_OPTIONS.find((item) => item.iso2 === registerForm.countryIso2) || COUNTRY_OPTIONS[0]
      setError(`Telefone inválido para ${country.name}.`)
      return
    }
    if (!isValidCpfLength(registerForm.cpf)) {
      setError('CPF inválido. Informe 11 dígitos.')
      return
    }
    const payload = {
      name: registerForm.name.trim(),
      email: registerForm.email.trim(),
      cpf: onlyDigits(registerForm.cpf),
      phone: normalizePhoneNumber(registerForm.phone, registerForm.countryIso2),
    }
    if (!payload.name || !payload.email || !payload.cpf || !payload.phone) {
      setError('Preencha nome, e-mail, telefone e CPF.')
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
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Card sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 24px 44px rgba(15,23,42,0.16)' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.02fr 1fr' } }}>
          <LeftPanel />
          <Box sx={{ p: { xs: 2.2, md: 3.8 }, bgcolor: '#fff' }}>
            <Stack spacing={2}>
              {tab === 0 ? (
                <>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>Que bom ter você por aqui! 👋</Typography>
                    <Typography color="text.secondary">Escolha como deseja entrar e informe o dado correspondente.</Typography>
                  </Box>
                  <FormControl fullWidth sx={authFieldSx}>
                    <InputLabel id="login-method-label">Como deseja entrar</InputLabel>
                    <Select
                      labelId="login-method-label"
                      value={loginMethod}
                      label="Como deseja entrar"
                      onChange={(event) => setLoginMethod(event.target.value)}
                    >
                      {selectMenuItems.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {item.icon}
                            <Typography>{item.label}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
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
                      label="E-mail"
                      value={loginInput.email}
                      sx={authFieldSx}
                      onChange={(e) => setLoginInput((prev) => ({ ...prev, email: e.target.value }))}
                      fullWidth
                    />
                  ) : null}
                  {loginMethod === 'cpf' ? (
                    <TextField
                      label="CPF"
                      value={formatCpf(loginInput.cpf)}
                      sx={authFieldSx}
                      onChange={(e) => setLoginInput((prev) => ({ ...prev, cpf: onlyDigits(e.target.value) }))}
                      fullWidth
                    />
                  ) : null}

                  {error ? <Alert severity="error">{error}</Alert> : null}
                  {success ? <Alert severity="success">{success}</Alert> : null}

                  <Button variant="contained" onClick={handleRequestCode} disabled={requestingCode} startIcon={<LoginRounded />} sx={{ borderRadius: '10px', py: 1.2 }}>
                    {requestingCode ? 'Enviando...' : 'Enviar código'}
                  </Button>

                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                    <Typography color="text.secondary">Não tem conta?</Typography>
                    <Button variant="text" onClick={() => setTab(1)} startIcon={<PersonAddAlt1Rounded />} sx={{ textTransform: 'none', fontWeight: 700 }}>
                      Criar conta
                    </Button>
                  </Stack>

                  <Button variant="outlined" onClick={() => navigate('/')} startIcon={<ArrowBackRounded />} sx={{ borderRadius: '10px' }}>
                    Voltar à página inicial
                  </Button>
                  <Divider />
                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" flexWrap="wrap">
                    <StorefrontRounded sx={{ fontSize: 18, color: '#6d4ce7' }} />
                    <Typography color="text.secondary">É organizador e quer criar um evento?</Typography>
                    <Button
                      component="a"
                      href="https://admsobora.indeias.com.br/login"
                      target="_blank"
                      rel="noreferrer"
                      variant="text"
                      sx={{ textTransform: 'none', fontWeight: 700, color: '#6d4ce7' }}
                    >
                      Faça o login aqui
                    </Button>
                  </Stack>
                </>
              ) : (
                <>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>Crie sua conta 😀</Typography>
                    <Typography color="text.secondary">Por favor, insira os dados abaixo para criar sua conta:</Typography>
                  </Box>

                  <TextField label="Nome completo" value={registerForm.name} sx={authFieldSx} onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))} />
                  <TextField label="E-mail" value={registerForm.email} sx={authFieldSx} onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))} />
                  <PhoneWithCountryField
                    countryIso2={registerForm.countryIso2}
                    phone={registerForm.phone}
                    onCountryChange={(value) => setRegisterForm((prev) => ({ ...prev, countryIso2: value }))}
                    onPhoneChange={(value) => setRegisterForm((prev) => ({ ...prev, phone: value }))}
                    label="Telefone"
                  />
                  <TextField label="CPF" value={formatCpf(registerForm.cpf)} sx={authFieldSx} onChange={(e) => setRegisterForm((prev) => ({ ...prev, cpf: onlyDigits(e.target.value) }))} />

                  <FormControlLabel
                    control={<Checkbox checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />}
                    label={<Typography variant="body2">Li e aceito os Termos de Uso e Política de Privacidade</Typography>}
                  />

                  {error ? <Alert severity="error">{error}</Alert> : null}
                  {success ? <Alert severity="success">{success}</Alert> : null}

                  <Button variant="contained" onClick={handleRegister} disabled={registering} startIcon={<PersonAddAlt1Rounded />} sx={{ borderRadius: '10px', py: 1.2 }}>
                    {registering ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                  <Button variant="outlined" onClick={() => setTab(0)} startIcon={<ArrowBackRounded />} sx={{ borderRadius: '10px' }}>
                    Voltar ao login
                  </Button>
                </>
              )}
            </Stack>
          </Box>
        </Box>
      </Card>
    </Container>
  )
}

export default AuthPage
