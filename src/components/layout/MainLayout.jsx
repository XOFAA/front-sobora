import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import EventRounded from '@mui/icons-material/EventRounded'
import TicketRounded from '@mui/icons-material/ConfirmationNumberRounded'
import LoginRounded from '@mui/icons-material/LoginRounded'
import MenuRounded from '@mui/icons-material/MenuRounded'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import EmojiEmotionsRounded from '@mui/icons-material/EmojiEmotionsRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import CameraswitchRounded from '@mui/icons-material/CameraswitchRounded'
import InfoRounded from '@mui/icons-material/InfoRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import { useState } from 'react'
import { keyframes } from '@emotion/react'
import Footer from './Footer'

const movingGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`

function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [faceModalOpen, setFaceModalOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)
  const handleNavigate = (path) => {
    navigate(path)
    closeMobile()
  }
  const handleNavigateHash = (hash) => {
    navigate(`/#${hash}`)
    closeMobile()
  }
  const handleLogout = () => {
    logout()
    closeMobile()
  }
  const handleOpenFaceModal = () => setFaceModalOpen(true)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
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
        <Toolbar sx={{ minHeight: { xs: 62, md: 70 }, px: { xs: 1, sm: 2 } }}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <Box
              component="img"
              src="/assets/sobora-logo.svg"
              alt="Sobora"
              sx={{ height: { xs: 30, md: 36 }, width: 'auto' }}
            />
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button sx={{ color: '#fff' }} startIcon={<EventRounded />} onClick={() => navigate('/#eventos')}>
              Eventos
            </Button>
            <Button sx={{ color: '#fff' }} startIcon={<TicketRounded />} onClick={() => navigate('/tickets')}>
              Meus ingressos
            </Button>
            <Button sx={{ color: '#fff' }} startIcon={<EmojiEmotionsRounded />} onClick={() => navigate('/#como-funciona')}>
              Como funciona
            </Button>
            <Button sx={{ color: '#fff' }} startIcon={<AddRounded />} onClick={() => navigate('/#criar-evento')}>
              Criar evento
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
          <ListItemButton onClick={() => handleNavigateHash('eventos')}>
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
          <ListItemButton onClick={() => handleNavigateHash('como-funciona')}>
            <ListItemIcon>
              <EmojiEmotionsRounded />
            </ListItemIcon>
            <ListItemText primary="Como funciona" />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigateHash('criar-evento')}>
            <ListItemIcon>
              <AddRounded />
            </ListItemIcon>
            <ListItemText primary="Criar evento" />
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
      <Container maxWidth="lg" sx={{ pt: { xs: 2.2, md: 4 }, pb: 0, px: { xs: 1.5, sm: 2, md: 3 }, flex: 1 }}>
        {user && user?.faceEnrollment?.status !== 'VERIFIED' ? (
          <Alert
            severity="info"
            onClick={handleOpenFaceModal}
            sx={{ mb: 3, display: 'flex', alignItems: 'center', cursor: 'pointer', '& .MuiAlert-message': { minWidth: 0 } }}
            action={(
              <Button color="inherit" size="small" onClick={handleOpenFaceModal}>
                Fazer cadastro facial
              </Button>
            )}
          >
            Faça seu cadastro facial e evite filas maiores no dia do evento. A fila exclusiva é mais rápida.
          </Alert>
        ) : null}
        <Outlet />
      </Container>

      <Dialog open={faceModalOpen} onClose={() => setFaceModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack spacing={2} alignItems="center">
            <Box component="img" src="/assets/logo-lilas.svg" alt="Sobora" sx={{ width: 210 }} />
            <Typography variant="h4" fontWeight={700} textAlign="center">Cadastro facial 📸</Typography>
            <Typography textAlign="center" color="text.secondary" sx={{ maxWidth: 520 }}>
              Inicie o cadastro para abrir a câmera em tela cheia com guia visual e orientações em tempo real.
            </Typography>
            <Alert icon={<InfoRounded fontSize="inherit" />} severity="info" sx={{ width: '100%', borderRadius: '10px' }}>
              Modelos carregados. Clique no botão abaixo para abrir a câmera
            </Alert>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', width: '100%', minWidth: 0 }}>
              <PersonOutlineRounded fontSize="small" />
              <Typography sx={{ overflowWrap: 'anywhere' }}>Usuário: {user?.name} | {user?.email}</Typography>
            </Stack>
            <Button
              variant="contained"
              fullWidth
              startIcon={<CameraswitchRounded />}
              onClick={() => {
                setFaceModalOpen(false)
                navigate('/face-enroll')
              }}
              sx={{ borderRadius: '12px', py: 1.3 }}
            >
              Iniciar cadastro facial
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Box sx={{ mt: 'auto' }}>
        <Footer />
      </Box>
    </Box>
  )
}

export default MainLayout


