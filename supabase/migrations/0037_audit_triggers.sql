-- 0037: расширение аудит-трейла (CRM §6.11). До этого логировались только смена роли (0027)
-- и изменение товара. Добавляем: модерация принтов, статус выплат, промокоды, ставка роялти.

-- универсальный логгер: пишет полный снимок строки до/после в admin_audit_log
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_audit_log (actor_id, action, entity, entity_id, before, after)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;
revoke all on function public.audit_row_change() from public, anon, authenticated;

-- модерация принтов
drop trigger if exists trg_audit_print_mod on public.print_library;
create trigger trg_audit_print_mod after update on public.print_library
  for each row when (old.moderation_status is distinct from new.moderation_status)
  execute function public.audit_row_change();

-- статус выплат дизайнерам
drop trigger if exists trg_audit_payout on public.payouts;
create trigger trg_audit_payout after update on public.payouts
  for each row when (old.status is distinct from new.status)
  execute function public.audit_row_change();

-- промокоды (создание и правки)
drop trigger if exists trg_audit_promo on public.promo_codes;
create trigger trg_audit_promo after insert or update on public.promo_codes
  for each row execute function public.audit_row_change();

-- изменение ставки роялти дизайнера
drop trigger if exists trg_audit_royalty on public.designer_profiles;
create trigger trg_audit_royalty after update on public.designer_profiles
  for each row when (old.royalty_pct is distinct from new.royalty_pct)
  execute function public.audit_row_change();
