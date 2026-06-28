<script setup lang="ts">
// «Почему INKMADE» (§5.7): честные преимущества без выдуманных цифр/отзывов.
// Карточки AppCard с каскадным появлением и подъёмом по hover.
const { t, locale } = useI18n()
const icons = ['i-lucide-package', 'i-lucide-pipette', 'i-lucide-shield-check', 'i-lucide-lock']
const points = computed(() =>
  icons.map((icon, i) => ({
    icon,
    title: t(`landing.trust.points[${i}].title`),
    text: t(`landing.trust.points[${i}].text`),
  })),
)
</script>

<template>
  <section aria-labelledby="trust-heading">
    <UiSectionLabel accent>{{ $t('landing.trust.label') }}</UiSectionLabel>
    <h2 id="trust-heading" :key="locale" v-reveal-text class="ink-display text-h2 mt-2 mb-8">{{ $t('landing.trust.title') }}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <UiReveal v-for="(p, i) in points" :key="p.title" :delay="i * 70">
        <UiAppCard hover class="group h-full border border-ink-gray-200/70 transition-colors hover:border-ink-burgundy/30">
          <div class="p-6 flex flex-col gap-3 h-full">
            <span class="inline-flex size-12 items-center justify-center rounded-xl bg-ink-burgundy/8 text-ink-burgundy transition-colors group-hover:bg-ink-burgundy/15">
              <UIcon :name="p.icon" class="size-6" />
            </span>
            <h3 class="text-h3 font-semibold">{{ p.title }}</h3>
            <p class="text-caption text-ink-gray-600">{{ p.text }}</p>
          </div>
        </UiAppCard>
      </UiReveal>
    </div>
  </section>
</template>
