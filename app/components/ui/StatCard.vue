<script setup lang="ts">
// KPI-карточка для дашбордов: моно-лейбл, крупное дисплейное значение, иконка-акцент.
// Единый вид метрик в admin/designer/operator-кабинетах.
interface Props {
  label: string
  value: string | number
  icon?: string
  hint?: string
  accent?: boolean
}
withDefaults(defineProps<Props>(), { accent: false })
</script>

<template>
  <div
    class="rounded-lg shadow-sm p-5 border transition-colors"
    :class="accent
      ? 'bg-ink-burgundy text-ink-cream border-transparent'
      : 'bg-ink-white text-ink-black border-ink-gray-200'"
  >
    <div class="flex items-start justify-between gap-3">
      <span class="ink-label" :class="accent ? 'text-ink-cream/70' : 'text-ink-gray-600'">{{ label }}</span>
      <UIcon
        v-if="icon"
        :name="icon"
        class="size-5 shrink-0"
        :class="accent ? 'text-ink-cream/80' : 'text-ink-burgundy'"
      />
    </div>
    <div class="ink-display text-3xl mt-3 leading-none">{{ value }}</div>
    <p v-if="hint" class="text-caption mt-2" :class="accent ? 'text-ink-cream/70' : 'text-ink-gray-400'">{{ hint }}</p>
  </div>
</template>
