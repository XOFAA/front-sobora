import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import EventRounded from '@mui/icons-material/EventRounded'
import TicketRounded from '@mui/icons-material/ConfirmationNumberRounded'
import LoginRounded from '@mui/icons-material/LoginRounded'

function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <Box
              component="img"
              src="/assets/sobora-logo.png"
              alt="Sobora"
              sx={{ height: 36, width: 'auto' }}
            />
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Button startIcon={<EventRounded />} onClick={() => navigate('/')}>
              Eventos
            </Button>
            <Button startIcon={<TicketRounded />} onClick={() => navigate('/tickets')}>
              Meus ingressos
            </Button>
            {user ? (
              <Button variant="outlined" onClick={logout}>
                Sair
              </Button>
            ) : (
              <Button variant="contained" startIcon={<LoginRounded />} onClick={() => navigate('/login')}>
                Entrar
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}

export default MainLayout
