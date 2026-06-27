<script setup lang="ts">
// Лёгкий онбординг конструктора (§7): три шага сборки дизайна. Показывается один
// раз (флаг в localStorage), закрывается кнопкой. Не перекрывает работу — это
// тонкая полоса-подсказка под верхней панелью, появляется с reveal.
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'inkmade_customizer_onboarded'
const show = ref(false)

onMounted(() => {
  try {
    if (!localStorage.getItem(STORAGE_KEY)) show.value = true
  } catch { /* приватный режим — просто покажем один раз за сессию */ }
})

function dismiss() {
  show.value = false
  try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
}

const steps = [
  { icon: 'i-lucide-target', key: 'step1' },
  { icon: 'i-lucide-image-plus', key: 'step2' },
  { icon: 'i-lucide-shopping-cart', key: 'step3' },
] as const
</script>

<template>
  <Transition name="onb">
    <div
      v-if="show"
      class="ink-grain relative mb-4 overflow-hidden rounded-xl bg-ink-burgundy px-4 py-3 text-ink-cream"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <span class="ink-label text-ink-cream/70 shrink-0">{{ $t('customize.page.onboarding.title') }}</span>
          <ol class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
            <li v-for="(s, i) in steps" :key="s.key" class="flex items-center gap-2">
              <span class="grid size-6 shrink-0 place-items-center rounded-full bg-ink-cream/15">
                <UIcon :name="s.icon" class="size-3.5" />
              </span>
              <span class="text-caption">
                <b class="font-semibold tabular-nums">{{ i + 1 }}.</b>
                {{ $t(`customize.page.onboarding.${s.key}`) }}
              </span>
            </li>
          </ol>
        </div>
        <UButton
          color="neutral"
          variant="solid"
          size="xs"
          class="shrink-0 self-start sm:self-auto"
          @click="dismiss"
        >
          {{ $t('customize.page.onboarding.gotIt') }}
        </UButton>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.onb-enter-active,
.onb-leave-active {
  transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out);
}
.onb-enter-from,
.onb-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
