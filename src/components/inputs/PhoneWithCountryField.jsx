import { Box, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { useId } from 'react'
import {
  COUNTRY_OPTIONS,
  countryFlagIconUrl,
  formatPhoneByCountry,
  onlyDigits,
} from '../../utils/contact'

function PhoneWithCountryField({
  countryIso2,
  phone,
  onCountryChange,
  onPhoneChange,
  label = 'Telefone',
}) {
  const selectId = useId()
  const selectedCountry = COUNTRY_OPTIONS.find((item) => item.iso2 === countryIso2) || COUNTRY_OPTIONS[0]

  return (
    <Stack direction="row" spacing={1.2}>
      <FormControl sx={{ minWidth: 190 }}>
        <InputLabel id={`${selectId}-label`}>Pais / DDI</InputLabel>
        <Select
          labelId={`${selectId}-label`}
          label="Pais / DDI"
          value={countryIso2}
          onChange={(event) => onCountryChange(event.target.value)}
          renderValue={(value) => {
            const country = COUNTRY_OPTIONS.find((item) => item.iso2 === value) || COUNTRY_OPTIONS[0]
            return (
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  component="img"
                  src={countryFlagIconUrl(country.iso2)}
                  alt={country.name}
                  sx={{ width: 20, height: 14, borderRadius: 0.3, objectFit: 'cover' }}
                />
                <Typography variant="body2">{country.iso2} (+{country.dialCode})</Typography>
              </Stack>
            )
          }}
        >
          {COUNTRY_OPTIONS.map((country) => (
            <MenuItem key={country.iso2} value={country.iso2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  component="img"
                  src={countryFlagIconUrl(country.iso2)}
                  alt={country.name}
                  sx={{ width: 20, height: 14, borderRadius: 0.3, objectFit: 'cover' }}
                />
                <Box>
                  <Typography variant="body2">{country.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    +{country.dialCode}
                  </Typography>
                </Box>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        fullWidth
        label={label}
        value={formatPhoneByCountry(phone, selectedCountry.iso2)}
        onChange={(event) => onPhoneChange(onlyDigits(event.target.value))}
        placeholder="Somente numeros"
      />
    </Stack>
  )
}

export default PhoneWithCountryField
