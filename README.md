# INKMADE

Кастомизатор и магазин печати на одежде. Nuxt 4 + Supabase, хостинг на Vercel.

## Стек
- **Frontend/SSR:** Nuxt 4 (Vue 3)
- **База данных и авторизация:** Supabase (PostgreSQL + Auth + RLS)
- **Хостинг:** Vercel (автодеплой из ветки `main`)

## Локальный запуск
```bash
npm install
cp .env.example .env   # заполнить своими ключами
npm run dev
```

## Деплой
Push в ветку `main` автоматически собирает и публикует продакшен на Vercel.
Секреты (`.env`) в репозиторий не коммитятся — они задаются в настройках проекта Vercel.
