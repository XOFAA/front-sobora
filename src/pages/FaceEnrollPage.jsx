import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { keyframes } from '@emotion/react'
import CloseRounded from '@mui/icons-material/CloseRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import * as faceapi from 'face-api.js'
import { useAuth } from '../contexts/AuthContext'
import { enrollFace } from '../services/face'

const pulse = keyframes`
  0% { transform: translate(-50%, -50%) scale(0.985); opacity: 0.55; }
  50% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.985); opacity: 0.55; }
`

const scan = keyframes`
  0% { top: 7%; }
  100% { top: 93%; }
`

function FaceEnrollPage() {
  const { user, reload } = useAuth()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [modelsReady, setModelsReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [hint, setHint] = useState('Preparando verificador facial...')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [faceAligned, setFaceAligned] = useState(false)
  const [livenessScore, setLivenessScore] = useState(null)

  const canCapture = useMemo(
    () => sessionActive && cameraReady && faceAligned && !loading,
    [sessionActive, cameraReady, faceAligned, loading],
  )

  useEffect(() => {
    let mounted = true
    const loadModels = async () => {
      try {
        setLoading(true)
        const baseUrl = import.meta.env.BASE_URL || '/'
        const modelsUrl = baseUrl.endsWith('/') ? `${baseUrl}models` : `${baseUrl}/models`
        const manifestUrl = `${modelsUrl}/tiny_face_detector_model-weights_manifest.json`
        const manifestResp = await fetch(manifestUrl, { cache: 'no-store' })
        if (!manifestResp.ok) {
          throw new Error(`Falha ao carregar modelos (HTTP ${manifestResp.status}).`)
        }
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelsUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelsUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelsUrl),
        ])
        if (mounted) {
          setModelsReady(true)
          setHint('Modelos carregados. Inicie o cadastro para abrir a camera.')
        }
      } catch (err) {
        if (mounted) {
          setStatus({ type: 'error', message: err?.message || 'Nao foi possivel carregar os modelos faciais.' })
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadModels()
    return () => { mounted = false }
  }, [])

  useEffect(() => () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    if (!sessionActive || !cameraReady || loading) return undefined
    let active = true
    const id = setInterval(async () => {
      if (!active || !videoRef.current) return
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.2 }),
      )
      if (!detection) {
        setFaceAligned(false)
        setHint('Aproxime seu rosto da camera.')
        return
      }
      const { box } = detection
      const frameW = videoRef.current.videoWidth || 640
      const frameH = videoRef.current.videoHeight || 480
      const cx = box.x + box.width / 2
      const cy = box.y + box.height / 2
      const centered = Math.abs(cx - frameW / 2) < frameW * 0.16 && Math.abs(cy - frameH / 2) < frameH * 0.2
      const sizeRatio = box.width / frameW

      if (sizeRatio < 0.22) {
        setFaceAligned(false)
        setHint('Aproxime mais o rosto.')
        return
      }
      if (sizeRatio > 0.68) {
        setFaceAligned(false)
        setHint('Afaste um pouco o rosto.')
        return
      }
      if (!centered) {
        setFaceAligned(false)
        setHint('Centralize o rosto no quadro.')
        return
      }
      setFaceAligned(true)
      setHint('Posicao ideal. Toque em Capturar agora.')
    }, 450)

    return () => {
      active = false
      clearInterval(id)
    }
  }, [sessionActive, cameraReady, loading])

  const startCameraSession = async () => {
    setStatus({ type: '', message: '' })
    setCompleted(false)
    setLivenessScore(null)
    setCaptureProgress(0)
    setSessionActive(true)
    setHint('Liberando camera...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 720, height: 540 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraReady(true)
      setHint('Aproxime e centralize o rosto no quadro.')
    } catch {
      setSessionActive(false)
      setStatus({ type: 'error', message: 'Nao foi possivel acessar a camera.' })
    }
  }

  const closeCameraSession = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setSessionActive(false)
    setCameraReady(false)
    setFaceAligned(false)
    setCaptureProgress(0)
    setHint('Sessao encerrada.')
  }

  const captureDescriptor = async () => {
    if (!videoRef.current) return null
    const detection = await faceapi
      .detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.2 }),
      )
      .withFaceLandmarks()
      .withFaceDescriptor()
    return detection || null
  }

  const computeLiveness = (d1, d2) => {
    if (!d1 || !d2) return 0
    const box1 = d1.detection.box
    const box2 = d2.detection.box
    const dx = Math.abs(box1.x - box2.x) / Math.max(box1.width, 1)
    const dy = Math.abs(box1.y - box2.y) / Math.max(box1.height, 1)
    return Number(Math.min(1, (dx + dy) * 2.4).toFixed(3))
  }

  const handleCapture = async () => {
    setStatus({ type: '', message: '' })
    if (!canCapture) {
      setStatus({ type: 'error', message: 'Ajuste o rosto no quadro antes de capturar.' })
      return
    }
    try {
      setLoading(true)
      const samples = []
      for (let i = 0; i < 8; i += 1) {
        const shot = await captureDescriptor()
        if (shot) samples.push(shot)
        setCaptureProgress(Math.round(((i + 1) / 8) * 100))
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
      if (samples.length < 2) {
        setStatus({ type: 'error', message: 'Nao foi possivel detectar o rosto. Tente novamente.' })
        return
      }
      const ordered = [...samples].sort((a, b) => b.detection.score - a.detection.score)
      const first = ordered[0]
      const second = ordered[1] || ordered[0]
      const liveness = computeLiveness(first, second)
      setLivenessScore(liveness)

      await enrollFace({
        embedding: Array.from(second.descriptor),
        livenessScore: liveness,
        livenessMethod: 'passive',
      })
      await reload()
      closeCameraSession()
      setCompleted(true)
      setStatus({ type: 'success', message: 'Cadastro facial concluido com sucesso.' })
    } catch (err) {
      setStatus({ type: 'error', message: err?.response?.data?.message || 'Falha no cadastro facial.' })
    } finally {
      setLoading(false)
      setCaptureProgress(0)
    }
  }

  if (completed) {
    return (
      <Card sx={{ borderRadius: 4, border: '1px solid #dcfce7', bgcolor: '#f0fdf4' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack spacing={2.2} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <CheckCircleRounded sx={{ color: '#16a34a', fontSize: 56 }} />
            <Typography variant="h5" fontWeight={800}>
              Cadastro facial concluido
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
              Seu perfil facial foi salvo. No dia do evento, voce podera usar a fila de reconhecimento facial.
            </Typography>
            {livenessScore !== null ? (
              <Chip color="success" label={`Liveness score: ${livenessScore}`} />
            ) : null}
            <Stack direction="row" spacing={1.2}>
              <Button variant="contained" onClick={startCameraSession}>
                Refazer cadastro facial
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack spacing={2.2}>
            <Typography variant="h5" fontWeight={800}>
              Cadastro facial
            </Typography>
            <Typography color="text.secondary">
              Inicie o cadastro para abrir a camera em tela cheia com guia visual e orientacoes em tempo real.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
              <Button variant="contained" disabled={!modelsReady || loading} onClick={startCameraSession}>
                Iniciar cadastro facial
              </Button>
            </Stack>
            <Alert severity="info">{hint}</Alert>
            {status.message ? <Alert severity={status.type || 'info'}>{status.message}</Alert> : null}
            <Typography variant="caption" color="text.secondary">
              Usuario: {user?.name} | {user?.email}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {sessionActive ? (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            bgcolor: '#020617',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography fontWeight={700}>Cadastro facial</Typography>
            <Button
              color="inherit"
              startIcon={<CloseRounded />}
              onClick={closeCameraSession}
              sx={{ minWidth: 0, px: 1 }}
            >
              Fechar
            </Button>
          </Box>

          <Box sx={{ px: 1.2 }}>
            <Alert severity="info">{hint}</Alert>
          </Box>

          {loading || captureProgress > 0 ? (
            <Box sx={{ px: 1.2, pt: 1 }}>
              <LinearProgress variant={captureProgress ? 'determinate' : 'indeterminate'} value={captureProgress} />
            </Box>
          ) : null}

          <Box
            sx={{
              position: 'relative',
              flex: 1,
              mt: 1.2,
              overflow: 'hidden',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <video
              ref={videoRef}
              width="100%"
              height="100%"
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {cameraReady ? (
              <>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '68%', sm: '54%' },
                    aspectRatio: '0.78 / 1',
                    borderRadius: '46% 46% 42% 42%',
                    border: faceAligned ? '2px solid #4ade80' : '2px solid #60a5fa',
                    boxShadow: faceAligned ? '0 0 24px rgba(74,222,128,0.55)' : '0 0 24px rgba(56,189,248,0.5)',
                    animation: `${pulse} 1.9s ease-in-out infinite`,
                    pointerEvents: 'none',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '68%', sm: '54%' },
                    aspectRatio: '0.78 / 1',
                    borderRadius: '46% 46% 42% 42%',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      width: '100%',
                      height: 2,
                      background: 'linear-gradient(90deg, transparent, #67e8f9, transparent)',
                      animation: `${scan} 1.6s linear infinite alternate`,
                      opacity: 0.95,
                    }}
                  />
                </Box>
              </>
            ) : null}
          </Box>

          <Box sx={{ p: 1.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Chip
                label={faceAligned ? 'Rosto alinhado' : 'Aguardando alinhamento'}
                color={faceAligned ? 'success' : 'warning'}
              />
              <Button variant="contained" onClick={handleCapture} disabled={!canCapture}>
                {loading ? 'Processando...' : 'Capturar agora'}
              </Button>
            </Stack>
          </Box>
        </Box>
      ) : null}
    </>
  )
}

export default FaceEnrollPage
