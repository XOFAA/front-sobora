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
} from '@mui/material'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import EventRounded from '@mui/icons-material/EventRounded'
import TicketRounded from '@mui/icons-material/ConfirmationNumberRounded'
import LoginRounded from '@mui/icons-material/LoginRounded'
import MenuRounded from '@mui/icons-material/MenuRounded'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import { useState } from 'react'

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
          background: 'radial-gradient(circle, #6E51C5 7%, #42386C 30%)',
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
              <Button variant="outlined" onClick={logout} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.7)' }}>
                Sair
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<LoginRounded />}
                onClick={() => navigate('/login')}
                sx={{ bgcolor: '#fff', color: '#42386C', '&:hover': { bgcolor: '#efeafc' } }}
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
        <Outlet />
      </Container>
    </Box>
  )
}

export default MainLayout
