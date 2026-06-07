-- 0018: модерация пользовательских загрузок (§24, P2.14).
-- Каждый дизайн проходит модерацию перед печатью — защита от печати чужого
-- копирайта/запрещённого контента. Жёсткий гейт «нельзя в printing без approved»
-- реализован на уровне приложения (server/api/orders/[id]/status.post.ts).

alter table public.designs
  add column if not exists moderation_status text not null default 'pending';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'designs_moderation_status_check'
  ) then
    alter table public.designs
      add constraint designs_moderation_status_check
      check (moderation_status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

comment on column public.designs.moderation_status is
  'Статус модерации загрузки: pending|approved|rejected. Гейт перед печатью.';

-- Гард: статус модерации может менять только сотрудник.
-- Владелец дизайна (authenticated, auth.uid() != null, не staff) — НЕ может само-одобрить.
-- Service role (auth.uid() is null) проходит — серверный эндпоинт делает свою проверку роли.
create or replace function public.guard_design_moderation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.moderation_status is distinct from old.moderation_status then
    if auth.uid() is not null and not private.is_staff() then
      raise exception 'Менять статус модерации может только сотрудник';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_design_moderation() from public, anon, authenticated;

drop trigger if exists trg_guard_design_moderation on public.designs;
create trigger trg_guard_design_moderation
  before update on public.designs
  for each row execute function public.guard_design_moderation();
