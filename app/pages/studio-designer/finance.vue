<script setup lang="ts">
// Финансы дизайнера (CRM §4.3): баланс, начисления, выплаты.
definePageMeta({ layout: 'designer', middleware: 'designer-role' })
const d = useDesigner()
const toast = useToast()

const { data, refresh } = await useAsyncData('designer-finance', async () => {
  const [balance, earnings, payouts, profile, rates] = await Promise.all([
    d.balance(), d.earnings(100), d.payouts(), d.profile(), d.rateHistory(),
  ])
  return { balance, earnings, payouts, profile, rates }
})

const money = (n: number | null | undefined) => `${Math.round(Number(n) || 0).toLocaleString('ru')} ₸`
const MIN_PAYOUT = 5000

const amount = ref<number>(0)
const requesting = ref(false)
async function requestPayout() {
  const avail = Number(data.value?.balance?.available) || 0
  if (amount.value < MIN_PAYOUT) { toast.add({ title: `Минимум к выводу — ${MIN_PAYOUT} ₸`, color: 'warning' }); return }
  if (amount.value > avail) { toast.add({ title: 'Больше доступного баланса', color: 'warning' }); return }
  requesting.value = true
  try {
    await d.requestPayout(amount.value)
    amount.value = 0
    await refresh()
    toast.add({ title: 'Заявка на выплату создана', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Ошибка', description: (e as { message?: string }).message ?? 'Не удалось', color: 'error' })
  } finally { requesting.value = false }
}
const payoutColor = (s: string) => s === 'paid' ? 'success' : s === 'rejected' ? 'error' : 'neutral'
const eStatus: Record<string, string> = { accrued: 'начислено', paid: 'выплачено', reversed: 'аннулировано' }
</script>

<template>
  <div>
    <UiPageHeader label="Финансы" title="Баланс и выплаты" description="Начисления роялти, доступный остаток и история выплат." />

    <div class="space-y-8">
      <div class="grid sm:grid-cols-3 gap-4">
        <UiStatCard label="Начислено" :value="money(data?.balance?.total_earned)" icon="i-lucide-trending-up" />
        <UiStatCard label="Выплачено" :value="money(data?.balance?.total_paid)" icon="i-lucide-banknote" />
        <UiStatCard label="Доступно" :value="money(data?.balance?.available)" icon="i-lucide-wallet" accent />
      </div>

      <!-- заявка на выплату -->
      <UiPanel title="Запросить выплату" icon="i-lucide-hand-coins" class="max-w-md">
        <div class="flex items-end gap-2">
          <UFormField label="Сумма, ₸" class="flex-1"><UInput v-model.number="amount" type="number" :min="MIN_PAYOUT" class="w-full" /></UFormField>
          <UButton color="primary" size="lg" :loading="requesting" @click="requestPayout">Запросить</UButton>
        </div>
        <p class="text-caption text-ink-gray-400 mt-3">Минимум {{ MIN_PAYOUT.toLocaleString('ru') }} ₸. Ставка роялти: {{ data?.profile?.royalty_pct ?? '—' }}%.</p>
      </UiPanel>

      <!-- история начислений -->
      <UiPanel title="История начислений" icon="i-lucide-list" :padded="false">
        <div v-if="!data?.earnings?.length" class="px-6 py-4 text-ink-gray-600 text-caption">Начислений пока нет.</div>
        <div v-else class="divide-y divide-ink-gray-200">
          <div v-for="e in data!.earnings" :key="e.id" class="flex items-center justify-between gap-3 px-6 py-3 text-caption">
            <span class="truncate">{{ e.print_library?.title ?? 'принт' }}</span>
            <span class="text-ink-gray-500 shrink-0">{{ e.rate_pct }}% · {{ new Date(e.created_at).toLocaleDateString('ru') }}</span>
            <span class="shrink-0">{{ eStatus[e.status] }}</span>
            <span class="font-semibold text-ink-success shrink-0">+{{ money(e.amount) }}</span>
          </div>
        </div>
      </UiPanel>

      <!-- выплаты -->
      <UiPanel title="Выплаты" icon="i-lucide-arrow-down-to-line" :padded="false">
        <div v-if="!data?.payouts?.length" class="px-6 py-4 text-ink-gray-600 text-caption">Выплат пока не было.</div>
        <div v-else class="divide-y divide-ink-gray-200">
          <div v-for="p in data!.payouts" :key="p.id" class="flex items-center justify-between gap-3 px-6 py-3 text-caption">
            <span>{{ new Date(p.requested_at).toLocaleDateString('ru') }}</span>
            <span class="font-semibold">{{ money(p.amount) }}</span>
            <UBadge :color="payoutColor(p.status)" variant="subtle" size="xs">{{ p.status }}</UBadge>
          </div>
        </div>
      </UiPanel>
    </div>
  </div>
</template>
