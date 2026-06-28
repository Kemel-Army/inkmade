import Lenis from 'lenis'

/**
 * Инерционный плавный скролл (§3.1 ТЗ) — ставится первым, максимальный эффект
 * за минимум усилий. rAF-цикл НЕ запускаем здесь: им управляет тикер GSAP
 * (02.gsap.client.ts) — единый цикл вместо двух исключает рассинхрон и микро-джанк
 * на scrub-анимациях (параллакс, draw-линия, count-up).
 *
 * Гейт: при системном `prefers-reduced-motion: reduce` Lenis не инициализируется
 * вовсе — нативный скролл, инстанс не предоставляется (потребители проверяют null).
 */
export default defineNuxtPlugin(() => {
  let lenis: Lenis | null = null

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
  }

  return { provide: { lenis } }
})
