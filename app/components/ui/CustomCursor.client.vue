<script setup lang="ts">
// Кастомный курсор (§4.6, §5 вау) — два слоя для «дорогого» ощущения: быстрая точка
// точно под курсором + мягко догоняющее кольцо (лаг). Кольцо увеличивается над
// интерактивным. Нативный курсор НЕ прячем (безопаснее для UX). Только десктоп
// (pointer:fine) и при включённом движении.
const ring = ref<HTMLElement | null>(null)
const dot = ref<HTMLElement | null>(null)
const active = ref(false)
const visible = ref(false)
const enabled = ref(false)
let teardown: (() => void) | null = null

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = window.matchMedia('(pointer: fine)').matches
  if (reduced || !fine) return

  const gsap = useNuxtApp().$gsap as typeof import('gsap').gsap | undefined
  const ringEl = ring.value
  const dotEl = dot.value
  if (!gsap || !ringEl || !dotEl) return
  enabled.value = true

  // Кольцо догоняет с лагом, точка — почти мгновенно (контраст = премиум-ощущение).
  const ringX = gsap.quickTo(ringEl, 'x', { duration: 0.4, ease: 'power3' })
  const ringY = gsap.quickTo(ringEl, 'y', { duration: 0.4, ease: 'power3' })
  const dotX = gsap.quickTo(dotEl, 'x', { duration: 0.12, ease: 'power3' })
  const dotY = gsap.quickTo(dotEl, 'y', { duration: 0.12, ease: 'power3' })

  const interactiveSel = 'a,button,[role="button"],input,select,textarea,label,[data-cursor]'
  const onMove = (e: MouseEvent) => {
    visible.value = true
    ringX(e.clientX)
    ringY(e.clientY)
    dotX(e.clientX)
    dotY(e.clientY)
    active.value = !!(e.target as HTMLElement)?.closest?.(interactiveSel)
  }
  const onLeave = () => (visible.value = false)

  window.addEventListener('mousemove', onMove, { passive: true })
  document.addEventListener('mouseleave', onLeave)
  teardown = () => {
    window.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseleave', onLeave)
  }
})
onBeforeUnmount(() => teardown?.())
</script>

<template>
  <div v-if="enabled" aria-hidden="true">
    <!-- Догоняющее кольцо -->
    <div ref="ring" class="ink-cursor">
      <span class="ink-cursor__ring" :class="{ 'is-active': active, 'is-visible': visible }" />
    </div>
    <!-- Быстрая точка -->
    <div ref="dot" class="ink-cursor">
      <span class="ink-cursor__dot" :class="{ 'is-active': active, 'is-visible': visible }" />
    </div>
  </div>
</template>

<style scoped>
/* Внешний слой — позиционируется gsap через transform: translate (x/y) */
.ink-cursor {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 9998;
  will-change: transform;
}
/* Кольцо — визуал и scale (CSS не конфликтует с gsap-translate) */
.ink-cursor__ring {
  display: block;
  width: 30px;
  height: 30px;
  margin: -15px 0 0 -15px;
  border: 1.5px solid var(--color-ink-burgundy);
  border-radius: 9999px;
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out),
    transform var(--dur-fast) var(--ease-out),
    background-color var(--dur-fast) var(--ease-out);
}
.ink-cursor__ring.is-visible {
  opacity: 1;
}
.ink-cursor__ring.is-active {
  transform: scale(1.7);
  background-color: rgba(122, 31, 40, 0.12);
}
/* Точка — маленький залитый центр */
.ink-cursor__dot {
  display: block;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  background: var(--color-ink-burgundy);
  border-radius: 9999px;
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}
.ink-cursor__dot.is-visible {
  opacity: 1;
}
/* Над интерактивным точка сжимается — кольцо «забирает» акцент */
.ink-cursor__dot.is-active {
  transform: scale(0.4);
}
</style>
