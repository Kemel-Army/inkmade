<script setup lang="ts">
// Блок доверия (P1.10): честные преимущества без выдуманных цифр/отзывов.
// Реальные отзывы клиентов добавляются сюда после первых заказов (2-я волна).
const points = [
  { icon: 'i-lucide-package', title: 'Тираж от одной штуки', text: 'Печатаем хоть одну вещь — без минимальных партий и переплат.' },
  { icon: 'i-lucide-truck', title: 'Доставка по Казахстану', text: 'Отправляем по всей стране. Трек-номер появится в личном кабинете.' },
  { icon: 'i-lucide-shield-check', title: 'Контроль качества', text: 'Проверяем каждое изделие перед отправкой и согласуем цвет печати.' },
  { icon: 'i-lucide-lock', title: 'Безопасная оплата', text: 'Оплата онлайн, заказ уходит в работу только после подтверждения.' },
]
</script>

<template>
  <section class="py-16" aria-labelledby="trust-heading">
    <UiSectionLabel accent>Почему INKMADE</UiSectionLabel>
    <h2 id="trust-heading" class="ink-display text-h2 mt-2 mb-8">Спокойно за заказ</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div
        v-for="p in points"
        :key="p.title"
        class="border border-ink-gray-200 rounded-lg p-6 flex flex-col gap-3 hover:border-ink-burgundy hover:shadow-md transition-all"
      >
        <UIcon :name="p.icon" class="size-8 text-ink-burgundy" />
        <h3 class="text-h3 font-semibold">{{ p.title }}</h3>
        <p class="text-caption text-ink-gray-600">{{ p.text }}</p>
      </div>
    </div>
  </section>
</template>
