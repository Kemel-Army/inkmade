<script setup lang="ts">
import type { ProductWithRelations } from '~/types/models'

// Шаг 5 — Фото-слоты (§8.2.1). Фото привязано к ЦВЕТУ + ТИПУ + ракурсу (метка).
// Сетка: для каждого цвета изделия — свой ряд ракурсов (перёд/спина/деталь…),
// плюс «общие» фото и раздел «на людях». Число ракурсов не ограничено.
const props = defineProps<{ product: ProductWithRelations }>()
const emit = defineEmits<{ changed: [] }>()

const { uploadCatalogImage, addImage, updateImage, deleteImage, setPrimaryImage } = useAdmin()
const toast = useToast()

type ImageRow = ProductWithRelations['product_images'][number]

// уникальные цвета из вариантов товара (источник палитры карточки)
const colors = computed(() => {
  const map = new Map<string, string>()
  for (const v of props.product.variants ?? []) map.set(v.color_hex, v.color_name)
  return [...map.entries()].map(([hex, name]) => ({ hex, name }))
})

function mockupsFor(hex: string | null): ImageRow[] {
  return (props.product.product_images ?? [])
    .filter(i => i.kind === 'mockup' && (i.color_hex ?? null) === hex)
    .sort((a, b) => a.sort_order - b.sort_order)
}
const lifestyle = computed(() =>
  (props.product.product_images ?? [])
    .filter(i => i.kind === 'lifestyle')
    .sort((a, b) => a.sort_order - b.sort_order),
)
const hasPrimary = computed(() => (props.product.product_images ?? []).some(i => i.is_primary))

// загрузка в конкретный слот: контекст (цвет/тип) храним до выбора файла
const fileInput = ref<HTMLInputElement | null>(null)
const uploadingKey = ref<string | null>(null)
let pending: { colorHex: string | null; kind: 'mockup' | 'lifestyle'; key: string } = { colorHex: null, kind: 'mockup', key: '' }

// для lifestyle — к какому цвету привязать (или общее)
const lifestyleColor = ref<string>('')

function pick(colorHex: string | null, kind: 'mockup' | 'lifestyle', key: string) {
  pending = { colorHex, kind, key }
  fileInput.value?.click()
}

async function onUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length) return
  uploadingKey.value = pending.key
  try {
    for (const file of Array.from(files)) {
      const url = await uploadCatalogImage(props.product.id, file)
      await addImage(props.product.id, url, {
        colorHex: pending.colorHex,
        kind: pending.kind,
        sortOrder: props.product.product_images.length,
        isPrimary: !hasPrimary.value && pending.kind === 'mockup',
      })
    }
    emit('changed')
  } catch (err) {
    toast.add({ title: 'Ошибка загрузки', description: (err as Error).message, color: 'error' })
  } finally {
    uploadingKey.value = null
    ;(e.target as HTMLInputElement).value = ''
  }
}

