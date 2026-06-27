<script setup lang="ts">
// Hero (§5.1): тёмный бордо-фон + grain, двухколоночно — слева заголовок и CTA,
// справа крупное медиа. GSAP timeline входа (§8): лейбл → заголовок по строкам →
// подзаголовок → кнопки (overshoot) → медиа (scale 1.06→1). Параллакс медиа при
// скролле. Всё под гейтом reduced-motion; начальное скрытие — класс .hero-anim.
const { t } = useI18n()
const supabase = useSupabaseClient()
const { get } = useSettings()

const [{ data: featured }, { data: content }] = await Promise.all([
  useAsyncData('hero-featured', async () => {
    const { data } = await supabase
      .from('products')
      .select('alias, title, product_images(url, is_primary)')
      .eq('is_active', true)
      .not('alias', 'is', null)
      .limit(1)
      .maybeSingle()
    return data
  }),
  useAsyncData('hero-content', async () => ({
    title: (await get<string>('landing.hero_title')) ?? null,
    subtitle: (await get<string>('landing.hero_subtitle')) ?? null,
  })),
])

const heroTitle = computed(() => content.value?.title ?? t('landing.hero.title'))
const heroSubtitle = computed(() => content.value?.subtitle ?? t('landing.hero.subtitle'))
const createTo = computed(() => (featured.value?.alias ? `/customize/${featured.value.alias}` : '/catalog'))
const heroImage = computed(() => {
  const imgs = (featured.value?.product_images ?? []) as { url: string; is_primary: boolean }[]
  return imgs.find(i => i.is_primary)?.url ?? imgs[0]?.url
})

const root = ref<HTMLElement | null>(null)
const animate = ref(false)
const prefersReduced = useReducedMotion()
let ctx: { revert: () => void } | null = null

onMounted(() => {
  if (prefersReduced.value) return
  const gsap = useNuxtApp().$gsap as typeof import('gsap').gsap | undefined
  const el = root.value
  if (!gsap || !el) return

  animate.value = true // включаем .hero-anim (начальное скрытие) синхронно перед таймлайном

  ctx = gsap.context(() => {
    const q = (s: string) => Array.from(el.querySelectorAll(s)) as HTMLElement[]
    const floats = q('[data-hero-float]')
    gsap.set(q('[data-hero-y]'), { y: 24 })
    gsap.set(q('[data-hero-media]'), { scale: 1.06 })
    gsap.set(floats, { opacity: 0, scale: 0.8, y: 16 })

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.to(q('[data-hero="label"]'), { opacity: 1, y: 0, duration: 0.5 })
      .to(q('[data-hero="line"]'), { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, '-=0.2')
      .to(q('[data-hero="sub"]'), { opacity: 1, y: 0, duration: 0.5 }, '-=0.35')
      .to(q('[data-hero="cta"]'), { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.6)' }, '-=0.25')
      .to(q('[data-hero="note"]'), { opacity: 1, duration: 0.4 }, '-=0.2')
      .to(q('[data-hero-media]'), { opacity: 1, scale: 1, duration: 0.9 }, 0.15)
      .to(floats, { opacity: 1, scale: 1, y: 0, duration: 0.7, stagger: 0.14, ease: 'back.out(1.6)' }, 0.55)

    // Idle-«парение» декоративных мокапов — стартует после входной анимации (§5.1).
    floats.forEach((node, i) => {
      gsap.to(node, {
        y: '+=14',
        duration: 3 + i * 0.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 1.5 + i * 0.2,
      })
    })

    // Параллакс при скролле — только на не-тач (§5.1, §10): слои на разной глубине.
    if (window.matchMedia('(pointer: fine)').matches) {
      gsap.to(q('[data-hero-media]'), {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })
      floats.forEach((node, i) => {
        gsap.to(node, {
          yPercent: i === 0 ? -22 : -14,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
        })
      })
    }
  }, el)
})
onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section
    ref="root"
    class="ink-grain w-screen ml-[calc(50%-50vw)] bg-ink-burgundy text-ink-cream relative overflow-hidden"
    :class="{ 'hero-anim': animate }"
  >
    <!-- мягкий градиент глубины -->
    <div class="absolute inset-0 bg-linear-to-br from-ink-burgundy via-ink-burgundy to-ink-burgundy-dark opacity-80" />
    <div class="absolute -top-24 -right-24 size-96 rounded-full bg-ink-burgundy-light/30 blur-3xl" />
    <div class="absolute -bottom-32 -left-20 size-80 rounded-full bg-ink-black/30 blur-3xl" />

    <div
      class="relative mx-auto max-w-(--container-max) px-4 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center"
      style="padding-block: clamp(96px, 14vw, 160px)"
    >
      <!-- Левая колонка: текст + CTA -->
      <div>
        <p data-hero="label" data-hero-y class="ink-label text-ink-cream/70">
          {{ $t('landing.hero.label') }}
        </p>
        <h1 data-hero="line" data-hero-y class="ink-hero text-hero mt-4">
          {{ heroTitle }}
        </h1>
        <p data-hero="sub" data-hero-y class="text-lead mt-6 max-w-xl text-ink-cream/85">
          {{ heroSubtitle }}
        </p>
        <div data-hero="cta" data-hero-y class="flex flex-wrap gap-3 mt-8">
          <UiAppButton :to="createTo" variant="primary" size="xl" on-dark magnetic>
            {{ $t('landing.hero.createCta') }}
          </UiAppButton>
          <UiAppButton to="/catalog" variant="secondary" size="xl" on-dark>
            {{ $t('landing.hero.catalogCta') }}
          </UiAppButton>
        </div>
        <p data-hero="note" class="ink-label text-ink-cream/55 mt-6">
          {{ $t('landing.hero.note') }}
        </p>
      </div>

      <!-- Правая колонка: слоистая композиция мокапов -->
      <div class="relative">
        <UiMediaSlot
          name="hero.main"
          :src="heroImage"
          :alt="featured?.title ?? $t('landing.hero.imageAlt')"
          :priority="true"
          loading="eager"
          sizes="(max-width: 1024px) 90vw, 560px"
          data-hero="media"
          data-hero-media
          class="shadow-[0_24px_80px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
        />
        <!-- плавающие акценты-мокапы (декор) -->
        <UiMediaSlot
          name="hero.float-1"
          aria-hidden="true"
          data-hero-float
          rounded="rounded-lg"
          class="hidden sm:block absolute -left-8 bottom-10 w-28 lg:w-36 shadow-[0_16px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/10"
        />
        <UiMediaSlot
          name="hero.float-2"
          aria-hidden="true"
          data-hero-float
          rounded="rounded-lg"
          class="hidden sm:block absolute -right-6 -top-6 w-24 lg:w-28 shadow-[0_16px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/10"
        />
      </div>
    </div>
  </section>
</template>
