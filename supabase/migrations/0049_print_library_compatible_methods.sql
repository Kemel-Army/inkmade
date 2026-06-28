-- 0049: совместимые методы печати у элементов библиотеки принтов (§11.1).
-- ПРОВЕНАНС: эта миграция была применена к боевой БД 2026-06-18
-- (schema_migrations version 20260618103123 'print_library_compatible_methods'),
-- но отсутствовала в файлах репозитория (применялась с другой машины).
-- Вынесена в файл для консистентности репо↔БД, чтобы чистый передеплой из репо
-- её не терял. Содержимое идентично применённому (idempotent: add column if not exists).

alter table public.print_library
  add column if not exists compatible_methods text[] not null default '{}';
comment on column public.print_library.compatible_methods is
  'Совместимые методы печати (silkscreen/dtf/sublimation/embroidery/...). Пусто = совместим со всеми — фильтр в кастомайзере (§11.1).';
