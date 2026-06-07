<script setup lang="ts">
// Текстовый инструмент (§7.1) — полноценный модуль под бренд (граффити-шрифт).
import { PRINT_FONTS, isCyrillicFont } from '~~/shared/config/print-fonts'

const { addText } = useDesign()
const { load: loadFont } = useFontLoader()
const toast = useToast()

// ~200 шрифтов; грузим выбранный по требованию (useFontLoader), не предзагружаем все.
const fontItems = PRINT_FONTS.map(f => f.name)

const form = reactive({
  text: '',
  fontFamily: 'Manrope',
  fill: '#111111',
})

const adding = ref(false)

// подгружаем шрифт сразу при выборе — чтобы превью/добавление было готово
watch(() => form.fontFamily, (f) => { if (f) loadFont(f) })

async function onAdd() {
  const t = form.text.trim()
  if (!t) { toast.add({ title: 'Введите текст', color: 'warning' }); return }
  // кириллица шрифтом без кириллических глифов нечитаема (§2.3) — подсказка
  if (!isCyrillicFont(form.fontFamily) && /[а-яё]/i.test(t)) {
    toast.add({ title: 'Шрифт без кириллицы', description: `«${form.fontFamily}» рассчитан на латиницу. Для кириллицы выберите другой шрифт.`, color: 'warning' })
  }
  adding.value = true
  try {
    // Konva рисует на canvas — шрифт должен быть загружен ДО отрисовки, иначе fallback.
    await loadFont(form.fontFamily)
    addText(t, form.fontFamily, form.fill)
    form.text = ''
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <UiSectionLabel>Текст</UiSectionLabel>
    <UInput v-model="form.text" placeholder="Имя или надпись" class="w-full" @keydown.enter.prevent="onAdd" />
    <div class="flex gap-2">
      <USelectMenu
        v-model="form.fontFamily"
        :items="fontItems"
        :search-input="{ placeholder: 'Поиск шрифта…' }"
        class="flex-1"
      />
      <UInput v-model="form.fill" type="color" class="w-12 p-1" />
    </div>
    <p class="text-caption text-ink-gray-400" :style="{ fontFamily: `'${form.fontFamily}', sans-serif` }">
      Превью: {{ form.text || 'Ваш текст' }}
    </p>
    <UButton color="neutral" variant="subtle" icon="i-lucide-type" block :loading="adding" @click="onAdd">Добавить текст</UButton>
  </div>
</template>
