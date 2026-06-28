import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import type Lenis from 'lenis'

/**
 * GSAP + ScrollTrigger + SplitText (§3.1 ТЗ). SplitText бесплатен с GSAP 3.13+ и
 * даёт построчное появление заголовков (директива v-reveal-text).
 *
 * Единый rAF: Lenis крутится из тикера GSAP, а ScrollTrigger обновляется на каждом
 * скролле Lenis. Один цикл вместо двух = абсолютно гладкие scrub-анимации.
 *
 * Гейт reduced-motion обрабатывается на уровне самих анимаций (через
 * useReducedMotion); здесь только инфраструктура. Если Lenis отключён
 * (reduced-motion), ScrollTrigger работает с нативным скроллом.
 */
export default defineNuxtPlugin((nuxtApp) => {
  gsap.registerPlugin(ScrollTrigger, SplitText)

  const lenis = nuxtApp.$lenis as Lenis | null
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
  }

  return { provide: { gsap, ScrollTrigger } }
})
