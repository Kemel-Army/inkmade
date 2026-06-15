// Сайт только светлый (кремовая палитра, §2.2). Жёстко форсим light, перебивая
// возможный сохранённый в браузере тёмный режим (иначе компоненты Nuxt UI —
// поля, меню — рендерятся тёмными поверх светлого фона).
export default defineNuxtPlugin(() => {
  const colorMode = useColorMode()
  colorMode.preference = 'light'
  colorMode.value = 'light'
})
