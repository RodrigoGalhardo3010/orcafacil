import type { H3Event } from 'h3'

export function normalizeItems(items: any[]) {
  if (!Array.isArray(items) || items.length === 0) throw createError({ statusCode: 400, statusMessage: 'Adicione pelo menos um item.' })
  return items.map((item, index) => {
    const description = String(item.description || '').trim()
    const quantity = Number(item.quantity)
    const unitPrice = Number(item.unit_price)
    if (!description) throw createError({ statusCode: 400, statusMessage: `Informe a descrição do item ${index + 1}.` })
    if (!Number.isFinite(quantity) || quantity <= 0) throw createError({ statusCode: 400, statusMessage: `Quantidade inválida no item ${index + 1}.` })
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw createError({ statusCode: 400, statusMessage: `Valor inválido no item ${index + 1}.` })
    return { description, quantity, unit_price: unitPrice, sort_order: index }
  })
}

export function proposalTotals(items: any[], discountValue: any) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0)
  const discount = Math.max(0, Number(discountValue || 0))
  const total = Math.max(0, subtotal - discount)
  return { subtotal: roundMoney(subtotal), discount: roundMoney(discount), total: roundMoney(total) }
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function cleanProposalBody(body: any) {
  const clientName = String(body.client_name || '').trim()
  const title = String(body.title || '').trim()
  if (!clientName) throw createError({ statusCode: 400, statusMessage: 'Informe o cliente.' })
  if (!title) throw createError({ statusCode: 400, statusMessage: 'Informe o título da proposta.' })
  const items = normalizeItems(body.items)
  const totals = proposalTotals(items, body.discount)
  return {
    proposal: {
      client_name: clientName,
      client_email: String(body.client_email || '').trim() || null,
      client_phone: String(body.client_phone || '').trim() || null,
      title,
      introduction: String(body.introduction || '').trim() || null,
      valid_until: body.valid_until || null,
      payment_terms: String(body.payment_terms || '').trim() || null,
      notes: String(body.notes || '').trim() || null,
      currency: 'BRL',
      ...totals
    },
    items
  }
}

export async function getProposalForOwner(event: H3Event, proposalId: string, userId: string) {
  const supabase = getAdminClient(event)
  const { data: proposal, error } = await supabase.from('proposals').select('*').eq('id', proposalId).eq('user_id', userId).single()
  if (error || !proposal) throw createError({ statusCode: 404, statusMessage: 'Proposta não encontrada.' })
  const { data: items, error: itemsError } = await supabase.from('proposal_items').select('*').eq('proposal_id', proposal.id).order('sort_order')
  if (itemsError) throw createError({ statusCode: 500, statusMessage: 'Erro ao carregar itens.' })
  return { proposal, items: items || [] }
}
