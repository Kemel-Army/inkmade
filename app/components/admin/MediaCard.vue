<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Database } from '~/types/database.types'

// Карточка одного фото в медиа-менеджере товара. Presentational + меню действий.
// Drag-reorder живёт на родителе (обёртка draggable).
type ImageRow = Database['public']['Tables']['product_images']['Row']

const props = defineProps<{
  image: ImageRow
  colors: { hex: string; name: string }[]
}>()
const emit = defineEmits<{
  primary: []
  toggleHide: []
  delete: []
  updateLabel: [value: string]
  updateAlt: [value: string]
  moveColor: [hex: string | null]
  setKind: [kind: 'mockup' | 'lifestyle']
}>()

const menu = computed<DropdownMenuItem[][]>(() => {
  const groups: DropdownMenuItem[][] = [[
    {
      label: props.image.is_primary ? 'Основное фото' : 'Сделать основным',
      icon: 'i-lucide-star',
      disabled: props.image.is_primary || props.image.kind !== 'mockup',
      onSelect: () => emit('primary'),
    },
    {
      label: props.image.is_hidden ? 'Показать покупателю' : 'Скрыть от покупателя',
      icon: props.image.is_hidden ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => emit('toggleHide'),
    },
  ]]

  // переместить в другой цвет
  const colorChildren: DropdownMenuItem[] = [
    {
      label: 'Общее (без цвета)',
      icon: 'i-lucide-circle-dashed',
      disabled: !props.image.color_hex,
      onSelect: () => emit('moveColor', null),
    },
    ...props.colors.map(c => ({
      label: c.name,
      icon: 'i-lucide-circle',
      disabled: props.image.color_hex === c.hex,
      onSelect: () => emit('moveColor', c.hex),
    })),
  ]
  groups.push([
    { label: 'Привязать к цвету', icon: 'i-lucide-palette', children: colorChildren },
    {
      label: props.image.kind === 'lifestyle' ? 'Сделать фото изделия' : 'Сделать «на людях»',
      icon: props.image.kind === 'lifestyle' ? 'i-lucide-shirt' : 'i-lucide-users',
      onSelect: () => emit('setKind', props.image.kind === 'lifestyle' ? 'mockup' : 'lifestyle'),
    },
  ])

  groups.push([
    { label: 'Удалить', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => emit('delete') },
  ])
  return groups
})
</script>

<template>
  <div class="space-y-1">
    <div
      class="relative border rounded-md overflow-hidden aspect-square bg-ink-gray-50 transition-opacity"
      :class="image.is_hidden ? 'border-ink-gray-200 opacity-45' : 'border-ink-gray-200'"
    >
      <img :src="image.url" :alt="image.alt ?? ''" class="w-full h-full object-cover">

      <!-- статусы -->
      <div class="absolute top-1 left-1 flex flex-col gap-1">
        <UBadge v-if="image.is_primary" color="primary" size="xs">осн.</UBadge>
        <UBadge v-if="image.is_hidden" color="neutral" variant="solid" size="xs" icon="i-lucide-eye-off">скрыто</UBadge>
      </div>

      <!-- метка цвета у lifestyle -->
      <span
        v-if="image.kind === 'lifestyle' && image.color_hex"
        class="absolute top-1 right-9 size-4 rounded-full border-2 border-white shadow"
        :style="{ backgroundColor: image.color_hex }"
      />

      <!-- меню действий -->
      <UDropdownMenu :items="menu" :content="{ align: 'end' }">
        <UButton
          icon="i-lucide-ellipsis-vertical"
          color="neutral"
          variant="solid"
          size="xs"
          class="absolute top-1 right-1 bg-black/50 hover:bg-black/70"
          aria-label="Действия с фото"
        />
      </UDropdownMenu>
    </div>

    <!-- метка ракурса -->
    <UInput
      :model-value="image.label ?? ''"
      size="xs" placeholder="Ракурс (Перёд…)" class="w-full"
      @blur="(e: FocusEvent) => emit('updateLabel', (e.target as HTMLInputElement).value)"
    />
    <!-- alt-текст (SEO / доступность) -->
    <UInput
      :model-value="image.alt ?? ''"
      size="xs" placeholder="Alt-текст (SEO)" variant="soft"
      class="w-full" :ui="{ base: 'text-[11px] text-ink-gray-500' }"
      @blur="(e: FocusEvent) => emit('updateAlt', (e.target as HTMLInputElement).value)"
    />
  </div>
</template>
