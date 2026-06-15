<script setup lang="ts">
import type { ProductWithRelations } from '~/types/models'

// Шаг 5 — медиа-менеджер (§8.2.1). Pro-уровень: фото-слоты по цветам/ракурсам/типу,
// drag-and-drop загрузка, переупорядочивание перетаскиванием, скрытие, alt-текст,
// перемещение между цветами и сменa типа — через меню на карточке (AdminMediaCard).
const props = defineProps<{ product: ProductWithRelations }>()
const emit = defineEmits<{ changed: [] }>()

const { uploadCatalogImage, addImage, updateImage, reorderImages, deleteImage, setPrimaryImage } = useAdmin()
const toast = useToast()

type ImageRow = ProductWithRelations['product_images'][number]

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
// mockup-группы единым списком: цвета вариантов + «общие»
const mockupGroups = computed(() => {
  const g = colors.value.map(c => ({ key: `c-${c.hex}`, title: c.name, hex: c.hex as string | null, images: mockupsFor(c.hex) }))
  g.push({ key: 'common', title: 'Общие (без привязки к цвету)', hex: null, images: mockupsFor(null) })
  return g
})
const lifestyle = computed(() =>
  (props.product.product_images ?? [])
    .filter(i => i.kind === 'lifestyle')
    .sort((a, b) => a.sort_order - b.sort_order),
)
const hasPrimary = computed(() => (props.product.product_images ?? []).some(i => i.is_primary))

// ── загрузка (клик + drag-and-drop файлов) ────────────────────────
const fileInput = ref<HTMLInputElement | null>(null)
const uploadingKey = ref<string | null>(null)
let pending: { colorHex: string | null; kind: 'mockup' | 'lifestyle'; key: string } = { colorHex: null, kind: 'mockup', key: '' }
const lifestyleColor = ref<string>('')

function pickClick(colorHex: string | null, kind: 'mockup' | 'lifestyle', key: string) {
  pending = { colorHex, kind, key }
  fileInput.value?.click()
}
async function onInputChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files?.length) await uploadFiles(files, pending)
  ;(e.target as HTMLInputElement).value = ''
}
async function uploadFiles(files: FileList, ctx: { colorHex: string | null; kind: 'mockup' | 'lifestyle'; key: string }) {
  uploadingKey.value = ctx.key
  try {
    for (const file of Array.from(files)) {
      const url = await uploadCatalogImage(props.product.id, file)
      await addImage(props.product.id, url, {
        colorHex: ctx.colorHex,
        kind: ctx.kind,
        sortOrder: props.product.product_images.length,
        isPrimary: !hasPrimary.value && ctx.kind === 'mockup',
      })
    }
    emit('changed')
  } catch (err) {
    toast.add({ title: 'Ошибка загрузки', description: (err as Error).message, color: 'error' })
  } finally {
    uploadingKey.value = null
  }
}

// ── drag-and-drop: загрузка файлов в зону vs переупорядочивание карточек ──
const dragState = ref<{ groupKey: string; id: string } | null>(null)
const dragOverKey = ref<string | null>(null)

function onZoneDragOver(key: string, e: DragEvent) {
  if (dragState.value) return // это reorder, не файлы
  if (e.dataTransfer?.types?.includes('Files')) dragOverKey.value = key
}
async function onZoneDrop(colorHex: string | null, kind: 'mockup' | 'lifestyle', key: string, e: DragEvent) {
  dragOverKey.value = null
  if (dragState.value) return // reorder обработан на карточке
  const files = e.dataTransfer?.files
  if (files?.length) await uploadFiles(files, { colorHex, kind, key })
}

function onCardDragStart(groupKey: string, id: string) { dragState.value = { groupKey, id } }
function onCardDragEnd() { dragState.value = null }
async function onCardDrop(groupKey: string, targetId: string, groupImages: ImageRow[]) {
  const d = dragState.value
  dragState.value = null
  if (!d || d.groupKey !== groupKey || d.id === targetId) return
  const ids = groupImages.map(i => i.id)
  const from = ids.indexOf(d.id)
  const to = ids.indexOf(targetId)
  if (from < 0 || to < 0) return
  ids.splice(to, 0, ids.splice(from, 1)[0]!)
  try { await reorderImages(ids); emit('changed') } catch (e) {
    toast.add({ title: 'Ошибка порядка', description: (e as Error).message, color: 'error' })
  }
}

// ── действия с фото (от MediaCard) ────────────────────────────────
async function run(p: Promise<unknown>) {
  try { await p; emit('changed') } catch (e) {
    toast.add({ title: 'Ошибка', description: (e as Error).message, color: 'error' })
  }
}
const onPrimary = (id: string) => run(setPrimaryImage(props.product.id, id))
const onToggleHide = (img: ImageRow) => run(updateImage(img.id, { is_hidden: !img.is_hidden }))
const onLabel = (id: string, value: string) => run(updateImage(id, { label: value.trim() || null }))
const onAlt = (id: string, value: string) => run(updateImage(id, { alt: value.trim() || null }))
const onMoveColor = (id: string, hex: string | null) => run(updateImage(id, { color_hex: hex }))
const onSetKind = (id: string, kind: 'mockup' | 'lifestyle') => run(updateImage(id, { kind }))
async function onDelete(id: string) {
  if (!confirm('Удалить это фото?')) return
  await run(deleteImage(id))
}
</script>

