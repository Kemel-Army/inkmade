-- CRM: карточка клиента 360°. RPC для админа — список клиентов с агрегатами и
-- детальный профиль (контакты + адреса + заказы + LTV). SECURITY DEFINER, т.к.
-- адреса под owner-RLS, а админу нужен полный обзор. Проверка роли внутри.

-- список клиентов с агрегатами (заказы, потрачено, последний заказ)
create or replace function public.admin_list_customers()
returns table(
  id uuid, email text, full_name text, phone text,
  marketing_consent boolean, created_at timestamptz,
  orders_count bigint, total_spent numeric, last_order_at timestamptz
)
language plpgsql security definer set search_path to ''
as $function$
begin
  if not private.is_admin() then raise exception 'Недостаточно прав'; end if;
  return query
    select p.id, u.email::text, p.full_name, p.phone, p.marketing_consent, p.created_at,
      count(o.id) as orders_count,
      coalesce(sum(o.total) filter (where o.paid_at is not null), 0)::numeric as total_spent,
      max(o.created_at) as last_order_at
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.orders o on o.user_id = p.id
    where p.role = 'customer'
    group by p.id, u.email, p.full_name, p.phone, p.marketing_consent, p.created_at
    order by max(o.created_at) desc nulls last, p.created_at desc;
end;
$function$;

-- детальная карточка клиента: профиль + адреса + заказы + сводка
create or replace function public.admin_customer(p_id uuid)
returns json
language plpgsql security definer set search_path to ''
as $function$
declare result json;
begin
  if not private.is_admin() then raise exception 'Недостаточно прав'; end if;
  select json_build_object(
    'profile', (
      select row_to_json(x) from (
        select p.id, u.email, p.full_name, p.phone, p.marketing_consent, p.role, p.created_at
        from public.profiles p join auth.users u on u.id = p.id
        where p.id = p_id
      ) x
    ),
    'addresses', (
      select coalesce(json_agg(a order by a.is_default desc), '[]'::json)
      from public.addresses a where a.user_id = p_id
    ),
    'orders', (
      select coalesce(json_agg(o order by o.created_at desc), '[]'::json)
      from (
        select id, status, total, currency, created_at, paid_at, tracking_no
        from public.orders where user_id = p_id
      ) o
    ),
    'stats', (
      select json_build_object(
        'orders_count', count(*),
        'total_spent', coalesce(sum(total) filter (where paid_at is not null), 0),
        'last_order_at', max(created_at)
      ) from public.orders where user_id = p_id
    )
  ) into result;
  return result;
end;
$function$;

comment on function public.admin_list_customers() is
  'SECURITY DEFINER. EXECUTE для authenticated НАМЕРЕННО: внутренняя проверка private.is_admin(). НЕ REVOKE.';
comment on function public.admin_customer(uuid) is
  'SECURITY DEFINER. EXECUTE для authenticated НАМЕРЕННО: внутренняя проверка private.is_admin(). НЕ REVOKE.';
