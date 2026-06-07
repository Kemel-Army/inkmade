<script setup lang="ts">
// Публичная страница расшаренного дизайна (P4.22). Без авторизации — точка входа
// вирального охвата: гость видит превью и ведётся в конструктор «создать свой».
interface SharedDesign {
  preview: string | null
  product: { title: string; slug: string; alias: string } | null
}

const route = useRoute()
const token = route.params.token as string

const { data, error } = await useAsyncData(`shared-${token}`, () =>
  $fetch<SharedDesign>(`/api/designs/shared/${token}`),
)
if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Дизайн не найден' })
}

const productTitle = computed(() => data.value?.product?.title ?? 'INKMADE')
const customizeTo = computed(() =>
  data.value?.product?.alias ? `/customize/${data.value.product.alias}` : '/catalog',
)

useSeoMeta({
  title: `${productTitle.value} — дизайн на INKMADE`,
  description: 'Смотри дизайн, созданный в конструкторе INKMADE, и сделай свой — печать по требованию от одной штуки.',
  ogTitle: `${productTitle.value} — дизайн на INKMADE`,
  ogDescription: 'Создай свой принт в браузере и закажи от одной штуки.',
  ogImage: () => data.value?.preview ?? undefined,
})
</script>

<template>
  <section v-if="data" class="max-w-xl mx-auto py-10 text-center space-y-6">
    <UiSectionLabel accent>Дизайн с INKMADE</UiSectionLabel>
    <h1 class="ink-display text-h2">{{ productTitle }}</h1>

    <div class="border border-ink-gray-200 rounded-lg overflow-hidden bg-ink-white aspect-square max-w-md mx-auto flex items-center justify-center">
      <img v-if="data.preview" :src="data.preview" :alt="`Дизайн — ${productTitle}`" class="w-full h-full object-contain">
      <UIcon v-else name="i-lucide-shapes" class="size-12 text-ink-gray-400" />
    </div>

    <p class="text-ink-gray-600">Нравится? Собери свой принт в браузере и закажи от одной штуки.</p>

    <div class="flex flex-col sm:flex-row gap-3 justify-center">
      <UButton :to="customizeTo" color="primary" size="lg" icon="i-lucide-wand-2">Создать свой принт</UButton>
      <UButton to="/catalog" color="neutral" variant="ghost" size="lg">Смотреть каталог</UButton>
    </div>
  </section>
</template>
