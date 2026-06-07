-- 0020: расширить допустимые методы нанесения (§5.2.1).
-- Было dtg/dtf/sublimation → добавляем silkscreen (шелкография) и embroidery (вышивка)
-- для хлопка (zonal). Синхронно с shared/config/print-methods.ts (PrintMethod).
alter table public.materials drop constraint if exists materials_print_method_check;
alter table public.materials
  add constraint materials_print_method_check
  check (print_method in ('dtg', 'dtf', 'silkscreen', 'embroidery', 'sublimation'));
