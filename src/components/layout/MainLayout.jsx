import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Alert,
} from '@mui/material'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import EventRounded from '@mui/icons-material/EventRounded'
import TicketRounded from '@mui/icons-material/ConfirmationNumberRounded'
import LoginRounded from '@mui/icons-material/LoginRounded'
import MenuRounded from '@mui/icons-material/MenuRounded'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import { useState } from 'react'
import { keyframes } from '@emotion/react'

const movingGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`

function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)
  const handleNavigate = (path) => {
    navigate(path)
    closeMobile()
  }
  const handleLogout = () => {
    logout()
    closeMobile()
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(115deg, #6E51C5, #5747A8, #42386C, #6E51C5)',
          backgroundSize: '260% 260%',
          animation: `${movingGradient} 9s ease-in-out infinite`,
          color: '#fff',
        }}
      >
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
          <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button sx={{ color: '#fff' }} startIcon={<EventRounded />} onClick={() => navigate('/')}>
              Eventos
            </Button>
            <Button sx={{ color: '#fff' }} startIcon={<TicketRounded />} onClick={() => navigate('/tickets')}>
              Meus ingressos
            </Button>
            {user ? (
              <Button sx={{ color: '#fff' }} startIcon={<AccountCircleRounded />} onClick={() => navigate('/profile')}>
                Meu cadastro
              </Button>
            ) : null}
            {user ? (
              <Button variant="outlined" onClick={logout} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.7)' }}>
                Sair
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<LoginRounded />}
                onClick={() => navigate('/login')}
                disableElevation
                sx={{
                  backgroundColor: '#fff !important',
                  backgroundImage: 'none !important',
                  color: '#42386C !important',
                  '& .MuiButton-startIcon': { color: '#42386C !important' },
                  '&:hover': {
                    backgroundColor: '#efeafc !important',
                    backgroundImage: 'none !important',
                  },
                }}
              >
                Entrar
              </Button>
            )}
          </Stack>
          <IconButton
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          >
            <MenuRounded sx={{ color: '#fff' }} />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={closeMobile}
        PaperProps={{ sx: { width: 280, p: 1 } }}
      >
        <List>
          <ListItemButton onClick={() => handleNavigate('/')}>
            <ListItemIcon>
              <EventRounded />
            </ListItemIcon>
            <ListItemText primary="Eventos" />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigate('/tickets')}>
            <ListItemIcon>
              <TicketRounded />
            </ListItemIcon>
            <ListItemText primary="Meus ingressos" />
          </ListItemButton>
          {user ? (
            <ListItemButton onClick={() => handleNavigate('/profile')}>
              <ListItemIcon>
                <AccountCircleRounded />
              </ListItemIcon>
              <ListItemText primary="Meu cadastro" />
            </ListItemButton>
          ) : null}
          {user ? (
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutRounded />
              </ListItemIcon>
              <ListItemText primary="Sair" />
            </ListItemButton>
          ) : (
            <ListItemButton onClick={() => handleNavigate('/login')}>
              <ListItemIcon>
                <LoginRounded />
              </ListItemIcon>
              <ListItemText primary="Entrar" />
            </ListItemButton>
          )}
        </List>
      </Drawer>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {user && user?.faceEnrollment?.status !== 'VERIFIED' ? (
          <Alert
            severity="info"
            sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
            action={(
              <Button color="inherit" size="small" onClick={() => navigate('/face-enroll')}>
                Fazer cadastro facial
              </Button>
            )}
          >
            Faça seu cadastro facial e evite filas maiores no dia do evento. A fila exclusiva é mais rápida.
          </Alert>
        ) : null}
        <Outlet />
      </Container>
    </Box>
  )
}

export default MainLayout
