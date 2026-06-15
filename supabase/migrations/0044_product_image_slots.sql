-- Фото-слоты товара: привязка изображения к цвету, типу и ракурсу.
-- Было: product_images плоский (url/is_primary/sort_order) — куча фото без смысла.
-- Стало: каждое фото знает свой ЦВЕТ (color_hex, null = общее), ТИП (mockup для
-- нанесения / lifestyle «на людях») и понятную МЕТКУ ракурса (label, свободный
-- текст: «Перёд», «Спина», «Деталь»). Число ракурсов не ограничено — добавляешь
-- ещё фото. Карточка товара фильтрует галерею по выбранному цвету.

alter table public.product_images
  add column if not exists color_hex text,
  add column if not exists kind text not null default 'mockup',
  add column if not exists label text;

-- тип фото: mockup (изделие) или lifestyle (на людях)
alter table public.product_images
  drop constraint if exists product_images_kind_check;
alter table public.product_images
  add constraint product_images_kind_check check (kind in ('mockup', 'lifestyle'));

-- индекс под выборку галереи по товару+цвету+типу
create index if not exists product_images_product_color_idx
  on public.product_images (product_id, color_hex, kind);
