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
import * as faceapi from 'face-api.js'
import { useAuth } from '../contexts/AuthContext'
import { enrollFace } from '../services/face'

const pulseFrame = keyframes`
  0% { transform: scale(0.98); opacity: 0.55; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.98); opacity: 0.55; }
`

const scanLine = keyframes`
  0% { transform: translateY(0%); }
  100% { transform: translateY(230px); }
`

function FaceEnrollPage() {
  const { user, reload } = useAuth()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [modelsReady, setModelsReady] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [livenessScore, setLivenessScore] = useState(null)
  const [hint, setHint] = useState('Permita camera para iniciar.')
  const [faceOk, setFaceOk] = useState(false)

  const canStartCamera = useMemo(() => modelsReady && !loading, [modelsReady, loading])
  const canCapture = useMemo(() => cameraReady && faceOk && !loading, [cameraReady, faceOk, loading])

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
          throw new Error(`Nao foi possivel carregar modelos em ${manifestUrl} (HTTP ${manifestResp.status})`)
        }
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelsUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelsUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelsUrl),
        ])
        if (mounted) {
          setModelsReady(true)
          setStatus({ type: 'success', message: 'Modelos carregados.' })
          setHint('Ative a camera e centralize seu rosto no quadro.')
        }
      } catch (err) {
        if (mounted) {
          setStatus({
            type: 'error',
            message:
              err?.message
              || 'Falha ao carregar modelos. Verifique /public/models.',
          })
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadModels()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (!cameraReady || !videoRef.current || loading) return undefined
    let active = true
    const intervalId = setInterval(async () => {
      if (!active || !videoRef.current) return
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.2 }),
      )
      if (!detection) {
        setFaceOk(false)
        setHint('Aproxime o rosto e mantenha boa iluminacao.')
        return
      }
      const box = detection.box
      const frameWidth = videoRef.current.videoWidth || 640
      const frameHeight = videoRef.current.videoHeight || 480
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      const centered = (
        Math.abs(centerX - frameWidth / 2) < frameWidth * 0.15
        && Math.abs(centerY - frameHeight / 2) < frameHeight * 0.2
      )
      const sizeRatio = box.width / frameWidth
      if (sizeRatio < 0.22) {
        setFaceOk(false)
        setHint('Aproxime mais o rosto.')
        return
      }
      if (sizeRatio > 0.68) {
        setFaceOk(false)
        setHint('Afaste um pouco o rosto.')
        return
      }
      if (!centered) {
        setFaceOk(false)
        setHint('Centralize o rosto no quadro.')
        return
      }
      setFaceOk(true)
      setHint('Posicao ideal. Clique em Capturar facial.')
    }, 500)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [cameraReady, loading])

  const startCamera = async () => {
    setStatus({ type: '', message: '' })
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
      setHint('Posicione o rosto dentro do quadro.')
    } catch {
      setStatus({ type: 'error', message: 'Nao foi possivel acessar a camera.' })
    }
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

  const computePassiveLiveness = (d1, d2) => {
    if (!d1 || !d2) return 0
    const box1 = d1.detection.box
    const box2 = d2.detection.box
    const dx = Math.abs(box1.x - box2.x) / Math.max(box1.width, 1)
    const dy = Math.abs(box1.y - box2.y) / Math.max(box1.height, 1)
    return Number(Math.min(1, (dx + dy) * 2.4).toFixed(3))
  }

  const handleEnroll = async () => {
    setStatus({ type: '', message: '' })
    if (!canCapture) {
      setStatus({ type: 'error', message: 'Ajuste o rosto no quadro antes de capturar.' })
      return
    }
    try {
      setLoading(true)
      setCaptureProgress(0)
      const samples = []
      for (let i = 0; i < 8; i += 1) {
        const sample = await captureDescriptor()
        if (sample) samples.push(sample)
        setCaptureProgress(Math.round(((i + 1) / 8) * 100))
        await new Promise((resolve) => setTimeout(resolve, 260))
      }
      if (samples.length < 2) {
        setStatus({ type: 'error', message: 'Nao foi possivel detectar o rosto. Tente novamente.' })
        return
      }
      const bestByScore = [...samples].sort((a, b) => b.detection.score - a.detection.score)
      const first = bestByScore[0]
      const second = bestByScore[1] || bestByScore[0]
      const liveness = computePassiveLiveness(first, second)
      setLivenessScore(liveness)

      const embedding = Array.from(second.descriptor)
      await enrollFace({ embedding, livenessScore: liveness, livenessMethod: 'passive' })
      await reload()

      setStatus({ type: 'success', message: 'Cadastro facial concluido com sucesso.' })
      setHint('Cadastro concluido. Voce pode recadastrar quando quiser.')
    } catch (err) {
      setStatus({ type: 'error', message: err?.response?.data?.message || 'Falha no cadastro facial.' })
    } finally {
      setLoading(false)
      setCaptureProgress(0)
    }
  }

  return (
    <Card
      sx={{
        borderRadius: 4,
        background: 'linear-gradient(155deg, #0f172a 0%, #172554 55%, #1d4ed8 100%)',
        color: '#fff',
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.2}>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Verificacao facial
              </Typography>
              <Typography sx={{ opacity: 0.85 }}>
                Centralize o rosto no quadro. O sistema captura automaticamente os melhores frames.
              </Typography>
            </Box>
            <Chip
              label={faceOk ? 'Rosto alinhado' : 'Aguardando alinhamento'}
              color={faceOk ? 'success' : 'warning'}
              variant="filled"
            />
          </Stack>

          <Alert severity="info" sx={{ bgcolor: 'rgba(255,255,255,0.92)' }}>
            {hint}
          </Alert>

          {loading || captureProgress > 0 ? <LinearProgress variant={captureProgress ? 'determinate' : 'indeterminate'} value={captureProgress} /> : null}

          <Stack spacing={2}>
            <Button
              variant="contained"
              onClick={startCamera}
              disabled={!canStartCamera}
              sx={{
                alignSelf: 'flex-start',
                bgcolor: '#22c55e',
                color: '#06211a',
                fontWeight: 700,
                '&:hover': { bgcolor: '#4ade80' },
              }}
            >
              {cameraReady ? 'Camera ativa' : 'Iniciar camera'}
            </Button>

            <Box
              sx={{
                width: '100%',
                maxWidth: 460,
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: '#050816',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <video ref={videoRef} width="100%" height="auto" muted playsInline />
              {cameraReady ? (
                <>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '18%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '58%',
                      height: '64%',
                      border: '2px solid #60a5fa',
                      borderRadius: '45% 45% 42% 42%',
                      boxShadow: '0 0 24px rgba(56,189,248,0.45)',
                      animation: `${pulseFrame} 2s ease-in-out infinite`,
                      pointerEvents: 'none',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '21%',
                      top: '18%',
                      width: '58%',
                      height: 2,
                      background: 'linear-gradient(90deg, transparent, #67e8f9, transparent)',
                      animation: `${scanLine} 1.7s linear infinite alternate`,
                      opacity: 0.95,
                      pointerEvents: 'none',
                    }}
                  />
                </>
              ) : null}
            </Box>

            <Button
              variant="contained"
              onClick={handleEnroll}
              disabled={!canCapture}
              sx={{
                alignSelf: 'flex-start',
                bgcolor: '#f59e0b',
                color: '#1f1300',
                fontWeight: 700,
                '&:hover': { bgcolor: '#fbbf24' },
              }}
            >
              {loading ? 'Processando...' : 'Capturar facial'}
            </Button>
          </Stack>

          {livenessScore !== null ? (
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Liveness score: {livenessScore}
            </Typography>
          ) : null}

          {status.message ? <Alert severity={status.type || 'info'}>{status.message}</Alert> : null}

          <Typography variant="caption" sx={{ opacity: 0.72 }}>
            Usuario: {user?.name} | {user?.email}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default FaceEnrollPage
