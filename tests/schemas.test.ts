import { describe, it, expect } from 'vitest'
import {
  orderCreateSchema,
  designImportSchema,
  promoValidateSchema,
  webhookPayloadSchema,
  shippingAddrSchema,
} from '../server/utils/schemas'

const UUID = '11111111-1111-4111-8111-111111111111'

const validAddr = { email: 'a@b.kz', phone: '+7 700 123 45 67' }
const validItem = {
  productId: UUID,
  variantId: UUID,
  printMethod: 'dtg',
  spec: { placements: [{ zone: 'front', width_mm: 100, height_mm: 100 }] },
  quantity: 2,
}

describe('shippingAddrSchema', () => {
  it('принимает валидный адрес', () => {
    expect(shippingAddrSchema.safeParse(validAddr).success).toBe(true)
  })
  it('отвергает кривой email', () => {
    expect(shippingAddrSchema.safeParse({ ...validAddr, email: 'nope' }).success).toBe(false)
  })
  it('отвергает короткий телефон', () => {
    expect(shippingAddrSchema.safeParse({ ...validAddr, phone: '12345' }).success).toBe(false)
  })
  it('сохраняет неизвестные поля (passthrough)', () => {
    const r = shippingAddrSchema.safeParse({ ...validAddr, comment: 'позвоните' })
    expect(r.success && (r.data as Record<string, unknown>).comment).toBe('позвоните')
  })
})

describe('orderCreateSchema', () => {
  it('принимает валидный заказ', () => {
    const r = orderCreateSchema.safeParse({ items: [validItem], shippingAddr: validAddr })
    expect(r.success).toBe(true)
  })
  it('отвергает пустую корзину', () => {
    expect(orderCreateSchema.safeParse({ items: [], shippingAddr: validAddr }).success).toBe(false)
  })
  it('отвергает не-uuid productId', () => {
    const bad = { ...validItem, productId: 'abc' }
    expect(orderCreateSchema.safeParse({ items: [bad], shippingAddr: validAddr }).success).toBe(false)
  })
  it('отвергает отрицательную геометрию плейсмента', () => {
    const bad = { ...validItem, spec: { placements: [{ width_mm: -5 }] } }
    expect(orderCreateSchema.safeParse({ items: [bad], shippingAddr: validAddr }).success).toBe(false)
  })
  it('отвергает Infinity в геометрии', () => {
    const bad = { ...validItem, spec: { placements: [{ width_mm: Infinity }] } }
    expect(orderCreateSchema.safeParse({ items: [bad], shippingAddr: validAddr }).success).toBe(false)
  })
  it('отвергает quantity вне диапазона', () => {
    const bad = { ...validItem, quantity: 0 }
    expect(orderCreateSchema.safeParse({ items: [bad], shippingAddr: validAddr }).success).toBe(false)
    const big = { ...validItem, quantity: 9999 }
    expect(orderCreateSchema.safeParse({ items: [big], shippingAddr: validAddr }).success).toBe(false)
  })
  it('отвергает промокод с недопустимыми символами', () => {
    const r = orderCreateSchema.safeParse({ items: [validItem], shippingAddr: validAddr, promoCode: 'код 24!' })
    expect(r.success).toBe(false)
  })
})

describe('designImportSchema', () => {
  it('принимает пустой импорт', () => {
    expect(designImportSchema.safeParse({}).success).toBe(true)
  })
  it('принимает дизайн с произвольным spec', () => {
    const r = designImportSchema.safeParse({ designs: [{ productId: UUID, spec: { any: 1 }, previewUrl: 'x' }] })
    expect(r.success).toBe(true)
  })
  it('отвергает не-uuid parentId', () => {
    expect(designImportSchema.safeParse({ designs: [{ parentId: 'bad' }] }).success).toBe(false)
  })
})

describe('promoValidateSchema', () => {
  it('принимает положительную сумму', () => {
    expect(promoValidateSchema.safeParse({ subtotal: 5000, code: 'SALE10' }).success).toBe(true)
  })
  it('отвергает отрицательную/нулевую сумму', () => {
    expect(promoValidateSchema.safeParse({ subtotal: 0 }).success).toBe(false)
    expect(promoValidateSchema.safeParse({ subtotal: -1 }).success).toBe(false)
  })
  it('отвергает NaN', () => {
    expect(promoValidateSchema.safeParse({ subtotal: NaN }).success).toBe(false)
  })
})

describe('webhookPayloadSchema', () => {
  it('принимает валидный orderId', () => {
    expect(webhookPayloadSchema.safeParse({ orderId: UUID, providerTxn: 'tx_1' }).success).toBe(true)
  })
  it('отвергает отсутствие/кривой orderId', () => {
    expect(webhookPayloadSchema.safeParse({}).success).toBe(false)
    expect(webhookPayloadSchema.safeParse({ orderId: 'nope' }).success).toBe(false)
  })
})