async function onLabel(id: string, value: string) {
  try { await updateImage(id, { label: value.trim() || null }); emit('changed') } catch { /* метка не критична */ }
}
async function onPrimary(id: string) {
  try { await setPrimaryImage(props.product.id, id); emit('changed') } catch (e) {
    toast.add({ title: 'Ошибка', description: (e as Error).message, color: 'error' })
  }
}
async function onDelete(id: string) {
  if (!confirm('Удалить это фото?')) return
  try { await deleteImage(id); emit('changed') } catch (e) {
    toast.add({ title: 'Ошибка', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-8 max-w-4xl">
    <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp,image/avif" multiple class="hidden" @change="onUpload">

    <!-- фото изделия по цветам (mockup) -->
    <section>
      <UiSectionLabel accent>Фото изделия по цветам</UiSectionLabel>
      <p class="text-caption text-ink-gray-600 mt-1">
        Несколько ракурсов для каждого цвета — перёд, спина, деталь. Добавляйте сколько нужно. Под фото — метка ракурса.
      </p>

      <div class="space-y-6 mt-4">
        <!-- ряд на каждый цвет варианта -->
        <div v-for="c in colors" :key="c.hex">
          <div class="flex items-center gap-2 mb-2">
            <span class="size-5 rounded-full border border-ink-gray-200 shrink-0" :style="{ backgroundColor: c.hex }" />
            <span class="font-semibold text-caption">{{ c.name }}</span>
            <span class="ink-label text-ink-gray-400">{{ mockupsFor(c.hex).length }} фото</span>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
            <div v-for="img in mockupsFor(c.hex)" :key="img.id" class="space-y-1">
              <div class="relative group border border-ink-gray-200 rounded-md overflow-hidden aspect-square bg-ink-gray-50">
                <img :src="img.url" alt="" class="w-full h-full object-cover">
                <UBadge v-if="img.is_primary" color="primary" size="xs" class="absolute top-1 left-1">осн.</UBadge>
                <div class="absolute inset-x-0 bottom-0 flex justify-between gap-1 p-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UButton v-if="!img.is_primary" color="neutral" size="xs" variant="solid" icon="i-lucide-star" :aria-label="`Сделать основным`" @click="onPrimary(img.id)" />
                  <UButton color="error" size="xs" variant="solid" icon="i-lucide-trash-2" @click="onDelete(img.id)" />
                </div>
              </div>
              <UInput
                :model-value="img.label ?? ''"
                size="xs" placeholder="Ракурс" class="w-full"
                @blur="(ev: FocusEvent) => onLabel(img.id, (ev.target as HTMLInputElement).value)"
              />
            </div>
            <!-- слот добавления -->
            <button
              class="aspect-square rounded-md border-2 border-dashed border-ink-gray-200 flex flex-col items-center justify-center gap-1 text-ink-gray-400 hover:border-ink-burgundy hover:text-ink-burgundy transition-colors"
              :disabled="uploadingKey === `m-${c.hex}`"
              @click="pick(c.hex, 'mockup', `m-${c.hex}`)"
            >
              <UIcon :name="uploadingKey === `m-${c.hex}` ? 'i-lucide-loader-circle' : 'i-lucide-plus'" :class="uploadingKey === `m-${c.hex}` ? 'size-5 animate-spin' : 'size-5'" />
              <span class="text-[10px]">ракурс</span>
            </button>
          </div>
        </div>

        <!-- общие mockup (без привязки к цвету) -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="size-5 rounded-full border border-dashed border-ink-gray-400 shrink-0" />
            <span class="font-semibold text-caption">Общие (без привязки к цвету)</span>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
            <div v-for="img in mockupsFor(null)" :key="img.id" class="space-y-1">
              <div class="relative group border border-ink-gray-200 rounded-md overflow-hidden aspect-square bg-ink-gray-50">
                <img :src="img.url" alt="" class="w-full h-full object-cover">
                <UBadge v-if="img.is_primary" color="primary" size="xs" class="absolute top-1 left-1">осн.</UBadge>
                <div class="absolute inset-x-0 bottom-0 flex justify-between gap-1 p-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UButton v-if="!img.is_primary" color="neutral" size="xs" variant="solid" icon="i-lucide-star" @click="onPrimary(img.id)" />
                  <UButton color="error" size="xs" variant="solid" icon="i-lucide-trash-2" @click="onDelete(img.id)" />
                </div>
              </div>
              <UInput
                :model-value="img.label ?? ''"
                size="xs" placeholder="Ракурс" class="w-full"
                @blur="(ev: FocusEvent) => onLabel(img.id, (ev.target as HTMLInputElement).value)"
              />
            </div>
            <button
              class="aspect-square rounded-md border-2 border-dashed border-ink-gray-200 flex flex-col items-center justify-center gap-1 text-ink-gray-400 hover:border-ink-burgundy hover:text-ink-burgundy transition-colors"
              :disabled="uploadingKey === 'm-null'"
              @click="pick(null, 'mockup', 'm-null')"
            >
              <UIcon :name="uploadingKey === 'm-null' ? 'i-lucide-loader-circle' : 'i-lucide-plus'" :class="uploadingKey === 'm-null' ? 'size-5 animate-spin' : 'size-5'" />
              <span class="text-[10px]">фото</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- на людях (lifestyle) -->
    <section class="border-t border-ink-gray-200 pt-6">
      <UiSectionLabel accent>На людях (lifestyle)</UiSectionLabel>
      <p class="text-caption text-ink-gray-600 mt-1">
        Фото изделия на человеке. Можно привязать к цвету — тогда покажется при его выборе; «общее» показывается всегда.
      </p>

      <div class="flex flex-wrap items-center gap-2 mt-3">
        <USelect
          v-model="lifestyleColor"
          :items="[{ label: 'Общее (без цвета)', value: '' }, ...colors.map(c => ({ label: c.name, value: c.hex }))]"
          value-key="value"
          size="sm"
          class="w-52"
        />
        <UButton
          color="neutral" variant="subtle" size="sm" icon="i-lucide-camera"
          :loading="uploadingKey === 'life'"
          @click="pick(lifestyleColor || null, 'lifestyle', 'life')"
        >Добавить фото на людях</UButton>
      </div>

      <div v-if="lifestyle.length" class="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
        <div v-for="img in lifestyle" :key="img.id" class="space-y-1">
          <div class="relative group border border-ink-gray-200 rounded-md overflow-hidden aspect-square bg-ink-gray-50">
            <img :src="img.url" alt="" class="w-full h-full object-cover">
            <span
              v-if="img.color_hex"
              class="absolute top-1 left-1 size-4 rounded-full border-2 border-white shadow"
              :style="{ backgroundColor: img.color_hex }"
            />
            <div class="absolute inset-x-0 bottom-0 flex justify-end gap-1 p-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <UButton color="error" size="xs" variant="solid" icon="i-lucide-trash-2" @click="onDelete(img.id)" />
            </div>
          </div>
        </div>
      </div>
      <p v-else class="text-caption text-ink-gray-400 mt-3">Фото «на людях» пока нет.</p>
    </section>

    <p v-if="!colors.length" class="text-ink-warning text-caption">
      Сначала добавьте цвета на шаге «Варианты» — тогда появятся слоты для фото по цветам.
    </p>
  </div>
</template>
