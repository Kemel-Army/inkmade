-- 0019: разрешить загрузку любого изображения в бакет design-uploads.
-- Раньше — только png/jpeg/svg/pdf. Теперь любой image/* + svg + pdf
-- (webp/gif/avif/bmp/tiff и пр.). Лимит размера и публичность не меняются.
update storage.buckets
set allowed_mime_types = array['image/*', 'image/svg+xml', 'application/pdf']
where id = 'design-uploads';
