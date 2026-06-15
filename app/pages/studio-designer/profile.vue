<script setup lang="ts">
// Профиль дизайнера (CRM §4.4, §4.5): витрина + налоговый статус + реквизиты.
definePageMeta({ layout: 'designer', middleware: 'designer-role' })
const d = useDesigner()
const toast = useToast()

const { data: profile, refresh } = await useAsyncData('designer-profile', () => d.profile())

const form = reactive({
  display_name: '', bio: '', is_public: false, tax_status: 'individual',
  payout_bank: '', payout_account: '',
})
watchEffect(() => {
  if (!profile.value) return
  form.display_name = profile.value.display_name ?? ''
  form.bio = profile.value.bio ?? ''
  form.is_public = profile.value.is_public
  form.tax_status = profile.value.tax_status
  const pd = (profile.value.payout_details ?? {}) as { bank?: string; account?: string }
  form.payout_bank = pd.bank ?? ''
  form.payout_account = pd.account ?? ''
})

const taxItems = [
  { label: 'Физлицо', value: 'individual' },
  { label: 'Самозанятый', value: 'self_employed' },
  { label: 'ИП', value: 'ip' },
]

// аватар: загрузка → URL → сохранение в профиль
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarUploading = ref(false)
async function onAvatarPick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !profile.value) return
  avatarUploading.value = true
  try {
    const url = await d.uploadAvatar(file)
    await d.updateProfile({ avatar_url: url })
    await refresh()
    toast.add({ title: 'Аватар обновлён', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Ошибка загрузки', description: (err as Error).message, color: 'error' })
  } finally {
    avatarUploading.value = false
    if (avatarInput.value) avatarInput.value.value = ''
  }
}

const saving = ref(false)
async function save() {
  if (!profile.value) { toast.add({ title: 'Профиль не активирован администратором', color: 'warning' }); return }
  saving.value = true
  try {
    await d.updateProfile({
      display_name: form.display_name, bio: form.bio, is_public: form.is_public, tax_status: form.tax_status,
      payout_details: { bank: form.payout_bank, account: form.payout_account },
    })
    await refresh()
    toast.add({ title: 'Профиль сохранён', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Ошибка', description: (e as Error).message, color: 'error' })
  } finally { saving.value = false }
}
</script>

<template>
  <div class="max-w-lg">
    <UiPageHeader label="Профиль" title="Витрина и реквизиты" description="Публичная витрина автора и данные для выплат роялти." />

    <div v-if="!profile" class="border border-ink-warning/40 bg-ink-warning/5 rounded-lg p-4 text-caption">
      Профиль дизайнера ещё не активирован администратором.
    </div>

    <div v-else class="space-y-6">
      <UiPanel title="Витрина" icon="i-lucide-store">
        <div class="space-y-4">
          <!-- аватар -->
          <div class="flex items-center gap-4">
            <div class="size-16 rounded-full bg-ink-gray-200 overflow-hidden shrink-0">
              <img v-if="profile.avatar_url" :src="profile.avatar_url" alt="Аватар" class="w-full h-full object-cover">
              <div v-else class="w-full h-full flex items-center justify-center text-ink-gray-400">
                <UIcon name="i-lucide-user" class="size-6" />
              </div>
            </div>
            <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onAvatarPick">
            <UButton color="neutral" variant="subtle" size="sm" icon="i-lucide-image-plus" :loading="avatarUploading" @click="avatarInput?.click()">
              Загрузить аватар
            </UButton>
          </div>

          <UFormField label="Псевдоним (для витрины)"><UInput v-model="form.display_name" class="w-full" /></UFormField>
          <UFormField label="О себе"><UTextarea v-model="form.bio" :rows="3" class="w-full" /></UFormField>
          <UCheckbox v-model="form.is_public" label="Показывать публичную витрину автора" />
          <NuxtLink
            v-if="profile?.is_public"
            :to="`/designer/${profile.id}`" target="_blank"
            class="inline-flex items-center gap-1 text-caption text-ink-burgundy font-semibold"
          >
            <UIcon name="i-lucide-external-link" class="size-3" /> Открыть мою витрину
          </NuxtLink>
        </div>
      </UiPanel>

      <UiPanel title="Реквизиты для выплат" icon="i-lucide-credit-card">
        <div class="space-y-4">
          <UFormField label="Налоговый статус">
            <USelect v-model="form.tax_status" :items="taxItems" value-key="value" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Банк"><UInput v-model="form.payout_bank" class="w-full" /></UFormField>
            <UFormField label="Счёт/карта (IBAN)"><UInput v-model="form.payout_account" class="w-full" /></UFormField>
          </div>
        </div>
      </UiPanel>

      <div class="flex items-center justify-between gap-4">
        <UButton color="primary" size="lg" :loading="saving" @click="save">Сохранить</UButton>
        <p class="text-caption text-ink-gray-400">Оферта дизайнера v1.0. Налоги по выбранному статусу — на вас.</p>
      </div>
    </div>
  </div>
</template>
