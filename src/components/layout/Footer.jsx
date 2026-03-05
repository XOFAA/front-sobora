import { Box, Container, Link, Stack, Typography } from '@mui/material'
import { keyframes } from '@emotion/react'
import { useNavigate } from 'react-router-dom'

const FOOTER_LINKS = [
  {
    title: 'Plataforma',
    items: [
      { label: 'Eventos', path: '/' },
      { label: 'Meus ingressos', path: '/tickets' },
      { label: 'Entrar', path: '/login' },
    ],
  },
  {
    title: 'Organizadores',
    items: [
      { label: 'Criar evento', path: '/login' },
      { label: 'Boas praticas', path: '/login' },
      { label: 'Suporte ao organizador', path: '/login' },
    ],
  },
  {
    title: 'Ajuda',
    items: [
      { label: 'Central de ajuda', path: '/login' },
      { label: 'Política de cancelamento', path: '/login' },
      { label: 'Contato', path: '/login' },
    ],
  },
]

const movingGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`

function Footer() {
  const navigate = useNavigate()

  return (
    <Box
      component="footer"
      sx={{
        mt: 0,
        pt: { xs: 4, md: 5 },
        pb: { xs: 2.5, md: 3 },
        'body.has-event-mobile-fixed-buy &': {
          pb: {
            xs: 'calc(2.5rem + 96px + env(safe-area-inset-bottom, 0px))',
            md: 3,
          },
        },
        position: 'relative',
        color: '#fff',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          left: '50%',
          width: '100dvw',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)',
          backgroundSize: '260% 260%',
          animation: `${movingGradient} 9s ease-in-out infinite`,
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          flexWrap="wrap"
          spacing={{ xs: 2.5, md: 6 }}
          justifyContent="space-between"
        >
          <Box sx={{ maxWidth: 360, width: '100%' }}>
            <Box
              component="img"
              src="/assets/sobora-indeias.svg"
              alt="Sobora powered by Indeias"
              sx={{ height: { xs: 48, md: 60 }, width: 'auto', mb: 1 }}
            />
            <Typography sx={{ color: 'rgba(255,255,255,0.78)', fontSize: { xs: '0.9rem', md: '1rem' } }}>
              Marketplace de eventos para descobrir experiências, comprar ingressos e viver momentos que ficam.
            </Typography>
          </Box>

          {FOOTER_LINKS.map((group) => (
            <Box key={group.title} sx={{ minWidth: { xs: '48%', md: 150 } }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                {group.title}
              </Typography>
              <Stack spacing={0.75}>
                {group.items.map((item) => (
                  <Link
                    key={item.label}
                    component="button"
                    onClick={() => navigate(item.path)}
                    underline="none"
                    sx={{
                      textAlign: 'left',
                      color: 'rgba(255,255,255,0.75)',
                      '&:hover': { color: '#fff' },
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
        <Typography
          variant="caption"
          sx={{ mt: 3, display: 'block', color: 'rgba(255,255,255,0.6)' }}
        >
          © {new Date().getFullYear()} Sobora. Todos os direitos reservados.
        </Typography>
      </Container>
    </Box>
  )
}

export default Footer
