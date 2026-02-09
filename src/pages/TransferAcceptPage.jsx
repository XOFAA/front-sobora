import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from '@mui/material'
import { acceptTicketTransfer } from '../services/tickets'

function TransferAcceptPage() {
  const { token } = useParams()
  const [form, setForm] = useState({ toCpf: '', toEmail: '', toPhone: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleAccept = async () => {
    setError('')
    setMessage('')
    try {
      const data = await acceptTicketTransfer(token, form)
      setMessage(data?.message || 'Transferencia aceita com sucesso.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao aceitar transferencia.')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Aceitar transferencia
              </Typography>
              <Typography color="text.secondary">
                Preencha seus dados para receber o ingresso.
              </Typography>
            </Box>
            <TextField
              label="CPF"
              value={form.toCpf}
              onChange={(e) => setForm((prev) => ({ ...prev, toCpf: e.target.value }))}
            />
            <TextField
              label="Email"
              value={form.toEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, toEmail: e.target.value }))}
            />
            <TextField
              label="Telefone"
              value={form.toPhone}
              onChange={(e) => setForm((prev) => ({ ...prev, toPhone: e.target.value }))}
            />
            {error ? <Alert severity="error">{error}</Alert> : null}
            {message ? <Alert severity="success">{message}</Alert> : null}
            <Button variant="contained" onClick={handleAccept}>
              Confirmar transferencia
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}

export default TransferAcceptPage
