import { Box, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Navigation, Pagination, Autoplay } from 'swiper/modules'
import EventCard from './EventCard'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-coverflow'

function EventSlider({ events }) {
  const items = useMemo(() => events.slice(0, 8), [events])
  if (!items.length) return null

  const middleIndex = Math.floor(items.length / 2)

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          Experiencias em destaque
        </Typography>
      </Stack>

      {/* ✅ corta o que vaza no eixo X (sem scrollbar), mas mantém o efeito */}
      <Box sx={{ width: '100%', overflowX: 'clip' /* ou 'hidden' */ }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 1400,
            mx: 'auto',
            px: { xs: 1, md: 6 },

            // ✅ permitir o Swiper “vazar” internamente
            overflow: 'visible',
            '.swiper, .swiper-wrapper': { overflow: 'visible' },

            // ✅ DEFINA LARGURA RESPONSIVA DO SLIDE (não use 100% no desktop!)
            '.swiper-slide': {
              width: {
                xs: '88vw',  // ocupa quase a tela no mobile, ainda deixa um “vazamento”
                sm: '70vw',
                md: '820px', // desktop com largura fixa (ajuste aqui)
                lg: '900px',
              },
              overflow: 'visible',
              transition: 'transform 250ms ease, opacity 250ms ease',
            },

            // ✅ visual dos não ativos (fica “atrás” igual Sympla)
            '.swiper-slide:not(.swiper-slide-active)': {
              opacity: 0.5,
              transform: 'scale(0.92)',
            },
            '.swiper-slide-active': {
              opacity: 1,
              transform: 'scale(1)',
            },

            // setas
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
            spaceBetween={28} // ajuste fino do “espaço” entre os cards
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
              // ✅ garante começar do meio
              if (swiper.params.loop) swiper.slideToLoop(middleIndex, 0)
              else swiper.slideTo(middleIndex, 0)
            }}
            style={{ paddingBottom: 36, overflow: 'visible' }}
          >
            {items.map((event) => (
              <SwiperSlide key={event.id}>
                <EventCard event={event} />
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      </Box>
    </Box>
  )
}

export default EventSlider
