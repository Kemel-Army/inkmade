// Сид каталога INKMADE (одноразовый). Запуск:
//   node --env-file=.env scripts/seed-products.mjs
// Делает 6 черновиков продаваемыми: материалы по методам (DTG/DTF/Шелкография),
// матрица вариантов (8 цветов × размеры × методы) с демо-стоком, мокап-фото по цветам
// (векторный силуэт изделия в бакете catalog), затем публикует (is_active=true).
import { createClient } from '@supabase/supabase-js'

const url = process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://jpxiuyinqhokzzcqbggf.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) { console.error('Нет SUPABASE_SERVICE_ROLE_KEY в .env'); process.exit(1) }
const sb = createClient(url, key, { auth: { persistSession: false } })

const STOCK = 40

const PALETTE = [
  { name: 'Чёрный', hex: '#111111' },
  { name: 'Белый', hex: '#FBF8F2' },
  { name: 'Серый меланж', hex: '#9A9A9A' },
  { name: 'Бордо', hex: '#7A1F28' },
  { name: 'Красный', hex: '#C0392B' },
  { name: 'Тёмно-синий', hex: '#1E2A44' },
  { name: 'Зелёный бутылочный', hex: '#1F4D3A' },
  { name: 'Бежевый', hex: '#EFE0C1' },
]

const METHODS = [
  { name: 'Хлопок · DTG', method: 'dtg' },
  { name: 'Хлопок · DTF', method: 'dtf' },
  { name: 'Хлопок · Шелкография', method: 'silkscreen' },
]

// ── силуэты изделий (копия shared/config/garment.ts, компактно) ──
function darken(hex, amount) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)))
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)))
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
function kindForSlug(slug = '') {
  const s = slug.toLowerCase()
  if (s.includes('hoodie') || s.includes('худи')) return 'hoodie'
  if (s.includes('cap') || s.includes('кепк')) return 'cap'
  return 'tee'
}
function teeSvg(hex) {
  const sh = darken(hex, 0.12), sm = darken(hex, 0.22)
  return `<path d="M170,70 L120,55 L40,120 L80,210 L120,190 L120,480 L340,480 L340,190 L380,210 L420,120 L340,55 L290,70 C282,118 250,138 230,138 C210,138 178,118 170,70 Z" fill="${hex}" stroke="${sm}" stroke-width="2"/><path d="M170,70 C178,118 210,138 230,138 C250,138 282,118 290,70 C272,96 252,108 230,108 C208,108 188,96 170,70 Z" fill="${sh}"/>`
}
function hoodieSvg(hex) {
  const sh = darken(hex, 0.12), sm = darken(hex, 0.22), pk = darken(hex, 0.08)
  return `<path d="M150,95 L120,80 L40,150 L80,235 L120,215 L120,490 L340,490 L340,215 L380,235 L420,150 L340,80 L310,95 L310,150 L150,150 Z" fill="${hex}" stroke="${sm}" stroke-width="2"/><path d="M150,95 C150,140 185,165 230,165 C275,165 310,140 310,95 C300,128 268,145 230,145 C192,145 160,128 150,95 Z" fill="${sh}" stroke="${sm}" stroke-width="2"/><rect x="155" y="350" width="150" height="95" rx="10" fill="${pk}" stroke="${sm}" stroke-width="1.5"/>`
}
function capSvg(hex) {
  const sh = darken(hex, 0.14), sm = darken(hex, 0.24)
  return `<path d="M110,300 C110,170 350,170 350,300 C350,250 110,250 110,300 Z" fill="${hex}" stroke="${sm}" stroke-width="2"/><path d="M110,300 C110,170 350,170 350,300 L300,300 C300,210 160,210 160,300 Z" fill="${sh}"/><path d="M105,300 C60,300 60,345 130,348 L350,348 C360,320 340,300 300,300 Z" fill="${sh}" stroke="${sm}" stroke-width="2"/>`
}
function garmentSvg(kind, hex) {
  const body = kind === 'hoodie' ? hoodieSvg(hex) : kind === 'cap' ? capSvg(hex) : teeSvg(hex)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 540" width="460" height="540">${body}</svg>`
}

async function run() {
  const { data: products, error } = await sb
    .from('products')
    .select('id, slug, title')
    .eq('is_active', false)
  if (error) { console.error(error.message); process.exit(1) }
  if (!products?.length) { console.log('Черновиков нет — нечего публиковать'); return }

  for (const p of products) {
    const kind = kindForSlug(p.slug)

    // размеры — из существующих вариантов, иначе по типу
    const { data: existing } = await sb.from('variants').select('size').eq('product_id', p.id)
    let sizes = [...new Set((existing ?? []).map(v => v.size))]
    if (!sizes.length) sizes = kind === 'cap' ? ['OS'] : ['S', 'M', 'L', 'XL', 'XXL']

    // материалы по методам (создаём недостающие)
    const { data: mats } = await sb.from('materials').select('id, print_method').eq('product_id', p.id)
    const matByMethod = {}
    for (const m of mats ?? []) matByMethod[m.print_method] = m.id
    for (const M of METHODS) {
      if (!matByMethod[M.method]) {
        const { data: nm, error: me } = await sb.from('materials')
          .insert({ product_id: p.id, name: M.name, fabric_type: 'cotton', print_method: M.method, print_mode: 'zonal', surcharge: 0 })
          .select('id').single()
        if (me) { console.error('material', p.slug, M.method, me.message); continue }
        matByMethod[M.method] = nm.id
      }
    }

    // пересоздаём матрицу вариантов: метод × цвет × размер, с демо-стоком
    await sb.from('variants').delete().eq('product_id', p.id)
    const rows = []
    for (const M of METHODS) {
      const matId = matByMethod[M.method]
      if (!matId) continue
      PALETTE.forEach((c, ci) => {
        for (const size of sizes) {
          rows.push({
            product_id: p.id, material_id: matId,
            color_name: c.name, color_hex: c.hex, size, stock: STOCK,
            sku: `${p.slug}-${M.method}-${ci}-${size}`.toUpperCase(),
          })
        }
      })
    }
    const { error: ve } = await sb.from('variants').insert(rows)
    if (ve) { console.error('variants', p.slug, ve.message); continue }

    // мокап-фото по цветам → бакет catalog
    await sb.from('product_images').delete().eq('product_id', p.id)
    const imgRows = []
    for (let ci = 0; ci < PALETTE.length; ci++) {
      const svg = garmentSvg(kind, PALETTE[ci].hex)
      const path = `${p.id}/mock-${ci}.svg`
      const { error: ue } = await sb.storage.from('catalog')
        .upload(path, Buffer.from(svg), { contentType: 'image/svg+xml', upsert: true })
      if (ue) { console.error('upload', p.slug, ue.message); continue }
      const { data: pub } = sb.storage.from('catalog').getPublicUrl(path)
      imgRows.push({ product_id: p.id, url: pub.publicUrl, is_primary: ci === 0, sort_order: ci })
    }
    if (imgRows.length) await sb.from('product_images').insert(imgRows)

    // публикация (триггер проверит зоны/фото/варианты)
    const { error: pe } = await sb.from('products').update({ is_active: true }).eq('id', p.id)
    if (pe) { console.error('publish', p.slug, pe.message); continue }
    console.log(`✓ ${p.slug}: вариантов ${rows.length}, фото ${imgRows.length}, опубликован`)
  }
  console.log('Готово.')
}

run().catch((e) => { console.error(e); process.exit(1) })
