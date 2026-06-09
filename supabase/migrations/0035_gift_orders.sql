-- 0035: подарочные заказы (CRM §3.1 «Подарочные заказы»).
-- Получатель, открытка и опция «скрыть цену в упаковке». Цех видит это для упаковки.

alter table public.orders add column if not exists is_gift boolean not null default false;
alter table public.orders add column if not exists gift_recipient text;
alter table public.orders add column if not exists gift_message text;
alter table public.orders add column if not exists gift_hide_price boolean not null default false;

-- studio_get_order: добавляем подарочные поля (нужны цеху для упаковки, без финансов)
create or replace function public.studio_get_order(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not private.is_staff() then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'id', o.id,
    'status', o.status,
    'created_at', o.created_at,
    'tracking_no', o.tracking_no,
    'carrier', o.carrier,
    'shipping_addr', o.shipping_addr,
    'is_gift', o.is_gift,
    'gift_recipient', o.gift_recipient,
    'gift_message', o.gift_message,
    'gift_hide_price', o.gift_hide_price,
    'order_items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', oi.id,
        'quantity', oi.quantity,
        'print_method', oi.print_method,
        'designs', (
          select jsonb_build_object(
            'id', d.id,
            'spec', d.spec,
            'original_url', d.original_url,
            'preview_url', d.preview_url,
            'moderation_status', d.moderation_status
          )
          from public.designs d where d.id = oi.design_id
        ),
        'variants', (
          select jsonb_build_object(
            'color_name', v.color_name,
            'color_hex', v.color_hex,
            'size', v.size,
            'sku', v.sku,
            'products', (select jsonb_build_object('title', p.title) from public.products p where p.id = v.product_id),
            'materials', (
              select jsonb_build_object('name', m.name, 'print_method', m.print_method, 'print_mode', m.print_mode)
              from public.materials m where m.id = v.material_id
            )
          )
          from public.variants v where v.id = oi.variant_id
        )
      ))
      from public.order_items oi where oi.order_id = o.id
    ), '[]'::jsonb),
    'order_status_log', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id,
        'from_status', l.from_status,
        'to_status', l.to_status,
        'note', l.note,
        'created_at', l.created_at
      ) order by l.created_at)
      from public.order_status_log l where l.order_id = o.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.orders o
  where o.id = p_id and o.paid_at is not null;

  if v_result is null then
    raise exception 'not found';
  end if;

  return v_result;
end;
$$;
