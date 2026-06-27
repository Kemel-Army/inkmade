// ─────────────────────────────────────────────────────────────────────────────
// Манифест медиа-слотов INKMADE (placeholder-first).
//
// Каждый слот описывает ОДНУ позицию под фото/видео на сайте. Пока реального
// файла нет — компонент UiMediaSlot рисует фирменную заглушку (градиент бренда +
// grain + силуэт), поэтому сайт остаётся цельным на любом этапе.
//
// Как подключить реальный медиа-файл:
//   1) Положите файл в public/<src> с именем из поля `src` (см. ниже).
//   2) Уберите `pending: true` у этого слота (или поставьте false).
//   3) Готово — слот сам подхватит файл, заглушка исчезнет.
//
// Соотношения: '4/5' карточки/вертикаль, '16/9' hero/видео, '1/1' макро/квадрат,
// '9/16' вертикальные баннеры (auth). Тон fallback: 'dark' (бордо) / 'light' (крем).
// ─────────────────────────────────────────────────────────────────────────────

export type MediaKind = 'image' | 'video'

export interface MediaAsset {
  /** Тип ассета. */
  kind: MediaKind
  /** Путь в /public, например '/media/hero/hero-1.png'. */
  src: string
  /** Постер-кадр для видео (показывается до/вместо проигрывания). */
  poster?: string
  /** Соотношение сторон CSS aspect-ratio, например '4/5'. */
  ratio?: string
  /** Тон фирменной заглушки. */
  tone?: 'dark' | 'light'
  /** Иконка Lucide в заглушке. */
  icon?: string
  /** Вписывание медиа. */
  fit?: 'cover' | 'contain'
  /** Короткий alt/описание (по умолчанию берётся generic). */
  alt?: string
  /**
   * Файл ещё не подготовлен → сразу рисуем заглушку, без сетевого запроса.
   * Снимите флаг, когда положите реальный файл в /public.
   */
  pending?: boolean
}

/**
 * Реестр всех медиа-слотов. Ключи сгруппированы по зонам сайта.
 * UiMediaSlot принимает ключ через prop `name`.
 */
export const MEDIA = {
  // ── Hero лендинга: слоистый параллакс из мокапов ───────────────────────────
  'hero.main': { kind: 'image', src: '/media/hero/hero-main.png', ratio: '4/5', tone: 'dark', icon: 'i-lucide-shirt', fit: 'contain', pending: true },
  'hero.float-1': { kind: 'image', src: '/media/hero/hero-float-1.png', ratio: '1/1', tone: 'dark', icon: 'i-lucide-sticker', fit: 'contain', pending: true },
  'hero.float-2': { kind: 'image', src: '/media/hero/hero-float-2.png', ratio: '1/1', tone: 'dark', icon: 'i-lucide-shapes', fit: 'contain', pending: true },
  'hero.loop': { kind: 'video', src: '/media/hero/hero-loop.mp4', poster: '/media/hero/hero-poster.jpg', ratio: '4/5', tone: 'dark', icon: 'i-lucide-play', fit: 'cover', pending: true },

  // ── Категории: предметные фото изделий ─────────────────────────────────────
  'category.tshirt': { kind: 'image', src: '/media/categories/tshirt.png', ratio: '4/5', tone: 'light', icon: 'i-lucide-shirt', fit: 'contain', pending: true },
  'category.hoodie': { kind: 'image', src: '/media/categories/hoodie.png', ratio: '4/5', tone: 'light', icon: 'i-lucide-shirt', fit: 'contain', pending: true },
  'category.sweatshirt': { kind: 'image', src: '/media/categories/sweatshirt.png', ratio: '4/5', tone: 'light', icon: 'i-lucide-shirt', fit: 'contain', pending: true },
  'category.cap': { kind: 'image', src: '/media/categories/cap.png', ratio: '4/5', tone: 'light', icon: 'i-lucide-shopping-bag', fit: 'contain', pending: true },
  'category.bag': { kind: 'image', src: '/media/categories/bag.png', ratio: '4/5', tone: 'light', icon: 'i-lucide-shopping-bag', fit: 'contain', pending: true },

  // ── Методы печати: макро-фото/видео результата ─────────────────────────────
  'method.dtg': { kind: 'image', src: '/media/methods/dtg.jpg', ratio: '1/1', tone: 'dark', icon: 'i-lucide-printer', fit: 'cover', pending: true },
  'method.dtf': { kind: 'image', src: '/media/methods/dtf.jpg', ratio: '1/1', tone: 'dark', icon: 'i-lucide-layers', fit: 'cover', pending: true },
  'method.sublimation': { kind: 'image', src: '/media/methods/sublimation.jpg', ratio: '1/1', tone: 'dark', icon: 'i-lucide-shirt', fit: 'cover', pending: true },

  // ── Блок дизайнеров: коллаж принтов ────────────────────────────────────────
  'designers.print-1': { kind: 'image', src: '/media/designers/print-1.png', ratio: '4/5', tone: 'dark', icon: 'i-lucide-palette', fit: 'cover', pending: true },
  'designers.print-2': { kind: 'image', src: '/media/designers/print-2.png', ratio: '4/5', tone: 'dark', icon: 'i-lucide-palette', fit: 'cover', pending: true },
  'designers.print-3': { kind: 'image', src: '/media/designers/print-3.png', ratio: '4/5', tone: 'dark', icon: 'i-lucide-palette', fit: 'cover', pending: true },

  // ── Финальный CTA: плавающие мокапы ────────────────────────────────────────
  'cta.float-1': { kind: 'image', src: '/media/cta/cta-float-1.png', ratio: '1/1', tone: 'dark', icon: 'i-lucide-shirt', fit: 'contain', pending: true },
  'cta.float-2': { kind: 'image', src: '/media/cta/cta-float-2.png', ratio: '1/1', tone: 'dark', icon: 'i-lucide-sparkles', fit: 'contain', pending: true },

  // ── Auth: атмосферный вертикальный визуал левой панели ─────────────────────
  'auth.visual': { kind: 'image', src: '/media/auth/auth-visual.jpg', ratio: '9/16', tone: 'dark', icon: 'i-lucide-image', fit: 'cover', pending: true },
} as const satisfies Record<string, MediaAsset>

export type MediaName = keyof typeof MEDIA

export function getMedia(name: MediaName): MediaAsset {
  return MEDIA[name]
}
