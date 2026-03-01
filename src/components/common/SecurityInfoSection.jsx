import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid'

function SecurityInfoSection({ sx }) {
  return (
    <Box
      sx={{
        mt: 1,
        px: { xs: 0, md: 1 },
        py: { xs: 2, md: 3 },
        borderRadius: '10px',
        background: 'linear-gradient(180deg, #f8f6ff 0%, #f5f2ff 100%)',
        ...sx,
      }}
    >
      <Stack spacing={0.6} sx={{ textAlign: 'center', mb: { xs: 2.5, md: 3 } }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: '#1f2937' }}>
          Compra <Box component="span" sx={{ color: '#6d4ce7' }}>segura</Box> e informacoes importantes
        </Typography>
        <Typography color="text.secondary">
          Na Sobora, sua seguranca e a nossa prioridade.
        </Typography>
      </Stack>

      <Grid container spacing={2} sx={{ mb: { xs: 2.5, md: 3 } }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              height: '100%',
              borderRadius: '10px',
              bgcolor: '#6b4cd6',
              color: '#fff',
              boxShadow: '0 18px 30px rgba(76, 52, 196, 0.25)',
            }}
          >
            <CardContent>
              <Typography fontWeight={700} sx={{ textAlign: 'center', mb: 1.5 }}>
                Metodos de pagamento
              </Typography>
              <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center" sx={{ flexWrap: 'wrap' }}>
                {[
                  { name: 'Visa', file: 'Visa.svg' },
                  { name: 'Mastercard', file: 'Mastercard.svg' },
                  { name: 'Elo', file: 'Elo.svg' },
                  { name: 'American Express', file: 'American.svg' },
                  { name: 'Pix', file: 'Pix.svg' },
                  { name: 'Boleto', file: 'Boleto.svg' },
                ].map((method) => (
                  <Box
                    key={method.name}
                    component="img"
                    src={`/assets/${method.file}`}
                    alt={method.name}
                    sx={{ height: 20, width: 'auto', display: 'block' }}
                  />
                ))}
              </Stack>
              <Typography sx={{ textAlign: 'center', mt: 2, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                Parcele a compra de seus ingressos em ate 12x*
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              height: '100%',
              borderRadius: '10px',
              bgcolor: '#5a3fc4',
              color: '#fff',
              boxShadow: '0 18px 30px rgba(76, 52, 196, 0.25)',
            }}
          >
            <CardContent>
              <Typography fontWeight={700} sx={{ textAlign: 'center', mb: 1.5 }}>
                Seguranca garantida
              </Typography>
              <Typography sx={{ textAlign: 'center', fontSize: '0.92rem', color: 'rgba(255,255,255,0.92)' }}>
                Compra 100% segura: SSL, LGPD, antifraude em tempo real, QR Code unico, biometria facial e garantia de
                reembolso em caso de cancelamento do evento.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card
        sx={{
          borderRadius: '10px',
          bgcolor: '#fff2de',
          border: '1px solid #f7c873',
          boxShadow: 'none',
        }}
      >
        <CardContent>
          <Stack spacing={1.5} sx={{ textAlign: 'center' }}>
            <Typography fontWeight={700} sx={{ color: '#f59e0b' }}>
              Notou algo suspeito nesta pagina?
            </Typography>
            <Typography sx={{ color: '#7c5b1c', fontSize: '0.95rem' }}>
              Se voce identificar qualquer comportamento estranho, precos diferentes dos praticados oficialmente, ou
              suspeitar que este anuncio e fraudulento, denuncie imediatamente. Nossa equipe de seguranca investiga
              todas as denuncias.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="center"
              alignItems="center"
            >
              <Button
                variant="contained"
                sx={{
                  borderRadius: '10px',
                  px: 3,
                  bgcolor: '#f59e0b',
                  color: '#fff',
                  '&:hover': { bgcolor: '#ea8d00' },
                }}
              >
                Denunciar pagina
              </Button>
              <Button
                variant="outlined"
                sx={{
                  borderRadius: '10px',
                  px: 3,
                  borderColor: '#f59e0b',
                  color: '#f59e0b',
                  '&:hover': { borderColor: '#ea8d00', backgroundColor: 'rgba(245, 158, 11, 0.08)' },
                }}
              >
                Falar com suporte
              </Button>
              <Button
                variant="outlined"
                sx={{
                  borderRadius: '10px',
                  px: 3,
                  borderColor: '#6d4ce7',
                  color: '#6d4ce7',
                  '&:hover': { borderColor: '#5a3fd6', backgroundColor: 'rgba(109, 76, 231, 0.08)' },
                }}
              >
                Central de ajuda
              </Button>
            </Stack>
            <Box>
              <Typography fontWeight={700} sx={{ color: '#1f2937', mb: 0.4 }}>
                Canais oficiais de suporte:
              </Typography>
              <Typography sx={{ color: '#7c5b1c', fontSize: '0.9rem' }}>
                Webchat: disponivel 24 horas por dia
              </Typography>
              <Typography sx={{ color: '#7c5b1c', fontSize: '0.9rem' }}>
                E-mail: suporte@sobora.com.br (respondemos em ate 24 horas)
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default SecurityInfoSection
