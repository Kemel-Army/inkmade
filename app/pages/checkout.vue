<script setup lang="ts">
// Checkout (§9.1): логин требуется здесь, перед оплатой. Гость собирал корзину локально.
definePageMeta({ middleware: 'auth' })
useHead({ title: 'Оформление — INKMADE' })

const cart = useCart()
const { createFromCart } = useOrder()
const user = useSupabaseUser()
const toast = useToast()

const form = reactive({ full_name: '', email: '', phone: '', city: 'Алматы', address: '' })
const paying = ref(false)

onMounted(() => {
  cart.load()
  if (!cart.items.value.length) navigateTo('/cart')
  // предзаполняем email из аккаунта (можно изменить)
  if (user.value?.email) form.email = user.value.email
})

// телефон: ≥10 цифр (KZ-формат +7 7xx ...); email: базовый паттерн
const phoneDigits = computed(() => form.phone.replace(/\D/g, ''))
const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
const formValid = computed(() =>
  !!form.full_name.trim() && emailValid.value && phoneDigits.value.length >= 10
  && !!form.city.trim() && !!form.address.trim(),
)

async function onPay() {
  if (!formValid.value) {
    toast.add({ title: 'Проверьте поля', description: 'Имя, корректный email, телефон (мин. 10 цифр), город и адрес обязательны', color: 'warning' })
    return
  }
  paying.value = true
  try {
    useAnalytics().initiateCheckout(cart.total.value)
    const { orderId } = await createFromCart(cart.items.value, { ...form })
    const { payUrl } = await $fetch<{ payUrl: string }>('/api/payment/create', {
      method: 'POST',
      body: { orderId },
    })
    await navigateTo(payUrl)
  } catch (e) {
    toast.add({ title: 'Ошибка оформления', description: (e as Error).message, color: 'error' })
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <section class="grid md:grid-cols-[1fr_320px] gap-8 max-w-4xl">
    <div class="space-y-5">
      <h1 class="ink-display text-h2">Оформление</h1>
      <UFormField label="Имя и фамилия" required>
        <UInput v-model="form.full_name" autocomplete="name" class="w-full" />
      </UFormField>
      <UFormField label="Email" required help="На него придёт подтверждение заказа">
        <UInput
          v-model="form.email" type="email" autocomplete="email" placeholder="you@example.com"
          :color="form.email && !emailValid ? 'error' : undefined" class="w-full"
        />
      </UFormField>
      <UFormField label="Телефон" required>
        <UInput
          v-model="form.phone" type="tel" autocomplete="tel" placeholder="+7 700 000 00 00"
          :color="form.phone && phoneDigits.length < 10 ? 'error' : undefined" class="w-full"
        />
      </UFormField>
      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Город" required>
          <UInput v-model="form.city" class="w-full" />
        </UFormField>
        <UFormField label="Адрес доставки" required>
          <UInput v-model="form.address" class="w-full" />
        </UFormField>
      </div>
    </div>

    <aside class="border border-ink-gray-200 rounded-lg p-5 h-fit space-y-3">
      <UiSectionLabel accent>Заказ</UiSectionLabel>
      <div v-for="i in cart.items.value" :key="i.id" class="flex justify-between text-caption">
        <span>{{ i.title }} ({{ i.size }}) ×{{ i.quantity }}</span>
        <span>{{ i.unitPrice * i.quantity }} ₸</span>
      </div>
      <div class="flex justify-between border-t border-ink-gray-200 pt-3 font-semibold">
        <span>Итого</span><span class="text-ink-burgundy">{{ cart.total.value }} ₸</span>
      </div>
      <UButton color="primary" size="lg" block icon="i-lucide-credit-card" :loading="paying" :disabled="!formValid" @click="onPay">
        Перейти к оплате
      </UButton>
      <p class="text-caption text-ink-gray-400 flex items-center gap-1.5">
        <UIcon name="i-lucide-shield-check" class="shrink-0" />
        Безопасная оплата онлайн. Чек придёт на email.
      </p>
    </aside>
  </section>
</template>
