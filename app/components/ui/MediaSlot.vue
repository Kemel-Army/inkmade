<script setup lang="ts">
// Единый слот под фото/видео (placeholder-first). Берёт описание из манифеста
// app/config/media.ts по ключу `name` (любой проп можно переопределить вручную).
//
// Поведение:
//  • asset.pending или ошибка загрузки → фирменная заглушка (градиент бренда +
//    grain + силуэт-иконка). Никогда не «битая картинка».
//  • image → NuxtImg с @error-фолбэком.
//  • video → автопетля без звука; под prefers-reduced-motion проигрывание
//    отключается, показывается постер (или заглушка).
// Слот по умолчанию (#default) рендерится поверх медиа — для подписей/контента.
import { computed, ref } from 'vue'
import { getMedia, type MediaName, type MediaAsset } from '~/config/media'

interface Props {
  /** Ключ слота из манифеста media.ts. */
  name?: MediaName
  /** Ручное переопределение (имеет приоритет над манифестом). */
  kind?: MediaAsset['kind']
  src?: string
  poster?: string
  ratio?: string
  tone?: MediaAsset['tone']
  icon?: string
  fit?: MediaAsset['fit']
  alt?: string
  /** Стратегия загрузки изображения. */
  loading?: 'eager' | 'lazy'
  sizes?: string
  /** Приоритет загрузки (для hero). */
  priority?: boolean
  /** Класс на корневой обёртке (радиусы/тени задаёт родитель). */
  rounded?: string
  /** Декоративный фон: заглушка без иконки (только градиент бренда). */
  decorative?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  loading: 'lazy',
  rounded: 'rounded-xl',
})

const asset = computed<MediaAsset>(() => {
  const base = props.name ? getMedia(props.name) : ({ kind: 'image', src: '' } as MediaAsset)
  return {
    ...base,
    kind: props.kind ?? base.kind,
    src: props.src ?? base.src,
    poster: props.poster ?? base.poster,
    ratio: props.ratio ?? base.ratio,
    tone: props.tone ?? base.tone ?? 'light',
    icon: props.icon ?? base.icon ?? 'i-lucide-image',
    fit: props.fit ?? base.fit ?? 'cover',
    alt: props.alt ?? base.alt,
    // Явно переданный src (например фото из БД) отменяет флаг ожидания.
    pending: props.src ? false : base.pending,
  }
})

const prefersReduced = useReducedMotion()
const failed = ref(false)

// Заглушку показываем, если файл ещё не готов, нет пути, или загрузка упала.
const showFallback = computed(() => asset.value.pending || !asset.value.src || failed.value)

const objectClass = computed(() => (asset.value.fit === 'contain' ? 'object-contain' : 'object-cover'))
const toneClass = computed(() =>
  asset.value.tone === 'dark'
    ? 'from-ink-burgundy via-ink-burgundy to-ink-burgundy-dark text-ink-cream/30'
    : 'from-ink-gray-50 via-ink-white to-ink-gray-200 text-ink-burgundy/25',
)
</script>

<template>
  <div
    class="ink-grain relative overflow-hidden"
    :class="rounded"
    :style="asset.ratio ? { aspectRatio: asset.ratio } : undefined"
  >
    <!-- Реальное медиа -->
    <template v-if="!showFallback">
      <video
        v-if="asset.kind === 'video' && !prefersReduced"
        class="w-full h-full"
        :class="objectClass"
        :poster="asset.poster"
        autoplay
        muted
        loop
        playsinline
        @error="failed = true"
      >
        <source :src="asset.src" type="video/mp4" >
      </video>
      <NuxtImg
        v-else-if="asset.kind === 'video' && asset.poster"
        :src="asset.poster"
        :alt="asset.alt ?? ''"
        class="w-full h-full"
        :class="objectClass"
        :loading="loading"
        @error="failed = true"
      />
      <NuxtImg
        v-else
        :src="asset.src"
        :alt="asset.alt ?? ''"
        class="w-full h-full"
        :class="objectClass"
        :loading="loading"
        :sizes="sizes"
        :fetchpriority="priority ? 'high' : undefined"
        :preload="priority || undefined"
        @error="failed = true"
      />
    </template>

    <!-- Фирменная заглушка -->
    <div
      v-else
      class="absolute inset-0 grid place-items-center bg-linear-to-br"
      :class="toneClass"
    >
      <UIcon v-if="!decorative" :name="asset.icon!" class="size-1/4 max-w-24 max-h-24" />
    </div>

    <!-- Контент поверх медиа -->
    <slot />
  </div>
</template>
