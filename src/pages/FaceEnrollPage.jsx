import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import * as faceapi from 'face-api.js'
import { useAuth } from '../contexts/AuthContext'
import { enrollFace } from '../services/face'

function FaceEnrollPage() {
  const { user } = useAuth()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [modelsReady, setModelsReady] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [livenessScore, setLivenessScore] = useState(null)

  const canStart = useMemo(() => modelsReady && !loading, [modelsReady, loading])

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
          throw new Error(`Não foi possível carregar modelos em ${manifestUrl} (HTTP ${manifestResp.status})`)
        }
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelsUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelsUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelsUrl),
        ])
        if (mounted) {
          setModelsReady(true)
          setStatus({ type: 'success', message: 'Modelos carregados. Você pode iniciar a câmera.' })
        }
      } catch (err) {
        if (mounted) {
          setStatus({
            type: 'error',
            message:
              err?.message ||
              'Falha ao carregar modelos. Verifique se a pasta /public/models existe com os arquivos do face-api.js.',
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
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    setStatus({ type: '', message: '' })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraReady(true)
    } catch (err) {
      setStatus({ type: 'error', message: 'Não foi possível acessar a câmera.' })
    }
  }

  const captureDescriptor = async () => {
    if (!videoRef.current) return null
    const detection = await faceapi
      .detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }),
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
    const moveScore = Math.min(1, (dx + dy) * 2.5)
    return Number(moveScore.toFixed(3))
  }

  const handleEnroll = async () => {
    setStatus({ type: '', message: '' })
    if (!cameraReady) {
      setStatus({ type: 'error', message: 'Inicie a câmera primeiro.' })
      return
    }
    try {
      setLoading(true)
      const first = await captureDescriptor()
      await new Promise((r) => setTimeout(r, 700))
      const second = await captureDescriptor()

      if (!first || !second) {
        setStatus({ type: 'error', message: 'Não foi possível detectar o rosto. Tente novamente.' })
        return
      }

      const liveness = computePassiveLiveness(first, second)
      setLivenessScore(liveness)

      const embedding = Array.from(second.descriptor)
      await enrollFace({
        embedding,
        livenessScore: liveness,
        livenessMethod: 'passive',
      })

      setStatus({ type: 'success', message: 'Cadastro facial concluído.' })
    } catch (err) {
      setStatus({ type: 'error', message: err?.response?.data?.message || 'Falha no cadastro facial.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Cadastro facial
            </Typography>
            <Typography color="text.secondary">
              O cadastro facial é opcional, mas acelera a sua entrada no evento.
            </Typography>
          </Box>
          <Alert severity="info">
            O sistema captura 2 frames em sequência e aplica liveness passivo para reduzir fraudes.
          </Alert>
          {loading ? <LinearProgress /> : null}
          <Stack spacing={2}>
            <Button variant="outlined" onClick={startCamera} disabled={!canStart}>
              {cameraReady ? 'Câmera ativa' : 'Iniciar câmera'}
            </Button>
            <Box
              sx={{
                width: '100%',
                maxWidth: 420,
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid #eee',
              }}
            >
              <video ref={videoRef} width="100%" height="auto" muted playsInline />
            </Box>
            <Button variant="contained" onClick={handleEnroll} disabled={!cameraReady || loading}>
              {loading ? 'Processando...' : 'Cadastrar face'}
            </Button>
          </Stack>
          {livenessScore !== null ? (
            <Typography variant="caption" color="text.secondary">
              Liveness score: {livenessScore}
            </Typography>
          ) : null}
          {status.message ? <Alert severity={status.type || 'info'}>{status.message}</Alert> : null}
          <Typography variant="caption" color="text.secondary">
            Usuário: {user?.name} • {user?.email}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default FaceEnrollPage
