-- B4 (perf): auth_rls_initplan — обернуть прямые auth.uid() в (select auth.uid()).
-- Postgres тогда вычисляет значение ОДИН раз на запрос (initplan), а не на каждую
-- строку. Семантика идентична (auth.uid() стабилен в пределах запроса). Затрагивает
-- 20 политик в 13 таблицах. private.is_admin()/is_designer()/user_role() НЕ трогаем
-- (это stable-функции, флаг initplan ставится только на прямые auth.*).
-- Все политики PERMISSIVE, роль public (как было) — пересоздаём 1:1.

-- addresses
drop policy if exists "addresses_owner_all" on public.addresses;
create policy "addresses_owner_all" on public.addresses for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- designer_balances
drop policy if exists "db_read" on public.designer_balances;
create policy "db_read" on public.designer_balances for select
  using ((designer_id = (select auth.uid())) OR private.is_admin());

-- designer_profiles
drop policy if exists "designer_profiles_read" on public.designer_profiles;
create policy "designer_profiles_read" on public.designer_profiles for select
  using ((id = (select auth.uid())) OR is_public OR private.is_admin());

drop policy if exists "designer_profiles_self_update" on public.designer_profiles;
create policy "designer_profiles_self_update" on public.designer_profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- designs
drop policy if exists "designs_owner_all" on public.designs;
create policy "designs_owner_all" on public.designs for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- favorites
drop policy if exists "favorites_owner_all" on public.favorites;
create policy "favorites_owner_all" on public.favorites for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- order_items
drop policy if exists "order_items_owner_insert" on public.order_items;
create policy "order_items_owner_insert" on public.order_items for insert
  with check (EXISTS (
    SELECT 1 FROM orders o
    WHERE ((o.id = order_items.order_id)
      AND (o.user_id = (select auth.uid()))
      AND (o.status = ANY (ARRAY['created'::text, 'pending'::text])))));

drop policy if exists "order_items_owner_read" on public.order_items;
create policy "order_items_owner_read" on public.order_items for select
  using (EXISTS (
    SELECT 1 FROM orders o
    WHERE ((o.id = order_items.order_id) AND (o.user_id = (select auth.uid())))));

-- orders
drop policy if exists "orders_owner_insert" on public.orders;
create policy "orders_owner_insert" on public.orders for insert
  with check ((user_id = (select auth.uid()))
    AND (status = ANY (ARRAY['created'::text, 'pending'::text])));

drop policy if exists "orders_owner_read" on public.orders;
create policy "orders_owner_read" on public.orders for select
  using (user_id = (select auth.uid()));

-- payouts
drop policy if exists "payouts_read" on public.payouts;
create policy "payouts_read" on public.payouts for select
  using ((designer_id = (select auth.uid())) OR private.is_admin());

-- print_library
drop policy if exists "print_library_owner_insert" on public.print_library;
create policy "print_library_owner_insert" on public.print_library for insert
  with check ((owner_id = (select auth.uid())) AND private.is_designer());

drop policy if exists "print_library_owner_update" on public.print_library;
create policy "print_library_owner_update" on public.print_library for update
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "print_library_read" on public.print_library;
create policy "print_library_read" on public.print_library for select
  using ((is_active AND (moderation_status = 'approved'::text))
    OR (owner_id = (select auth.uid())) OR private.is_admin());

-- profiles
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select
  using ((id = (select auth.uid())) OR private.is_admin());

-- защита от смены роли (with_check role = private.user_role()) сохранена 1:1
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update
  using (id = (select auth.uid()))
  with check ((id = (select auth.uid())) AND (role = private.user_role()));

-- royalty_earnings
drop policy if exists "re_read" on public.royalty_earnings;
create policy "re_read" on public.royalty_earnings for select
  using ((designer_id = (select auth.uid())) OR private.is_admin());

-- royalty_rate_history
drop policy if exists "rrh_read" on public.royalty_rate_history;
create policy "rrh_read" on public.royalty_rate_history for select
  using ((designer_id = (select auth.uid())) OR private.is_admin());

-- user_consents
drop policy if exists "consents_owner_insert" on public.user_consents;
create policy "consents_owner_insert" on public.user_consents for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "consents_owner_read" on public.user_consents;
create policy "consents_owner_read" on public.user_consents for select
  using (user_id = (select auth.uid()));
