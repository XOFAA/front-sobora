import { Box, Stack, Typography } from '@mui/material'
import EventCard from './EventCard'
import { useMemo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-coverflow'

function EventSlider({ events }) {
  const items = useMemo(() => events.slice(0, 8), [events])

  if (!items.length) return null

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          Experiencias em destaque
        </Typography>
      </Stack>
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Swiper
        modules={[Navigation, Pagination, EffectCoverflow]}
        effect="coverflow"
        centeredSlides
        loop={items.length > 3}
        navigation
        pagination={{ clickable: true }}
        coverflowEffect={{
          rotate: 0,
          stretch: 180,
          depth: 420,
          modifier: 1,
          slideShadows: false,
        }}
        spaceBetween={60}
        slidesPerView={1}
        breakpoints={{
          600: { slidesPerView: 1.3 },
          900: { slidesPerView: 2.1 },
          1200: { slidesPerView: 2.6 },
        }}
        style={{ paddingBottom: 36 }}
        >
          {items.map((event) => (
            <SwiperSlide key={event.id}>
              <Box sx={{ px: { xs: 0, md: 2 } }}>
                <EventCard event={event} />
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Box>
  )
}

export default EventSlider
