<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { OrderStatus } from '~~/shared/config/order-status'
import { STATUS_LABELS } from '~~/shared/config/order-status'
import { formatPrice, formatDate } from '~/utils/format'

// Обзор всех заказов (§8.2.3). Admin видит все (RLS). Поиск, фильтр по статусу/периоду,
// сводка и экспорт CSV.
definePageMeta({ layout: 'admin', middleware: 'admin-role' })

const supabase = useSupabaseClient<Database>()
const { data: orders, pending } = await useAsyncData('admin-orders', async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total, currency, created_at, paid_at, order_items(id)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
})

const filter = ref<OrderStatus | 'all'>('all')
const period = ref<'all' | '7' | '30' | '90'>('all')
const search = ref('')
const statusItems = [
  { label: 'Все статусы', value: 'all' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ label, value })),
]
const periodItems = [
  { label: 'За всё время', value: 'all' },
  { label: 'Последние 7 дней', value: '7' },
  { label: 'Последние 30 дней', value: '30' },
  { label: 'Последние 90 дней', value: '90' },
]

const filtered = computed(() => {
  let list = orders.value ?? []
  if (filter.value !== 'all') list = list.filter(o => o.status === filter.value)
  if (period.value !== 'all') {
    const cut = Date.now() - Number(period.value) * 86400000
    list = list.filter(o => new Date(o.created_at).getTime() >= cut)
  }
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter(o => o.id.toLowerCase().includes(q))
  return list
})
const sum = computed(() => filtered.value.reduce((s, o) => s + Number(o.total || 0), 0))
const paidSum = computed(() => filtered.value.filter(o => o.paid_at).reduce((s, o) => s + Number(o.total || 0), 0))

const badgeColor = (s: string) =>
  s === 'delivered' ? 'success' : s === 'cancelled' || s === 'refunded' ? 'error'
    : s === 'on_hold' || s === 'reprint' ? 'warning' : 'neutral'
const shortId = (s: string) => s.slice(0, 8)

function exportCsv() {
  const rows = filtered.value
  if (!rows.length) return
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = ['Номер', 'Дата', 'Позиций', 'Сумма', 'Валюта', 'Статус', 'Оплачен']
  const lines = rows.map(o => [
    esc(shortId(o.id)), esc(formatDate(o.created_at)), esc(o.order_items?.length ?? 0),
    esc(o.total), esc(o.currency), esc(STATUS_LABELS[o.status as OrderStatus] ?? o.status),
    esc(o.paid_at ? 'да' : 'нет'),
  ].join(','))
  const csv = '﻿' + [header.map(esc).join(','), ...lines].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `inkmade-orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>
    <UiPageHeader label="Заказы" title="Все заказы" description="Поиск, фильтр по статусу и периоду, экспорт.">
      <template #actions>
        <UButton icon="i-lucide-download" color="neutral" variant="subtle" :disabled="!filtered.length" @click="exportCsv">Экспорт CSV</UButton>
      </template>
    </UiPageHeader>

    <div v-if="pending" class="space-y-3">
      <UiSkeleton v-for="n in 6" :key="n" rounded="rounded-lg" class="h-12" />
    </div>

    <template v-else>
      <!-- сводка по фильтру -->
      <div class="grid sm:grid-cols-3 gap-4 mb-5">
        <UiStatCard label="Заказов в выборке" :value="filtered.length" icon="i-lucide-clipboard-list" />
        <UiStatCard label="Сумма выборки" :value="formatPrice(sum)" icon="i-lucide-sigma" />
        <UiStatCard label="Из них оплачено" :value="formatPrice(paidSum)" icon="i-lucide-wallet" accent />
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-4">
        <UInput v-model="search" icon="i-lucide-search" placeholder="Поиск по номеру" class="w-56" />
        <USelect v-model="filter" :items="statusItems" value-key="value" class="w-52" />
        <USelect v-model="period" :items="periodItems" value-key="value" class="w-52" />
      </div>

      <UiEmptyState v-if="!filtered.length" icon="i-lucide-package" title="Заказов нет" text="По выбранным условиям заказы не найдены." />

      <UiPanel v-else :padded="false">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="ink-label text-ink-gray-600 border-b border-ink-gray-200">
                <th class="px-6 py-3">#</th>
                <th class="px-6 py-3">Дата</th>
                <th class="px-6 py-3">Позиций</th>
                <th class="px-6 py-3 text-right">Сумма</th>
                <th class="px-6 py-3">Оплата</th>
                <th class="px-6 py-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in filtered" :key="o.id" class="border-b border-ink-gray-200 hover:bg-ink-gray-200/30">
                <td class="px-6 py-3">
                  <NuxtLink :to="`/admin/orders/${o.id}`" class="ink-label hover:text-ink-burgundy">#{{ shortId(o.id) }}</NuxtLink>
                </td>
                <td class="px-6 py-3 text-caption">{{ formatDate(o.created_at) }}</td>
                <td class="px-6 py-3">{{ o.order_items?.length ?? 0 }}</td>
                <td class="px-6 py-3 text-right font-semibold">{{ formatPrice(o.total) }}</td>
                <td class="px-6 py-3 text-caption">
                  <span v-if="o.paid_at" class="text-ink-success">оплачен</span>
                  <span v-else class="text-ink-gray-400">—</span>
                </td>
                <td class="px-6 py-3"><UBadge :color="badgeColor(o.status)" variant="subtle">{{ STATUS_LABELS[o.status as OrderStatus] }}</UBadge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiPanel>
    </template>
  </div>
</template>
