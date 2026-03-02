import { Box, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Navigation, Pagination, Autoplay } from 'swiper/modules'
import EventCard from './EventCard'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-coverflow'

function EventSlider({ events, lightMode = false }) {
  const items = useMemo(() => events.slice(0, 8), [events])
  if (!items.length) return null

  const middleIndex = Math.floor(items.length / 2)

  return (
    <Box className={lightMode ? 'hero-slider' : ''} sx={{ position: 'relative' }}>
      <Stack direction="row" alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: lightMode ? 'rgba(255,255,255,0.96)' : 'text.primary', textAlign: 'center', px: 1.5 }}
        >
          Experiencias em destaque
        </Typography>
      </Stack>

      <Box sx={{ width: '100%', overflowX: 'clip' }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 1400,
            mx: 'auto',
            px: { xs: 0.5, md: 6 },
            overflow: 'visible',
            '.swiper, .swiper-wrapper': { overflow: 'visible' },
            '.swiper-slide': {
              width: {
                xs: '90vw',
                sm: '70vw',
                md: '820px',
                lg: '900px',
              },
              overflow: 'visible',
              transition: 'transform 250ms ease, opacity 250ms ease',
            },
            '.swiper-slide:not(.swiper-slide-active)': {
              opacity: 0.5,
              transform: 'scale(0.92)',
            },
            '.swiper-slide-active': {
              opacity: 1,
              transform: 'scale(1)',
            },
            '.swiper-button-prev, .swiper-button-next': {
              display: { xs: 'none', md: 'flex' },
            },
          }}
        >
          <Swiper
            modules={[Navigation, Pagination, EffectCoverflow, Autoplay]}
            effect="coverflow"
            centeredSlides
            slidesPerView="auto"
            spaceBetween={20}
            loop={items.length > 3}
            loopedSlides={items.length}
            navigation
            pagination={{ clickable: true }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 260,
              modifier: 1,
              slideShadows: false,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.initialSlide = middleIndex
            }}
            onInit={(swiper) => {
              if (swiper.params.loop) swiper.slideToLoop(middleIndex, 0)
              else swiper.slideTo(middleIndex, 0)
            }}
            style={{ paddingBottom: 36, overflow: 'visible' }}
          >
            {items.map((event) => (
              <SwiperSlide key={event.id}>
                <EventCard event={event} lightMeta={lightMode} />
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      </Box>
    </Box>
  )
}

export default EventSlider
