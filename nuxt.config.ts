// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // Nuxt 4: srcDir = app/ по умолчанию (см. паспорт §4)
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@nuxt/fonts', '@nuxtjs/supabase'],

  css: ['~/assets/css/main.css'],

  // Supabase (§3.2). redirect:false — гостевой поток без принудительного логина (§9.1).
  // Доступ к кабинетам закрываем собственными middleware (F0-13), а не глобальным редиректом.
  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    redirect: false,
  },

  // §3.8: публичные ключи — в браузер; секреты (service role, платёжные) — только сервер.
  runtimeConfig: {
    // приватные — доступны ТОЛЬКО в серверном слое (Nitro / Edge)
    paymentMerchantId: process.env.PAYMENT_MERCHANT_ID,
    paymentSecretKey: process.env.PAYMENT_SECRET_KEY,
    paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
      metaPixelId: process.env.NUXT_PUBLIC_META_PIXEL_ID,
      tiktokPixelId: process.env.NUXT_PUBLIC_TIKTOK_PIXEL_ID,
      analyticsId: process.env.NUXT_PUBLIC_ANALYTICS_ID,
    },
  },

  // §2.3 фирменные шрифты. Permanent Marker — только латиница/заголовки.
  fonts: {
    // только каркас UI/бренда. ~200 шрифтов принта грузятся по требованию
    // (app/composables/useFontLoader.ts) — предзагрузка всех убила бы страницу.
    defaults: { subsets: ['latin', 'cyrillic'] },
    families: [
      { name: 'Manrope', provider: 'google' },
      { name: 'Space Mono', provider: 'google' },
      { name: 'Permanent Marker', provider: 'google' },
      // кириллический дисплейный шрифт (H12): латиница → Permanent Marker, кириллица → Oswald
      { name: 'Oswald', provider: 'google' },
    ],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      title: 'INKMADE — Merch Studio',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  // Заголовки безопасности (P2.12). CSP подобрана так, чтобы не ломать:
  // Supabase REST/Realtime (wss), Google Fonts, Konva (canvas), пиксели Meta/TikTok/GA.
  // Nuxt-гидрация требует 'unsafe-inline' в script-src (inline payload).
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Content-Security-Policy': [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://analytics.tiktok.com https://www.googletagmanager.com https://www.google-analytics.com",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.facebook.com https://analytics.tiktok.com https://www.google-analytics.com",
            "frame-src 'self'",
          ].join('; '),
        },
      },
    },
  },
})
