import { useEffect, useMemo, useRef } from 'react'
import { Box, TextField } from '@mui/material'

function OtpInput({ length = 6, value, onChange }) {
  const inputsRef = useRef([])
  const digits = useMemo(() => {
    const clean = String(value || '').replace(/\D/g, '')
    return Array.from({ length }, (_, i) => clean[i] || '')
  }, [value, length])

  useEffect(() => {
    inputsRef.current = inputsRef.current.slice(0, length)
  }, [length])

  const handleChange = (index, nextValue) => {
    const clean = nextValue.replace(/\D/g, '')
    if (!clean) {
      const next = digits.slice()
      next[index] = ''
      onChange(next.join(''))
      return
    }
    const next = digits.slice()
    next[index] = clean[clean.length - 1]
    onChange(next.join(''))
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus()
      inputsRef.current[index + 1]?.select()
    }
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
      inputsRef.current[index - 1]?.select()
    }
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`, gap: 1.5 }}>
      {digits.map((digit, index) => (
        <TextField
          key={`otp-${index}`}
          inputRef={(el) => {
            inputsRef.current[index] = el
          }}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
            maxLength: 1,
            style: { textAlign: 'center', fontSize: 20, fontWeight: 700 },
          }}
        />
      ))}
    </Box>
  )
}

export default OtpInput
