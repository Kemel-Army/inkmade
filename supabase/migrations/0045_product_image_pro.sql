-- Профессиональный медиа-менеджер: видимость и альт-текст фото.
-- is_hidden — фото загружено, но скрыто от покупателя (черновик/архив без удаления).
-- alt — альтернативный текст (SEO + доступность, как в топовых платформах).

alter table public.product_images
  add column if not exists is_hidden boolean not null default false,
  add column if not exists alt text;
