import { Navigate, Route, Routes } from 'react-router-dom'

import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import EventDetailsPage from './pages/EventDetailsPage'
import AuthPage from './pages/AuthPage'
import LoginCodePage from './pages/LoginCodePage'
import CheckoutPage from './pages/CheckoutPage'
import MyTicketsPage from './pages/MyTicketsPage'
import TransferAcceptPage from './pages/TransferAcceptPage'
import { useAuth } from './contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/tickets" element={
          <ProtectedRoute>
            <MyTicketsPage />
          </ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/login/code" element={<LoginCodePage />} />
        <Route path="/transfer/:token" element={<TransferAcceptPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
