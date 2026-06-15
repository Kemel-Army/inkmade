import type { Database } from '~/types/database.types'

// CRM-данные клиентов (только admin). Список с агрегатами + карточка 360°.
// Источник — SECURITY DEFINER RPC (агрегаты заказов, адреса под owner-RLS).
export const useCustomers = () => {
  const supabase = useSupabaseClient<Database>()

  async function list() {
    const { data, error } = await supabase.rpc('admin_list_customers')
    if (error) throw error
    return data
  }

  async function get(id: string) {
    const { data, error } = await supabase.rpc('admin_customer', { p_id: id })
    if (error) throw error
    return data as {
      profile: { id: string; email: string; full_name: string | null; phone: string | null; marketing_consent: boolean; role: string; created_at: string } | null
      addresses: { id: string; full_name: string | null; phone: string | null; city: string; address: string; is_default: boolean }[]
      orders: { id: string; status: string; total: number; currency: string; created_at: string; paid_at: string | null; tracking_no: string | null }[]
      stats: { orders_count: number; total_spent: number; last_order_at: string | null }
    }
  }

  return { list, get }
}
