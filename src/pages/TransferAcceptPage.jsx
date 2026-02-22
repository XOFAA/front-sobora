import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from '@mui/material'
import { acceptTicketTransferByCode } from '../services/tickets'

function TransferAcceptPage() {
  const [form, setForm] = useState({ code: '', toCpf: '', toEmail: '', toPhone: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleAccept = async () => {
    setError('')
    setMessage('')
    try {
      const { code, ...payload } = form
      const data = await acceptTicketTransferByCode(code, payload)
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
                Digite o codigo recebido e preencha seus dados para receber o ingresso.
              </Typography>
            </Box>
            <TextField
              label="Codigo"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            />
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
