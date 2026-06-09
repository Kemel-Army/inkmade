<script setup lang="ts">
// Кастомный курсор (§4.6, §5 вау) — мягко догоняющее кольцо-акцент поверх нативного
// курсора (нативный НЕ прячем — это безопаснее для UX). Увеличивается над
// интерактивным. Только десктоп (pointer:fine) и при включённом движении.
const ring = ref<HTMLElement | null>(null)
const active = ref(false)
const visible = ref(false)
const enabled = ref(false)
let teardown: (() => void) | null = null

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = window.matchMedia('(pointer: fine)').matches
  if (reduced || !fine) return

  const gsap = useNuxtApp().$gsap as typeof import('gsap').gsap | undefined
  const el = ring.value
  if (!gsap || !el) return
  enabled.value = true

  const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' })
  const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' })

  const interactiveSel = 'a,button,[role="button"],input,select,textarea,label,[data-cursor]'
  const onMove = (e: MouseEvent) => {
    visible.value = true
    xTo(e.clientX)
    yTo(e.clientY)
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
  <div v-if="enabled" ref="ring" class="ink-cursor" aria-hidden="true">
    <span class="ink-cursor__ring" :class="{ 'is-active': active, 'is-visible': visible }" />
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
/* Внутренний слой — визуал и scale (CSS не конфликтует с gsap-translate) */
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
</style>
