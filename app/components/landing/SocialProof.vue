<script setup lang="ts">
// Соц-доказательство (P2): «Носят INKMADE» — UGC-витрина реальных кадров клиентов
// + приглашение отметить бренд в Instagram. Честный приём для нового бренда:
// не выдуманные отзывы/цифры, а живые фото и призыв попасть в подборку.
// Placeholder-first: пока фото нет, UiMediaSlot рисует фирменную заглушку.
// Сетка из 6 портретных плиток (slots ugc.1..6 в app/config/media.ts).
import type { MediaName } from '~/config/media'

const { locale } = useI18n()
const INSTAGRAM = 'https://instagram.com/inkmade'
const tiles = ['ugc.1', 'ugc.2', 'ugc.3', 'ugc.4', 'ugc.5', 'ugc.6'] as const satisfies readonly MediaName[]
</script>

<template>
  <section class="w-screen ml-[calc(50%-50vw)] bg-ink-gray-50" aria-labelledby="social-heading">
    <div class="mx-auto max-w-(--container-max) px-4" style="padding-block: var(--section-pad)">
      <UiReveal>
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <UiSectionLabel accent>{{ $t('landing.social.label') }}</UiSectionLabel>
            <h2 id="social-heading" :key="locale" v-reveal-text class="ink-display text-h2 mt-2">
              {{ $t('landing.social.title') }}
            </h2>
            <p class="text-lead text-ink-gray-600 mt-3 max-w-xl">{{ $t('landing.social.subtitle') }}</p>
          </div>
          <!-- Внешняя ссылка: plain <a> (target/rel), стилизованная под secondary-кнопку -->
          <a
            :href="INSTAGRAM"
            target="_blank"
            rel="noopener"
            class="app-btn app-btn--secondary px-6 text-base shrink-0"
          >
            <UIcon name="i-lucide-instagram" class="size-5" />
            <span>{{ $t('landing.social.cta') }}</span>
          </a>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-8">
          <UiReveal v-for="(t, i) in tiles" :key="t" :delay="i * 60">
            <a
              :href="INSTAGRAM"
              target="_blank"
              rel="noopener"
              class="group block app-card-media rounded-lg overflow-hidden ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-1"
              :aria-label="$t('landing.social.tileAlt')"
            >
              <UiMediaSlot :name="t" ratio="4/5" tone="light" icon="i-lucide-camera" rounded="rounded-none">
                <!-- Instagram-маркер появляется при наведении -->
                <span class="absolute inset-0 grid place-items-center bg-ink-black/0 group-hover:bg-ink-black/35 transition-colors duration-300">
                  <UIcon
                    name="i-lucide-instagram"
                    class="size-7 text-ink-cream opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300"
                  />
                </span>
              </UiMediaSlot>
            </a>
          </UiReveal>
        </div>
      </UiReveal>
    </div>
  </section>
</template>
