import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
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
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchFaceStatus } from '../services/face'
import PhoneWithCountryField from '../components/inputs/PhoneWithCountryField'
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

function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateProfile, reload } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    countryIso2: 'BR',
  })
  const [profileMethod, setProfileMethod] = useState('phone')
  const [faceStatus, setFaceStatus] = useState('PENDING')
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
        setFaceStatus(data?.status || 'PENDING')
      } catch {
        setFaceStatus('PENDING')
      }
    }
    loadFaceStatus()
  }, [])

  const faceView = useMemo(() => {
    return faceStatusMap[faceStatus] || faceStatusMap.PENDING
  }, [faceStatus])

  const handleChange = (key) => (event) => {
    const value = key === 'cpf' ? onlyDigits(event.target.value) : event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setStatusMessage({ type: '', message: '' })
    if (!validatePhoneLocalLength(form.phone, form.countryIso2)) {
      const country = COUNTRY_OPTIONS.find((item) => item.iso2 === form.countryIso2) || COUNTRY_OPTIONS[0]
      setStatusMessage({ type: 'error', message: `Telefone invalido para ${country.name}.` })
      return
    }
    if (!isValidCpfLength(form.cpf)) {
      setStatusMessage({ type: 'error', message: 'CPF invalido. Informe 11 digitos.' })
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
      await updateProfile(payload)
      await reload()
      setStatusMessage({ type: 'success', message: 'Dados atualizados com sucesso.' })
    } catch (err) {
      setStatusMessage({
        type: 'error',
        message: err?.response?.data?.message || 'Falha ao atualizar cadastro.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              Meu cadastro
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="profile-method-label">Preferencia para login</InputLabel>
              <Select
                labelId="profile-method-label"
                value={profileMethod}
                label="Preferencia para login"
                onChange={(event) => setProfileMethod(event.target.value)}
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
            <TextField label="Nome" value={form.name} onChange={handleChange('name')} fullWidth />
            <TextField label="E-mail" value={form.email} onChange={handleChange('email')} fullWidth />
            <PhoneWithCountryField
              countryIso2={form.countryIso2}
              phone={form.phone}
              onCountryChange={(value) => setForm((prev) => ({ ...prev, countryIso2: value }))}
              onPhoneChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
              label="Telefone"
            />
            <TextField label="CPF" value={formatCpf(form.cpf)} onChange={handleChange('cpf')} fullWidth />
            {statusMessage.message ? (
              <Alert severity={statusMessage.type || 'info'}>{statusMessage.message}</Alert>
            ) : null}
            <Button variant="contained" onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              Reconhecimento facial
            </Typography>
            <Divider />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography color="text.secondary">Status atual:</Typography>
              <Chip label={faceView.label} color={faceView.color} size="small" />
            </Stack>
            <Button variant="outlined" onClick={() => navigate('/face-enroll')}>
              {faceStatus === 'VERIFIED' ? 'Refazer cadastro facial' : 'Cadastrar facial'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default ProfilePage
