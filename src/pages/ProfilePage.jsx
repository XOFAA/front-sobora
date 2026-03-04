import { useEffect, useMemo, useState } from 'react'
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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import PhoneIphoneRounded from '@mui/icons-material/PhoneIphoneRounded'
import EmailRounded from '@mui/icons-material/EmailRounded'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import DeleteRounded from '@mui/icons-material/DeleteRounded'
import CameraswitchRounded from '@mui/icons-material/CameraswitchRounded'
import InfoRounded from '@mui/icons-material/InfoRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import AccessTimeFilledRounded from '@mui/icons-material/AccessTimeFilledRounded'
import ForwardToInboxRounded from '@mui/icons-material/ForwardToInboxRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchFaceStatus } from '../services/face'
import PhoneWithCountryField from '../components/inputs/PhoneWithCountryField'
import OtpInput from '../components/auth/OtpInput'
import {
  COUNTRY_OPTIONS,
  formatCpf,
  isValidCpfLength,
  onlyDigits,
  normalizePhoneNumber,
  parseStoredPhone,
  validatePhoneLocalLength,
} from '../utils/contact'

const faceStatusMap = {
  VERIFIED: { label: 'Cadastrada', color: 'success' },
  FAILED: { label: 'Falhou', color: 'error' },
  DISABLED: { label: 'Desativada', color: 'default' },
  PENDING: { label: 'Pendente', color: 'warning' },
}
const PROFILE_UPDATE_CODE_SECONDS = 30

const fieldSx = {
  '& .MuiInputBase-root': {
    borderRadius: '10px',
    backgroundColor: '#f4f1fb',
  },
}

const faceDateLabel = (value) => {
  if (!value) return 'Sem atualizacao'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Sem atualização' : date.toLocaleString('pt-BR')
}

