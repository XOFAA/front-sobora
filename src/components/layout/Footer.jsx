import { Box, Divider, Link, Stack, Typography } from '@mui/material'
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
      { label: 'Politica de cancelamento', path: '/login' },
      { label: 'Contato', path: '/login' },
    ],
  },
]

function Footer() {
  const navigate = useNavigate()

  return (
    <Box component="footer" sx={{ mt: 8, pt: 4, pb: 3 }}>
      <Divider sx={{ mb: 3 }} />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 3, md: 6 }}
        justifyContent="space-between"
      >
        <Box sx={{ maxWidth: 360 }}>
          <Typography variant="h6" fontWeight={700}>
            Sobora
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Marketplace de eventos para descobrir experiencias, comprar ingressos e viver
            momentos que ficam.
          </Typography>
        </Box>

        {FOOTER_LINKS.map((group) => (
          <Box key={group.title}>
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
                  color="text.secondary"
                  sx={{ textAlign: 'left' }}
                >
                  {item.label}
                </Link>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
      <Divider sx={{ mt: 3 }} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        © {new Date().getFullYear()} Sobora. Todos os direitos reservados.
      </Typography>
    </Box>
  )
}

export default Footer
