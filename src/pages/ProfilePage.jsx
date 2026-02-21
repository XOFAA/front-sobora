import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchFaceStatus } from '../services/face'

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
  })
  const [faceStatus, setFaceStatus] = useState('PENDING')
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' })

  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      cpf: user?.cpf || '',
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
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const handleSave = async () => {
    setStatusMessage({ type: '', message: '' })
    try {
      setLoading(true)
      await updateProfile(form)
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
            <TextField label="Nome" value={form.name} onChange={handleChange('name')} fullWidth />
            <TextField label="E-mail" value={form.email} onChange={handleChange('email')} fullWidth />
            <TextField label="Telefone" value={form.phone} onChange={handleChange('phone')} fullWidth />
            <TextField label="CPF" value={form.cpf} onChange={handleChange('cpf')} fullWidth />
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
