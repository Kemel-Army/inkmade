<script setup lang="ts">
import type { Database } from '~/types/database.types'

// Профиль клиента (CRM §3.1): просмотр + правка имени/телефона + смена пароля.
definePageMeta({ layout: 'account', middleware: 'auth' })
const { profile, user, fetchProfile } = useAuth()
const supabase = useSupabaseClient<Database>()
const toast = useToast()

const form = reactive({ full_name: profile.value?.full_name ?? '', phone: profile.value?.phone ?? '' })
watchEffect(() => {
  form.full_name = profile.value?.full_name ?? ''
  form.phone = profile.value?.phone ?? ''
})

const saving = ref(false)
async function saveProfile() {
  if (!user.value) return
  saving.value = true
  try {
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone }).eq('id', user.value.id)
    if (error) throw error
    await fetchProfile(true)
    toast.add({ title: 'Профиль сохранён', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Ошибка', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const pwd = reactive({ value: '' })
const changingPwd = ref(false)
async function changePassword() {
  if (pwd.value.length < 6) { toast.add({ title: 'Пароль слишком короткий', description: 'Минимум 6 символов', color: 'warning' }); return }
  changingPwd.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: pwd.value })
    if (error) throw error
    pwd.value = ''
    toast.add({ title: 'Пароль изменён', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Ошибка', description: (e as Error).message, color: 'error' })
  } finally {
    changingPwd.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <UiPageHeader label="Профиль" title="Личный кабинет" description="Ваши контактные данные и безопасность аккаунта." />

    <div class="space-y-6">
      <UiPanel title="Личные данные" icon="i-lucide-user">
        <div class="space-y-4">
          <UFormField label="Email">
            <UInput :model-value="user?.email" disabled class="w-full" />
          </UFormField>
          <UFormField label="Имя и фамилия">
            <UInput v-model="form.full_name" class="w-full" />
          </UFormField>
          <UFormField label="Телефон">
            <UInput v-model="form.phone" type="tel" placeholder="+7 700 000 00 00" class="w-full" />
          </UFormField>
          <UButton color="primary" size="lg" :loading="saving" @click="saveProfile">Сохранить</UButton>
        </div>
      </UiPanel>

      <UiPanel title="Смена пароля" icon="i-lucide-lock" subtitle="Минимум 8 символов: буквы и цифры.">
        <div class="flex flex-wrap items-end gap-3">
          <UFormField label="Новый пароль" class="flex-1 min-w-56">
            <UInput v-model="pwd.value" type="password" autocomplete="new-password" class="w-full" />
          </UFormField>
          <UButton color="neutral" variant="subtle" size="lg" :loading="changingPwd" @click="changePassword">Изменить</UButton>
        </div>
      </UiPanel>
    </div>
  </div>
</template>
