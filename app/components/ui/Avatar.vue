<script setup lang="ts">
// Аватар пользователя: фото (url) или фирменный fallback с инициалами на
// бордо-градиенте. Используется в кабинете/CRM, пока нет загрузки фото.
import { computed } from 'vue'

interface Props {
  name?: string | null
  email?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
}
const props = withDefaults(defineProps<Props>(), { size: 'md' })

const initials = computed(() => {
  const n = (props.name ?? '').trim()
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean)
    return (parts[0]![0]! + (parts[1]?.[0] ?? '')).toUpperCase()
  }
  const e = (props.email ?? '').trim()
  return e ? e[0]!.toUpperCase() : '?'
})

const sizeClass = computed(() => ({
  sm: 'size-9 text-caption',
  md: 'size-12 text-lg',
  lg: 'size-16 text-h3',
}[props.size]))
</script>

<template>
  <div
    class="ink-grain grid shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-ink-burgundy-light to-ink-burgundy-dark text-ink-cream shadow-burgundy select-none"
    :class="sizeClass"
  >
    <NuxtImg v-if="src" :src="src" alt="" class="size-full object-cover" />
    <span v-else class="ink-display font-bold">{{ initials }}</span>
  </div>
</template>
