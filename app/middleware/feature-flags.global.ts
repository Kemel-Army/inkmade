import { FEATURE_ROUTES } from '~~/shared/config/features'

// Глобальный гейт скрытых фич. Пока фича выключена, её роуты «не существуют» —
// прямой переход отдаёт 404. Вернуть фичу = включить флаг в shared/config/features.ts.
export default defineNuxtRouteMiddleware((to) => {
  const blocked = FEATURE_ROUTES.some(
    r => !r.enabled && (to.path === r.prefix || to.path.startsWith(r.prefix + '/')),
  )
  if (blocked) {
    return abortNavigation(createError({ statusCode: 404, statusMessage: 'Page Not Found' }))
  }
})
