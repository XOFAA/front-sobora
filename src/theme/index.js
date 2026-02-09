import { createTheme, alpha } from '@mui/material/styles'

const BRAND = '#6D28D9'
const LILAC = '#A78BFA'
const TEAL = '#22D3EE'

const BG = '#F7F7FB'
const SURFACE = '#FFFFFF'
const SURFACE_2 = '#F2F0FF'

const TEXT = '#0F172A'
const TEXT_2 = '#64748B'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: BRAND,
      light: '#A678E2',
      dark: '#6F3EB0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: LILAC,
      light: '#D8B4FE',
      dark: '#A855F7',
      contrastText: '#FFFFFF',
    },
    info: {
      main: TEAL,
      light: '#5EEAD4',
      dark: '#0F766E',
      contrastText: '#052025',
    },
    success: { main: '#22C55E' },
    warning: { main: '#F59E0B' },
    error: { main: '#F43F5E' },
    background: {
      default: BG,
      paper: SURFACE,
    },
    text: {
      primary: TEXT,
      secondary: TEXT_2,
      disabled: alpha(TEXT, 0.45),
    },
    divider: alpha('#0F172A', 0.08),
    action: {
      hover: alpha(BRAND, 0.06),
      selected: alpha(BRAND, 0.12),
      disabled: alpha('#0F172A', 0.26),
      disabledBackground: alpha('#0F172A', 0.06),
      focus: alpha(BRAND, 0.16),
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif',
    h4: { fontWeight: 700, letterSpacing: -0.5 },
    h5: { fontWeight: 700, letterSpacing: -0.4 },
    h6: { fontWeight: 650, letterSpacing: -0.2 },
    subtitle1: { color: TEXT_2 },
    button: { textTransform: 'none', fontWeight: 650 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BG,
          backgroundImage: `
            radial-gradient(900px 600px at 10% 0%, ${alpha(LILAC, 0.18)} 0%, transparent 55%),
            radial-gradient(900px 600px at 90% 10%, ${alpha(TEAL, 0.12)} 0%, transparent 60%),
            radial-gradient(900px 600px at 40% 100%, ${alpha(BRAND, 0.12)} 0%, transparent 65%)
          `,
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${alpha('#0F172A', 0.06)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: SURFACE,
          border: `1px solid ${alpha('#0F172A', 0.08)}`,
          boxShadow: '0px 12px 28px rgba(15, 23, 42, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha(SURFACE, 0.92),
          borderBottom: `1px solid ${alpha('#0F172A', 0.08)}`,
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16,
          paddingBlock: 10,
        },
        containedPrimary: {
          backgroundImage: `linear-gradient(135deg, ${BRAND} 0%, ${LILAC} 100%)`,
          boxShadow: `0px 12px 24px ${alpha(BRAND, 0.22)}`,
          '&:hover': {
            boxShadow: `0px 16px 32px ${alpha(BRAND, 0.26)}`,
          },
        },
        outlined: {
          borderColor: alpha('#0F172A', 0.16),
          '&:hover': {
            borderColor: alpha(BRAND, 0.35),
            backgroundColor: alpha(BRAND, 0.06),
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: alpha(BRAND, 0.12),
          border: `1px solid ${alpha(BRAND, 0.3)}`,
          color: BRAND,
          fontWeight: 600,
        },
        label: { color: 'inherit' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: SURFACE_2,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha('#0F172A', 0.14),
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha('#0F172A', 0.24),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(BRAND, 0.9),
            boxShadow: `0 0 0 4px ${alpha(BRAND, 0.18)}`,
          },
        },
        input: {
          paddingTop: 12,
          paddingBottom: 12,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '&.Mui-selected': {
            backgroundColor: alpha(BRAND, 0.12),
          },
          '&.Mui-selected:hover': {
            backgroundColor: alpha(BRAND, 0.16),
          },
        },
      },
    },
  },
})

export default theme
