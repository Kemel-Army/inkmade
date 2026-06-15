<script setup lang="ts">
// Дашборд дизайнера (CRM §4.1): заработок на виду + последние продажи.
definePageMeta({ layout: 'designer', middleware: 'designer-role' })
const d = useDesigner()

const { data, refresh } = await useAsyncData('designer-dash', async () => {
  const [profile, balance, earnings, prints, stats] = await Promise.all([
    d.profile(), d.balance(), d.earnings(20), d.myPrints(), d.printStats(),
  ])
  return { profile, balance, earnings, prints, stats }
})

// топ принтов по сумме роялти (CRM §4.1)
const topPrints = computed(() => {
  const prints = data.value?.prints ?? []
  const stats = data.value?.stats ?? {}
  return prints
    .map(p => ({ id: p.id, title: p.title, ...(stats[p.id] ?? { sales: 0, royalty: 0 }) }))
    .filter(p => p.sales > 0)
    .sort((a, b) => b.royalty - a.royalty)
    .slice(0, 5)
})

const counts = computed(() => {
  const p = data.value?.prints ?? []
  return {
    total: p.length,
    pending: p.filter(x => x.moderation_status === 'pending').length,
    approved: p.filter(x => x.moderation_status === 'approved').length,
    rejected: p.filter(x => x.moderation_status === 'rejected').length,
  }
})

onMounted(() => {
  const stop = d.subscribeSales(() => refresh())
  onBeforeUnmount(stop)
})
const money = (n: number | null | undefined) => `${Math.round(Number(n) || 0).toLocaleString('ru')} ₸`
</script>

<template>
  <div>
    <UiPageHeader label="Студия" :title="`Привет, ${data?.profile?.display_name || 'дизайнер'}`" description="Заработок, статус принтов и последние продажи." />

    <div v-if="!data?.profile" class="border border-ink-warning/40 bg-ink-warning/5 rounded-lg p-4 text-caption mb-6">
      Профиль дизайнера ещё не настроен администратором. Загрузка принтов и роялти станут доступны после активации.
    </div>

    <div class="space-y-8">
      <!-- баланс -->
      <div class="grid sm:grid-cols-3 gap-4">
        <UiStatCard label="Заработано всего" :value="money(data?.balance?.total_earned)" icon="i-lucide-trending-up" />
        <UiStatCard label="Доступно к выводу" :value="money(data?.balance?.available)" icon="i-lucide-wallet" accent hint="Запросить выплату в разделе «Финансы»" />
        <UiStatCard label="Ставка роялти" :value="`${data?.profile?.royalty_pct ?? '—'}%`" icon="i-lucide-percent" />
      </div>

      <!-- счётчики принтов -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <UiStatCard label="Всего принтов" :value="counts.total" />
        <UiStatCard label="На модерации" :value="counts.pending" />
        <UiStatCard label="Одобрено" :value="counts.approved" />
        <UiStatCard label="Отклонено" :value="counts.rejected" />
      </div>

      <!-- топ принтов -->
      <UiPanel v-if="topPrints.length" title="Топ принтов" icon="i-lucide-award" :padded="false">
        <div class="divide-y divide-ink-gray-200">
          <div v-for="(p, i) in topPrints" :key="p.id" class="flex items-center justify-between gap-3 px-6 py-3 text-caption">
            <span class="flex items-center gap-2 min-w-0">
              <span class="ink-label text-ink-gray-400">#{{ i + 1 }}</span><span class="truncate">{{ p.title }}</span>
            </span>
            <span class="text-ink-gray-500 shrink-0">{{ p.sales }} продаж</span>
            <span class="font-semibold text-ink-success shrink-0">{{ money(p.royalty) }}</span>
          </div>
        </div>
      </UiPanel>

      <!-- последние продажи -->
      <UiPanel title="Последние продажи" icon="i-lucide-receipt" :padded="false">
        <div v-if="!data?.earnings?.length" class="px-6 py-6 text-ink-gray-600 text-caption">
          Продаж пока нет. Загрузите принты в <NuxtLink to="/studio-designer/prints" class="text-ink-burgundy font-semibold">разделе «Мои принты»</NuxtLink> — после одобрения они появятся в каталоге.
        </div>
        <div v-else class="divide-y divide-ink-gray-200">
          <div v-for="e in data!.earnings" :key="e.id" class="flex items-center justify-between gap-3 px-6 py-3 text-caption">
            <span class="truncate">{{ e.print_library?.title ?? 'принт' }}</span>
            <span class="text-ink-gray-500 shrink-0">{{ new Date(e.created_at).toLocaleDateString('ru') }}</span>
            <span class="font-semibold text-ink-success shrink-0">+{{ money(e.amount) }}</span>
          </div>
        </div>
      </UiPanel>
    </div>
  </div>
</template>
