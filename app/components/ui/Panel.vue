<script setup lang="ts">
// Спокойная карточка-секция для рабочих экранов (кабинеты) — в отличие от
// UiAppCard (витринная, с hover-подъёмом). Мягкая тень + тонкая граница + радиус
// бренда. Опциональная шапка с заголовком и слотом действий.
interface Props {
  title?: string
  subtitle?: string
  icon?: string
  padded?: boolean
}
withDefaults(defineProps<Props>(), { padded: true })
</script>

<template>
  <section class="bg-ink-white border border-ink-gray-200 rounded-lg shadow-sm overflow-hidden">
    <header
      v-if="title || $slots.actions"
      class="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-ink-gray-200"
    >
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <UIcon v-if="icon" :name="icon" class="size-5 text-ink-burgundy shrink-0" />
          <h2 v-if="title" class="font-semibold text-ink-black truncate">{{ title }}</h2>
        </div>
        <p v-if="subtitle" class="text-caption text-ink-gray-600 mt-0.5">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="shrink-0"><slot name="actions" /></div>
    </header>
    <div :class="padded ? 'p-6' : ''">
      <slot />
    </div>
  </section>
</template>
