<script setup lang="ts">
// «Качество печати» (§5.5, аккордеон). Подача выгода-первой (что получит клиент),
// технический метод — мелким пояснением внутри. Шелкография/вышивка НЕ анонсируются
// до готовности.
const { t, locale } = useI18n()
const icons = ['i-lucide-printer', 'i-lucide-layers', 'i-lucide-shirt']
// Слоты под макро-фото результата каждого метода (см. app/config/media.ts).
const methodMedia = ['method.dtg', 'method.dtf', 'method.sublimation'] as const
// Технический короткий код метода — тегом на макро-фото (доверие/экспертиза без
// жаргона в заголовках). Бренд-константа, одинаков в ru/kk → не локализуем.
const tags = ['DTG', 'DTF', 'Сублимация'] as const
const items = computed(() =>
  icons.map((icon, i) => ({
    icon,
    label: t(`landing.methods.items[${i}].label`),
    content: t(`landing.methods.items[${i}].content`),
  })),
)
</script>

<template>
  <section class="ink-grain w-screen ml-[calc(50%-50vw)] bg-ink-black text-ink-cream" aria-labelledby="methods-heading">
    <div class="mx-auto max-w-(--container-max) px-4" style="padding-block: var(--section-pad)">
      <UiSectionLabel class="text-ink-cream/60">{{ $t('landing.methods.label') }}</UiSectionLabel>
      <h2 id="methods-heading" :key="locale" v-reveal-text class="ink-display text-h2 mt-2 mb-8">{{ $t('landing.methods.title') }}</h2>
      <!-- Визуальная витрина результата каждого метода (макро-фото). -->
      <div class="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        <UiReveal v-for="(m, i) in items" :key="m.label" :delay="i * 90">
          <UiMediaSlot
            :name="methodMedia[i]"
            ratio="4/3"
            rounded="rounded-lg"
            class="ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:ring-white/25"
          >
            <span class="absolute left-3 bottom-3 ink-label text-ink-cream drop-shadow">{{ tags[i] }}</span>
          </UiMediaSlot>
        </UiReveal>
      </div>
      <UAccordion :items="items" />
    </div>
  </section>
</template>
