export const COUNTRY_OPTIONS = [
  { iso2: 'BR', name: 'Brasil', dialCode: '55', minLocalLength: 10, maxLocalLength: 11 },
  { iso2: 'US', name: 'United States', dialCode: '1', minLocalLength: 10, maxLocalLength: 10 },
  { iso2: 'GB', name: 'United Kingdom', dialCode: '44', minLocalLength: 10, maxLocalLength: 10 },
  { iso2: 'FR', name: 'France', dialCode: '33', minLocalLength: 9, maxLocalLength: 9 },
  { iso2: 'PT', name: 'Portugal', dialCode: '351', minLocalLength: 9, maxLocalLength: 9 },
  { iso2: 'ES', name: 'Spain', dialCode: '34', minLocalLength: 9, maxLocalLength: 9 },
  { iso2: 'AR', name: 'Argentina', dialCode: '54', minLocalLength: 10, maxLocalLength: 11 },
  { iso2: 'CL', name: 'Chile', dialCode: '56', minLocalLength: 9, maxLocalLength: 9 },
  { iso2: 'MX', name: 'Mexico', dialCode: '52', minLocalLength: 10, maxLocalLength: 10 },
  { iso2: 'IN', name: 'India', dialCode: '91', minLocalLength: 10, maxLocalLength: 10 },
  { iso2: 'CN', name: 'China', dialCode: '86', minLocalLength: 11, maxLocalLength: 11 },
]

const byLongestDialCode = [...COUNTRY_OPTIONS].sort((a, b) => b.dialCode.length - a.dialCode.length)

export function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

export function normalizePhoneNumber(localNumber, countryIso2 = 'BR') {
  const digits = onlyDigits(localNumber)
  if (!digits) return ''
  const country = COUNTRY_OPTIONS.find((item) => item.iso2 === countryIso2) || COUNTRY_OPTIONS[0]
  const trimmed = digits.replace(/^0+/, '')
  if (trimmed.startsWith(country.dialCode)) return trimmed
  return `${country.dialCode}${trimmed}`
}

export function parseStoredPhone(phone) {
  const digits = onlyDigits(phone)
  if (!digits) return { countryIso2: 'BR', localNumber: '' }

  const match = byLongestDialCode.find((country) => digits.startsWith(country.dialCode))
  if (!match) return { countryIso2: 'BR', localNumber: digits }

  return {
    countryIso2: match.iso2,
    localNumber: digits.slice(match.dialCode.length),
  }
}

export function buildLoginIdentifier(method, data) {
  if (method === 'email') return String(data.email || '').trim()
  if (method === 'cpf') return onlyDigits(data.cpf || '')
  return normalizePhoneNumber(data.phone || '', data.countryIso2)
}

export function countryFlagFromIso2(iso2) {
  if (!iso2 || iso2.length !== 2) return ''
  const code = iso2.toUpperCase()
  const first = code.charCodeAt(0) - 65 + 0x1f1e6
  const second = code.charCodeAt(1) - 65 + 0x1f1e6
  return String.fromCodePoint(first, second)
}

export function countryFlagIconUrl(iso2) {
  return `https://flagcdn.com/w20/${String(iso2 || '').toLowerCase()}.png`
}

export function isValidCpfLength(value) {
  return onlyDigits(value).length === 11
}

export function validatePhoneLocalLength(localNumber, countryIso2 = 'BR') {
  const country = COUNTRY_OPTIONS.find((item) => item.iso2 === countryIso2) || COUNTRY_OPTIONS[0]
  const len = onlyDigits(localNumber).length
  return len >= country.minLocalLength && len <= country.maxLocalLength
}

export function formatCpf(value) {
  const digits = onlyDigits(value).slice(0, 11)
  const p1 = digits.slice(0, 3)
  const p2 = digits.slice(3, 6)
  const p3 = digits.slice(6, 9)
  const p4 = digits.slice(9, 11)
  if (!p2) return p1
  if (!p3) return `${p1}.${p2}`
  if (!p4) return `${p1}.${p2}.${p3}`
  return `${p1}.${p2}.${p3}-${p4}`
}

export function formatPhoneByCountry(localNumber, countryIso2 = 'BR') {
  const digits = onlyDigits(localNumber)
  if (!digits) return ''

  if (countryIso2 === 'BR') {
    const ddd = digits.slice(0, 2)
    const first = digits.slice(2, 7)
    const second = digits.slice(7, 11)
    if (digits.length <= 2) return ddd
    if (digits.length <= 7) return `(${ddd}) ${digits.slice(2)}`
    return `(${ddd}) ${first}-${second}`.trim().replace(/-$/, '')
  }

  if (countryIso2 === 'US') {
    const a = digits.slice(0, 3)
    const b = digits.slice(3, 6)
    const c = digits.slice(6, 10)
    if (!b) return a
    if (!c) return `(${a}) ${b}`
    return `(${a}) ${b}-${c}`
  }

  if (countryIso2 === 'GB') {
    const a = digits.slice(0, 4)
    const b = digits.slice(4, 7)
    const c = digits.slice(7, 11)
    if (!b) return a
    if (!c) return `${a} ${b}`
    return `${a} ${b} ${c}`
  }

  if (countryIso2 === 'PT' || countryIso2 === 'ES' || countryIso2 === 'FR' || countryIso2 === 'CL' || countryIso2 === 'AR' || countryIso2 === 'MX' || countryIso2 === 'IN' || countryIso2 === 'CN') {
    const a = digits.slice(0, 3)
    const b = digits.slice(3, 6)
    const c = digits.slice(6, 10)
    if (!b) return a
    if (!c) return `${a} ${b}`
    return `${a} ${b} ${c}`
  }

  return digits
}

export function getIdentifierLabel(method, data) {
  if (method === 'email') return String(data.email || '').trim()
  if (method === 'cpf') return onlyDigits(data.cpf || '')
  const country = COUNTRY_OPTIONS.find((item) => item.iso2 === data.countryIso2) || COUNTRY_OPTIONS[0]
  return `${countryFlagFromIso2(country.iso2)} +${country.dialCode} ${formatPhoneByCountry(data.phone || '', country.iso2)}`
}
