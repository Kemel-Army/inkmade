<script setup lang="ts">
// Финальный CTA (§5.10): крупная тёмная секция, один акцент-призыв перед футером.
// По краям — плавающие мокапы-акценты (idle-float), контент въезжает по reveal.
import { ref, onMounted } from 'vue'

const supabase = useSupabaseClient()
const { data: featured } = await useAsyncData('final-cta-featured', async () => {
  const { data } = await supabase
    .from('products')
    .select('alias')
    .eq('is_active', true)
    .not('alias', 'is', null)
    .limit(1)
    .maybeSingle()
  return data
})
const createTo = computed(() => (featured.value?.alias ? `/customize/${featured.value.alias}` : '/catalog'))

const root = ref<HTMLElement | null>(null)
const fx = useScrollFx()
onMounted(() => {
  const el = root.value
  if (!el) return
  fx.scope(el, (_gsap, _reveal, parallax, float) => {
    float('[data-cta-float]', { y: 12 })
    if (window.matchMedia('(pointer: fine)').matches) {
      parallax('[data-cta-float]', el, { y: -10 })
    }
  })
})
</script>

<template>
  <section ref="root" class="ink-grain w-screen ml-[calc(50%-50vw)] bg-ink-black text-ink-cream relative overflow-hidden">
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[40rem] rounded-full bg-ink-burgundy/25 blur-3xl" />

    <!-- плавающие мокапы-акценты по краям -->
    <UiMediaSlot
      name="cta.float-1"
      data-cta-float
      aria-hidden="true"
      rounded="rounded-xl"
      class="hidden md:block absolute left-[7%] top-1/3 w-24 lg:w-28 -rotate-6 ring-1 ring-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.45)]"
    />
    <UiMediaSlot
      name="cta.float-2"
      data-cta-float
      aria-hidden="true"
      rounded="rounded-xl"
      class="hidden md:block absolute right-[7%] bottom-1/4 w-24 lg:w-28 rotate-6 ring-1 ring-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.45)]"
    />

    <div
      class="relative mx-auto max-w-(--container-max) px-4 text-center"
      style="padding-block: var(--section-pad)"
    >
      <UiReveal>
        <h2 class="ink-hero text-hero">{{ $t('landing.finalCta.title') }}</h2>
        <p class="text-lead mt-5 text-ink-cream/80">{{ $t('landing.finalCta.subtitle') }}</p>
        <div class="mt-8 flex justify-center">
          <UiAppButton :to="createTo" variant="primary" size="xl" on-dark magnetic>
            {{ $t('landing.finalCta.cta') }}
          </UiAppButton>
        </div>
      </UiReveal>
    </div>
  </section>
</template>
