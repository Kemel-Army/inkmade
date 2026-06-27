<script setup lang="ts">
// Доверие-полоса (§5.2): тонкая строка сразу под hero, снимает первичные
// возражения мгновенно. Mono-буллеты через точки-разделители.
const { t } = useI18n()
const points = computed(() =>
  [0, 1, 2, 3].map(i => t(`landing.trustBar.points[${i}]`)),
)
</script>

<template>
  <section class="w-screen ml-[calc(50%-50vw)] bg-ink-black text-ink-cream/70 border-y border-white/10">
    <div class="mx-auto max-w-(--container-max) px-4 py-4">
      <UiReveal :y="12" :duration="600">
        <ul class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 ink-label text-center">
          <li v-for="p in points" :key="p" class="inline-flex items-center gap-2">
            <UIcon name="i-lucide-check" class="size-3.5 shrink-0 text-ink-burgundy-light" />
            <span>{{ p }}</span>
          </li>
        </ul>
      </UiReveal>
    </div>
  </section>
</template>
