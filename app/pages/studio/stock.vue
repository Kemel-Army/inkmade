<script setup lang="ts">
// Склад заготовок для цеха (CRM §5.1): просмотр остатков + фиксация брака (defect).
// Приход заводит админ; оператор только видит и списывает брак.
definePageMeta({ layout: 'studio', middleware: 'studio-role' })
const { listStock, addMovement, listMovements } = useStock()
const toast = useToast()

const { data: stock, refresh, pending } = await useAsyncData('studio-stock', () => listStock())

const busy = ref<string | null>(null)
async function markDefect(variantId: string) {
  busy.value = variantId
  try {
    await addMovement(variantId, -1, 'defect')
    await refresh()
    toast.add({ title: 'Брак списан (−1)', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Ошибка', description: (e as { data?: { message?: string } }).data?.message ?? (e as Error).message, color: 'error' })
  } finally { busy.value = null }
}
const low = (n: number) => n <= 5

// история движений по варианту (CRM §5.1)
const REASON_LABELS: Record<string, string> = { purchase: 'Приход', correction: 'Коррекция', defect: 'Брак', order: 'Заказ' }
const history = reactive({ open: false, title: '', loading: false, rows: [] as { id: string; delta: number; reason: string; created_at: string }[] })
async function openHistory(variantId: string, label: string) {
  history.open = true
  history.title = label
  history.loading = true
  history.rows = []
  try {
    history.rows = await listMovements(variantId)
  } catch (e) {
    toast.add({ title: 'Не удалось загрузить историю', description: (e as Error).message, color: 'error' })
  } finally {
    history.loading = false
  }
}
</script>

<template>
  <div>
    <UiPageHeader label="Склад" title="Склад заготовок" description="Остатки по вариантам, история движений и списание брака." />
    <div v-if="pending" class="space-y-2">
      <UiSkeleton v-for="n in 6" :key="n" rounded="rounded-md" class="h-10" />
    </div>
    <UiPanel v-else :padded="false">
    <div class="overflow-x-auto p-2">
    <table class="w-full text-caption">
      <thead class="text-ink-gray-500 ink-label">
        <tr class="border-b border-ink-gray-200">
          <th class="text-left p-3">Товар</th><th class="text-left">Цвет / размер</th><th class="text-left">SKU</th>
          <th class="text-right">Остаток</th><th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="v in stock" :key="v.id" class="border-b border-ink-gray-200/60 last:border-0">
          <td class="py-2">{{ v.products?.title }}</td>
          <td>
            <span class="inline-flex items-center gap-1">
              <span class="size-3 rounded-full border" :style="{ backgroundColor: v.color_hex }" />
              {{ v.color_name }} / {{ v.size }}
            </span>
          </td>
          <td class="font-mono text-ink-gray-500">{{ v.sku }}</td>
          <td class="text-right font-semibold" :class="low(v.stock) ? 'text-ink-error' : ''">{{ v.stock }}</td>
          <td class="text-right whitespace-nowrap">
            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-history" @click="openHistory(v.id, `${v.products?.title} · ${v.color_name}/${v.size}`)">История</UButton>
            <UButton size="xs" color="error" variant="ghost" icon="i-lucide-triangle-alert" :loading="busy === v.id" @click="markDefect(v.id)">Брак</UButton>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
    </UiPanel>

    <!-- история движений склада -->
    <UModal v-model:open="history.open" :title="`История: ${history.title}`">
      <template #body>
        <div v-if="history.loading" class="py-6 text-center text-ink-gray-600">Загрузка…</div>
        <div v-else-if="!history.rows.length" class="py-6 text-center text-ink-gray-600 text-caption">Движений нет.</div>
        <table v-else class="w-full text-caption">
          <tbody>
            <tr v-for="m in history.rows" :key="m.id" class="border-b border-ink-gray-200/60">
              <td class="py-2 text-ink-gray-500">{{ new Date(m.created_at).toLocaleString('ru') }}</td>
              <td>{{ REASON_LABELS[m.reason] ?? m.reason }}</td>
              <td class="text-right font-semibold" :class="m.delta > 0 ? 'text-ink-success' : 'text-ink-error'">{{ m.delta > 0 ? '+' : '' }}{{ m.delta }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </UModal>
  </div>
</template>
