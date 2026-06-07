import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

// Транзакционные письма (P1.7). Провайдер — Resend (HTTP API).
// БЕЗ RESEND_API_KEY функция — no-op (как пиксели аналитики): код готов,
// реальная отправка включается добавлением ключа на запуске. Письмо НЕ критично
// для заказа — ошибки отправки не валят бизнес-операцию.

interface SendArgs {
  to: string
  subject: string
  html: string
}

export async function sendEmail(args: SendArgs): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  const from = process.env.RESEND_FROM || 'INKMADE <onboarding@resend.dev>'
  try {
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: { from, to: args.to, subject: args.subject, html: args.html },
    })
  } catch (e) {
    console.error('[email] не удалось отправить письмо:', (e as Error).message)
  }
}

type OrderEmailType = 'paid' | 'shipped' | 'delivered'

function template(type: OrderEmailType, ctx: { shortId: string; link: string; trackingNo?: string; carrier?: string }) {
  const foot = `<p style="color:#9a9a9a;font-size:13px">Статус заказа всегда доступен по ссылке: <a href="${ctx.link}">${ctx.link}</a></p>`
  switch (type) {
    case 'paid':
      return {
        subject: `INKMADE — заказ #${ctx.shortId} принят в работу`,
        html: `<h2>Спасибо за заказ!</h2><p>Оплата получена, заказ <strong>#${ctx.shortId}</strong> передан в производство. Мы напишем, когда отправим.</p>${foot}`,
      }
    case 'shipped':
      return {
        subject: `INKMADE — заказ #${ctx.shortId} отправлен`,
        html: `<h2>Заказ в пути</h2><p>Заказ <strong>#${ctx.shortId}</strong> отправлен${ctx.carrier ? ` (${ctx.carrier})` : ''}.</p>${ctx.trackingNo ? `<p>Трек-номер: <strong>${ctx.trackingNo}</strong></p>` : ''}${foot}`,
      }
    case 'delivered':
      return {
        subject: `INKMADE — заказ #${ctx.shortId} доставлен`,
        html: `<h2>Заказ доставлен</h2><p>Надеемся, вам понравилось! Поделитесь своим дизайном и расскажите друзьям про INKMADE.</p>${foot}`,
      }
  }
}

/** Уведомить клиента о ключевом статусе заказа. Best-effort, no-op без ключа. */
export async function notifyOrder(
  svc: SupabaseClient<Database>,
  orderId: string,
  type: OrderEmailType,
  extra?: { trackingNo?: string; carrier?: string },
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const { data: order } = await svc
    .from('orders')
    .select('id, user_id, shipping_addr')
    .eq('id', orderId)
    .single()
  if (!order) return

  // получатель: email из формы checkout (shipping_addr) → fallback на email аккаунта
  const addr = order.shipping_addr as { email?: string } | null
  let to = addr?.email ?? null
  if (!to) {
    const { data } = await svc.auth.admin.getUserById(order.user_id)
    to = data.user?.email ?? null
  }
  if (!to) return

  const site = process.env.NUXT_PUBLIC_SITE_URL || 'https://inkmade-pi.vercel.app'
  const tpl = template(type, {
    shortId: order.id.slice(0, 8),
    link: `${site}/order/${order.id}`,
    trackingNo: extra?.trackingNo,
    carrier: extra?.carrier,
  })
  await sendEmail({ to, subject: tpl.subject, html: tpl.html })
}
