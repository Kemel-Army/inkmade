<script setup lang="ts">
import type { OrderStatus } from '~~/shared/config/order-status'
import { STATUS_LABELS } from '~~/shared/config/order-status'
import { formatPrice, formatDate } from '~/utils/format'
import { formatKzPhone, whatsAppLink, telLink } from '~~/shared/config/phone'

// CRM: карточка клиента 360° — контакты, заказы, LTV, адреса. Только admin.
definePageMeta({ layout: 'admin', middleware: 'admin-role' })

const route = useRoute()
const id = route.params.id as string
const { get } = useCustomers()
const { data, error } = await useAsyncData(`admin-customer-${id}`, () => get(id))
if (error.value || !data.value?.profile) {
  throw createError({ statusCode: 404, statusMessage: 'Клиент не найден' })
}
const profile = computed(() => data.value!.profile!)
useHead(() => ({ title: `${profile.value.full_name || profile.value.email} — клиент` }))

const badgeColor = (s: string) =>
  s === 'delivered' ? 'success' : s === 'cancelled' || s === 'refunded' ? 'error'
    : s === 'on_hold' || s === 'reprint' ? 'warning' : 'neutral'
const shortId = (s: string) => s.slice(0, 8)
const greeting = 'Здравствуйте! Это INKMADE 👕'
</script>

<template>
  <div v-if="data">
    <UiPageHeader label="Клиент" :title="profile.full_name || 'Без имени'" :description="profile.email">
      <template #actions>
        <UButton to="/admin/customers" color="neutral" variant="ghost" icon="i-lucide-arrow-left">К списку</UButton>
      </template>
    </UiPageHeader>

    <!-- KPI -->
    <div class="grid sm:grid-cols-3 gap-4 mb-6">
      <UiStatCard label="Заказов" :value="data.stats.orders_count" icon="i-lucide-package" />
      <UiStatCard label="Потрачено (LTV)" :value="formatPrice(Number(data.stats.total_spent))" icon="i-lucide-wallet" accent />
      <UiStatCard label="Последний заказ" :value="data.stats.last_order_at ? formatDate(data.stats.last_order_at) : '—'" icon="i-lucide-clock" />
    </div>

    <div class="grid lg:grid-cols-[320px_1fr] gap-6">
      <!-- контакты + адреса -->
      <div class="space-y-6">
        <UiPanel title="Контакты" icon="i-lucide-id-card">
          <div class="space-y-3 text-caption">
            <div>
              <p class="ink-label text-ink-gray-500">Email</p>
              <p class="font-medium break-all">{{ profile.email }}</p>
            </div>
            <div v-if="profile.phone">
              <p class="ink-label text-ink-gray-500">Телефон</p>
              <p class="font-mono">{{ formatKzPhone(profile.phone) }}</p>
              <div class="flex gap-2 mt-2">
                <UButton v-if="whatsAppLink(profile.phone, greeting)" :to="whatsAppLink(profile.phone, greeting)!" target="_blank" size="xs" color="success" variant="subtle" icon="i-lucide-message-circle">WhatsApp</UButton>
                <UButton v-if="telLink(profile.phone)" :to="telLink(profile.phone)!" size="xs" color="neutral" variant="ghost" icon="i-lucide-phone">Позвонить</UButton>
              </div>
            </div>
            <div>
              <p class="ink-label text-ink-gray-500">Согласие на связь</p>
              <UBadge :color="profile.marketing_consent ? 'success' : 'neutral'" variant="subtle" size="xs">
                {{ profile.marketing_consent ? 'да' : 'нет' }}
              </UBadge>
            </div>
            <div>
              <p class="ink-label text-ink-gray-500">Регистрация</p>
              <p>{{ formatDate(profile.created_at) }}</p>
            </div>
          </div>
        </UiPanel>

        <UiPanel title="Адреса" icon="i-lucide-map-pin" :padded="false">
          <div v-if="data.addresses.length" class="divide-y divide-ink-gray-200">
            <div v-for="a in data.addresses" :key="a.id" class="px-6 py-3 text-caption">
              <p class="font-medium">
                {{ a.full_name }}
                <UBadge v-if="a.is_default" color="primary" variant="subtle" size="xs" class="ml-1">по умолч.</UBadge>
              </p>
              <p class="text-ink-gray-600">{{ a.phone }} · {{ a.city }}, {{ a.address }}</p>
            </div>
          </div>
          <p v-else class="px-6 py-4 text-caption text-ink-gray-400">Адресов нет.</p>
        </UiPanel>
      </div>

      <!-- история заказов -->
      <UiPanel title="История заказов" icon="i-lucide-receipt" :padded="false">
        <div v-if="data.orders.length" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="ink-label text-ink-gray-600 border-b border-ink-gray-200">
                <th class="px-6 py-3">#</th>
                <th class="px-6 py-3">Дата</th>
                <th class="px-6 py-3 text-right">Сумма</th>
                <th class="px-6 py-3">Статус</th>
                <th class="px-6 py-3">Оплата</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in data.orders" :key="o.id" class="border-b border-ink-gray-200 hover:bg-ink-gray-200/30">
                <td class="px-6 py-3">
                  <NuxtLink :to="`/admin/orders/${o.id}`" class="ink-label hover:text-ink-burgundy">#{{ shortId(o.id) }}</NuxtLink>
                </td>
                <td class="px-6 py-3 text-caption">{{ formatDate(o.created_at) }}</td>
                <td class="px-6 py-3 text-right font-semibold">{{ formatPrice(o.total) }}</td>
                <td class="px-6 py-3"><UBadge :color="badgeColor(o.status)" variant="subtle">{{ STATUS_LABELS[o.status as OrderStatus] }}</UBadge></td>
                <td class="px-6 py-3 text-caption">
                  <span v-if="o.paid_at" class="text-ink-success">оплачен</span>
                  <span v-else class="text-ink-gray-400">не оплачен</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <UiEmptyState v-else icon="i-lucide-package" title="Заказов нет" text="Клиент ещё не оформлял заказы." />
      </UiPanel>
    </div>
  </div>
</template>