<template>
  <div class="space-y-8 max-w-4xl">
    <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp,image/avif" multiple class="hidden" @change="onInputChange">

    <!-- фото изделия по цветам (mockup) -->
    <section>
      <UiSectionLabel accent>Фото изделия по цветам</UiSectionLabel>
      <p class="text-caption text-ink-gray-600 mt-1">
        Несколько ракурсов на цвет — перёд, спина, деталь. Перетащите файлы прямо в область цвета или нажмите «+».
        Меню «⋯» на фото: основное, скрыть, привязать к цвету, тип, удалить. Порядок меняется перетаскиванием.
      </p>

      <div class="space-y-6 mt-4">
        <div
          v-for="grp in mockupGroups"
          :key="grp.key"
          class="rounded-lg p-3 -mx-3 transition-colors"
          :class="dragOverKey === grp.key ? 'bg-ink-burgundy/5 ring-2 ring-ink-burgundy/40' : ''"
          @dragover.prevent="onZoneDragOver(grp.key, $event)"
          @dragleave="dragOverKey = null"
          @drop.prevent="onZoneDrop(grp.hex, 'mockup', grp.key, $event)"
        >
          <div class="flex items-center gap-2 mb-2">
            <span
              class="size-5 rounded-full border shrink-0"
              :class="grp.hex ? 'border-ink-gray-200' : 'border-dashed border-ink-gray-400'"
              :style="grp.hex ? { backgroundColor: grp.hex } : {}"
            />
            <span class="font-semibold text-caption">{{ grp.title }}</span>
            <span class="ink-label text-ink-gray-400">{{ grp.images.length }} фото</span>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
            <div
              v-for="img in grp.images"
              :key="img.id"
              draggable="true"
              class="cursor-move"
              @dragstart="onCardDragStart(grp.key, img.id)"
              @dragend="onCardDragEnd"
              @dragover.prevent
              @drop.stop.prevent="onCardDrop(grp.key, img.id, grp.images)"
            >
              <AdminMediaCard
                :image="img"
                :colors="colors"
                @primary="onPrimary(img.id)"
                @toggle-hide="onToggleHide(img)"
                @delete="onDelete(img.id)"
                @update-label="(v: string) => onLabel(img.id, v)"
                @update-alt="(v: string) => onAlt(img.id, v)"
                @move-color="(hex: string | null) => onMoveColor(img.id, hex)"
                @set-kind="(k: 'mockup' | 'lifestyle') => onSetKind(img.id, k)"
              />
            </div>
            <button
              type="button"
              class="aspect-square rounded-md border-2 border-dashed border-ink-gray-200 flex flex-col items-center justify-center gap-1 text-ink-gray-400 hover:border-ink-burgundy hover:text-ink-burgundy transition-colors self-start"
              :disabled="uploadingKey === grp.key"
              @click="pickClick(grp.hex, 'mockup', grp.key)"
            >
              <UIcon :name="uploadingKey === grp.key ? 'i-lucide-loader-circle' : 'i-lucide-plus'" :class="uploadingKey === grp.key ? 'size-5 animate-spin' : 'size-5'" />
              <span class="text-[10px]">ракурс</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- на людях (lifestyle) -->
    <section
      class="border-t border-ink-gray-200 pt-6 rounded-lg transition-colors"
      :class="dragOverKey === 'life' ? 'bg-ink-burgundy/5 ring-2 ring-ink-burgundy/40' : ''"
      @dragover.prevent="onZoneDragOver('life', $event)"
      @dragleave="dragOverKey = null"
      @drop.prevent="onZoneDrop(lifestyleColor || null, 'lifestyle', 'life', $event)"
    >
      <UiSectionLabel accent>На людях (lifestyle)</UiSectionLabel>
      <p class="text-caption text-ink-gray-600 mt-1">
        Фото изделия на человеке. Привяжите к цвету — покажется при его выборе; «общее» показывается всегда.
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
          @click="pickClick(lifestyleColor || null, 'lifestyle', 'life')"
        >Добавить фото на людях</UButton>
      </div>

      <div v-if="lifestyle.length" class="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
        <div
          v-for="img in lifestyle"
          :key="img.id"
          draggable="true"
          class="cursor-move"
          @dragstart="onCardDragStart('life', img.id)"
          @dragend="onCardDragEnd"
          @dragover.prevent
          @drop.stop.prevent="onCardDrop('life', img.id, lifestyle)"
        >
          <AdminMediaCard
            :image="img"
            :colors="colors"
            @primary="onPrimary(img.id)"
            @toggle-hide="onToggleHide(img)"
            @delete="onDelete(img.id)"
            @update-label="(v: string) => onLabel(img.id, v)"
            @update-alt="(v: string) => onAlt(img.id, v)"
            @move-color="(hex: string | null) => onMoveColor(img.id, hex)"
            @set-kind="(k: 'mockup' | 'lifestyle') => onSetKind(img.id, k)"
          />
        </div>
      </div>
      <p v-else class="text-caption text-ink-gray-400 mt-3">Фото «на людях» пока нет.</p>
    </section>

    <p v-if="!colors.length" class="text-ink-warning text-caption">
      Сначала добавьте цвета на шаге «Варианты» — тогда появятся слоты для фото по цветам.
    </p>
  </div>
</template>