function ProfilePage() {
  const navigate = useNavigate()
  const { user, requestUpdateProfileCode, confirmUpdateProfile, reload } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    countryIso2: 'BR',
  })
  const [profileMethod, setProfileMethod] = useState('phone')
  const [faceInfo, setFaceInfo] = useState({ status: 'PENDING', updatedAt: null })
  const [faceModalOpen, setFaceModalOpen] = useState(false)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [updateSuccessModalOpen, setUpdateSuccessModalOpen] = useState(false)
  const [pendingProfilePayload, setPendingProfilePayload] = useState(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendingCode, setResendingCode] = useState(false)
  const [resendLeft, setResendLeft] = useState(0)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' })

  useEffect(() => {
    const parsedPhone = parseStoredPhone(user?.phone || '')
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: parsedPhone.localNumber,
      cpf: onlyDigits(user?.cpf || ''),
      countryIso2: parsedPhone.countryIso2,
    })
  }, [user])

  useEffect(() => {
    const loadFaceStatus = async () => {
      try {
        const data = await fetchFaceStatus()
        setFaceInfo({
          status: data?.status || 'PENDING',
          updatedAt: data?.updatedAt || data?.lastVerifiedAt || null,
        })
      } catch {
        setFaceInfo({ status: 'PENDING', updatedAt: null })
      }
    }
    loadFaceStatus()
  }, [])

  useEffect(() => {
    if (!verifyModalOpen || resendLeft <= 0) return undefined
    const timer = setInterval(() => {
      setResendLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [verifyModalOpen, resendLeft])

  const faceView = useMemo(() => {
    return faceStatusMap[faceInfo.status] || faceStatusMap.PENDING
  }, [faceInfo.status])

  const handleChange = (key) => (event) => {
    const value = key === 'cpf' ? onlyDigits(event.target.value) : event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setStatusMessage({ type: '', message: '' })
    if (!validatePhoneLocalLength(form.phone, form.countryIso2)) {
      const country = COUNTRY_OPTIONS.find((item) => item.iso2 === form.countryIso2) || COUNTRY_OPTIONS[0]
      setStatusMessage({ type: 'error', message: `Telefone inválido para ${country.name}.` })
      return
    }
    if (!isValidCpfLength(form.cpf)) {
      setStatusMessage({ type: 'error', message: 'CPF inválido. Informe 11 dígitos.' })
      return
    }
    try {
      setLoading(true)
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: normalizePhoneNumber(form.phone, form.countryIso2),
        cpf: onlyDigits(form.cpf),
      }
      const response = await requestUpdateProfileCode(payload)
      setPendingProfilePayload(payload)
      setVerifyCode('')
      setVerifyModalOpen(true)
      setResendLeft(response?.expiresInSeconds || PROFILE_UPDATE_CODE_SECONDS)
      setStatusMessage({ type: 'info', message: 'Código de confirmação enviado. Valide para concluir a atualização.' })
    } catch (err) {
      const backendMessage = err?.response?.data?.message || ''
      const waitMatch = String(backendMessage).match(/Aguarde\s+(\d+)s/i)
      if (waitMatch) {
        setPendingProfilePayload({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: normalizePhoneNumber(form.phone, form.countryIso2),
          cpf: onlyDigits(form.cpf),
        })
        setVerifyModalOpen(true)
        setResendLeft(Number(waitMatch[1] || PROFILE_UPDATE_CODE_SECONDS))
      }
      setStatusMessage({
        type: 'error',
        message: backendMessage || 'Falha ao atualizar cadastro.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmUpdate = async () => {
    if (verifyLoading) return
    setStatusMessage({ type: '', message: '' })
    if (verifyCode.length < 6) {
      setStatusMessage({ type: 'error', message: 'Digite o código de 6 dígitos.' })
      return
    }
    try {
      setVerifyLoading(true)
      await confirmUpdateProfile(verifyCode)
      await reload()
      setVerifyModalOpen(false)
      setUpdateSuccessModalOpen(true)
      setPendingProfilePayload(null)
      setVerifyCode('')
    } catch (err) {
      setStatusMessage({
        type: 'error',
        message: err?.response?.data?.message || 'Falha ao validar código.',
      })
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResendProfileCode = async () => {
    if (resendingCode || !pendingProfilePayload || resendLeft > 0) return
    setStatusMessage({ type: '', message: '' })
    try {
      setResendingCode(true)
      const response = await requestUpdateProfileCode(pendingProfilePayload)
      setResendLeft(response?.expiresInSeconds || PROFILE_UPDATE_CODE_SECONDS)
      setStatusMessage({ type: 'success', message: 'Código reenviado com sucesso.' })
    } catch (err) {
      setStatusMessage({
        type: 'error',
        message: err?.response?.data?.message || 'Falha ao reenviar código.',
      })
    } finally {
      setResendingCode(false)
    }
  }

  const resendTimerLabel = `${String(Math.floor(resendLeft / 60)).padStart(2, '0')}:${String(resendLeft % 60).padStart(2, '0')}`

  return (
    <Stack spacing={2.2}>
      <Card sx={{ borderRadius: '12px' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.2} alignItems={{ md: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight={700}>Meu perfil</Typography>
              <Typography color="text.secondary">Veja seus dados cadastrais e atualize sempre que necessário.</Typography>
            </Box>
         
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Stack spacing={1.6}>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#5f45da' }}>Dados cadastrais</Typography>
                <Divider />
                <FormControl fullWidth sx={fieldSx}>
                  <InputLabel id="profile-method-label">Preferência de login</InputLabel>
                  <Select
                    labelId="profile-method-label"
                    value={profileMethod}
                    label="Preferência de login"
                    onChange={(event) => setProfileMethod(event.target.value)}
                  >
                    <MenuItem value="phone"><Stack direction="row" spacing={1} alignItems="center"><PhoneIphoneRounded fontSize="small" /><Typography>Telefone</Typography></Stack></MenuItem>
                    <MenuItem value="email"><Stack direction="row" spacing={1} alignItems="center"><EmailRounded fontSize="small" /><Typography>E-mail</Typography></Stack></MenuItem>
                    <MenuItem value="cpf"><Stack direction="row" spacing={1} alignItems="center"><BadgeRounded fontSize="small" /><Typography>CPF</Typography></Stack></MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Nome completo" sx={fieldSx} value={form.name} onChange={handleChange('name')} />
                <TextField label="E-mail" sx={fieldSx} value={form.email} onChange={handleChange('email')} />
                <PhoneWithCountryField
                  countryIso2={form.countryIso2}
                  phone={form.phone}
                  onCountryChange={(value) => setForm((prev) => ({ ...prev, countryIso2: value }))}
                  onPhoneChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                  label="Telefone"
                />
                <TextField label="CPF" sx={fieldSx} value={formatCpf(form.cpf)} onChange={handleChange('cpf')} />
                {statusMessage.message ? <Alert severity={statusMessage.type || 'info'}>{statusMessage.message}</Alert> : null}
                <Button variant="contained" onClick={handleSave} disabled={loading} startIcon={<CheckRounded />} sx={{ borderRadius: '10px', py: 1.2 }}>
                  {loading ? 'Salvando...' : 'Atualizar dados'}
                </Button>
                <Button variant="outlined" color="error" startIcon={<DeleteRounded />} sx={{ borderRadius: '10px' }}>
                  Excluir perfil
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Stack spacing={1.6}>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#5f45da' }}>Reconhecimento facial</Typography>
                <Divider />
                <Card variant="outlined" sx={{ borderRadius: '10px' }}>
                  <CardContent>
                    <Stack spacing={1.2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={700}>Status atual</Typography>
                        <Chip label={faceView.label} color={faceView.color} size="small" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">Última atualização de dados:</Typography>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <CalendarMonthRounded fontSize="small" color="disabled" />
                        <Typography color="text.secondary">{faceDateLabel(faceInfo.updatedAt)}</Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
                <Button variant="contained" onClick={() => setFaceModalOpen(true)} startIcon={<CameraswitchRounded />} sx={{ borderRadius: '10px', py: 1.15 }}>
                  {faceInfo.status === 'VERIFIED' ? 'Refazer facial' : 'Cadastrar facial'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack spacing={1.8} alignItems="center">
            <Box component="img" src="/assets/logo-lilas.svg" alt="Sobora" sx={{ width: 190 }} />
            <Typography variant="h5" fontWeight={700} textAlign="center">Verificação em duas etapas 📩</Typography>
            <Typography textAlign="center" color="text.secondary" sx={{ maxWidth: 520 }}>
              Por segurança, enviamos um código de verificação para o e-mail {user?.email} e telefone {user?.phone}.
            </Typography>
            <Box sx={{ width: '100%' }}>
              <OtpInput length={6} value={verifyCode} onChange={setVerifyCode} />
            </Box>
            <Button
              variant="contained"
              fullWidth
              onClick={handleConfirmUpdate}
              disabled={verifyLoading}
              sx={{ borderRadius: '10px', py: 1.2 }}
            >
              {verifyLoading ? 'Validando...' : 'Validar código'}
            </Button>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <AccessTimeFilledRounded sx={{ fontSize: 16, color: '#6d4ce7' }} />
              <Typography sx={{ color: '#6d4ce7', fontWeight: 700 }}>{resendTimerLabel}</Typography>
              <Typography color="text.secondary">para reenviar</Typography>
            </Stack>
            <Button
              variant="text"
              startIcon={<ForwardToInboxRounded />}
              onClick={handleResendProfileCode}
              disabled={resendLeft > 0 || resendingCode}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Reenviar código
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ArrowBackRounded />}
              onClick={() => setVerifyModalOpen(false)}
              sx={{ borderRadius: '10px' }}
            >
              Voltar ao meu perfil
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={updateSuccessModalOpen} onClose={() => setUpdateSuccessModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack spacing={1.8} alignItems="center">
            <Box component="img" src="/assets/logo-lilas.svg" alt="Sobora" sx={{ width: 190 }} />
            <Typography variant="h5" fontWeight={700} textAlign="center">Dados atualizados com sucesso! ✅</Typography>
            <Typography textAlign="center" color="text.secondary">
              É muito importante que faça sempre a atualização de dados, para que você possa manter sua conta ativa e receber informações no contato informado.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              startIcon={<ArrowBackRounded />}
              onClick={() => setUpdateSuccessModalOpen(false)}
              sx={{ borderRadius: '10px', py: 1.2 }}
            >
              Voltar ao meu perfil
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={faceModalOpen} onClose={() => setFaceModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack spacing={2} alignItems="center">
            <Box component="img" src="/assets/logo-lilas.svg" alt="Sobora" sx={{ width: 210 }} />
            <Typography variant="h4" fontWeight={700} textAlign="center">Cadastro facial 📸</Typography>
            <Typography textAlign="center" color="text.secondary" sx={{ maxWidth: 520 }}>
              Inicie o cadastro para abrir a câmera em tela cheia com guia visual e orientações em tempo real.
            </Typography>
            <Alert icon={<InfoRounded fontSize="inherit" />} severity="info" sx={{ width: '100%', borderRadius: '10px' }}>
              Modelos carregados. Clique no botão abaixo para abrir a câmera
            </Alert>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', width: '100%' }}>
              <PersonOutlineRounded fontSize="small" />
              <Typography>Usuário: {user?.name} | {user?.email}</Typography>
            </Stack>
            <Button variant="contained" fullWidth startIcon={<CameraswitchRounded />} onClick={() => navigate('/face-enroll')} sx={{ borderRadius: '12px', py: 1.3 }}>
              Iniciar cadastro facial
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  )
}

export default ProfilePage
