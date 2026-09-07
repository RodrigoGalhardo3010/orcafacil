export type QuoteItem = {
  description: string
  quantity: number
  unit_price: number
}

export type QuoteDraft = {
  service_area: string
  client_name: string
  client_email: string
  client_phone: string
  title: string
  introduction: string
  valid_until: string
  payment_terms: string
  notes: string
  discount: number
  items: QuoteItem[]
}

export type QuoteAssistantResult = {
  draft: QuoteDraft
  assistant_message: string
  ready: boolean
  missing_fields: string[]
}

const MAX_TEXT = 2000
const AREAS = new Set([
  'climatizacao', 'mecanica', 'odontologia', 'marcenaria', 'eletrica',
  'hidraulica', 'construcao', 'pintura', 'limpeza', 'tecnologia',
  'consultoria', 'outros'
])

function text(value: unknown, limit = MAX_TEXT) {
  return String(value || '').trim().slice(0, limit)
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function date(value: unknown) {
  const candidate = text(value, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : ''
}

export function emptyQuoteDraft(): QuoteDraft {
  return {
    service_area: '', client_name: '', client_email: '', client_phone: '', title: '',
    introduction: 'Obrigado pela oportunidade. Apresentamos abaixo nossa proposta comercial para a execução dos serviços descritos.',
    valid_until: '', payment_terms: '', notes: '', discount: 0, items: []
  }
}

export function sanitizeQuoteDraft(value: any): QuoteDraft {
  const source = value && typeof value === 'object' ? value : {}
  const area = text(source.service_area, 40).toLowerCase()
  const items = Array.isArray(source.items) ? source.items.slice(0, 20).map((item: any) => ({
    description: text(item?.description, 500),
    quantity: Math.max(0.01, number(item?.quantity, 1)),
    unit_price: number(item?.unit_price)
  })).filter((item: QuoteItem) => item.description) : []

  return {
    service_area: AREAS.has(area) ? area : '',
    client_name: text(source.client_name, 180),
    client_email: text(source.client_email, 254),
    client_phone: text(source.client_phone, 40),
    title: text(source.title, 180),
    introduction: text(source.introduction) || emptyQuoteDraft().introduction,
    valid_until: date(source.valid_until),
    payment_terms: text(source.payment_terms, 1000),
    notes: text(source.notes),
    discount: number(source.discount),
    items
  }
}

export function missingQuoteFields(draft: QuoteDraft) {
  const missing: string[] = []
  if (!draft.service_area) missing.push('service_area')
  if (!draft.client_name) missing.push('client_name')
  if (!draft.title) missing.push('title')
  if (!draft.items.length) missing.push('items')
  if (draft.items.some(item => !item.description || item.quantity <= 0 || item.unit_price < 0)) missing.push('item_details')
  if (!draft.valid_until) missing.push('valid_until')
  if (!draft.payment_terms) missing.push('payment_terms')
  return missing
}

export function quoteAssistantSystemPrompt(today: string) {
  return `Você é o entrevistador comercial do OrçaFácil. Sua função é elaborar propostas profissionais de serviços em português do Brasil.

Hoje é ${today}. Analise toda a conversa e o rascunho atual. Extraia somente informações que o usuário forneceu. Nunca invente preços, quantidades, medidas, materiais, prazos, garantias, diagnóstico ou dados do cliente. Faça uma única pergunta curta por resposta, escolhendo a informação mais importante ainda ausente.

Adapte a entrevista à área:
- climatização: equipamento/BTUs, instalação ou manutenção, ambiente, materiais, acesso, elétrica/dreno, prazo e garantia;
- mecânica: veículo/modelo/ano, problema ou serviço definido, peças, mão de obra, prazo e garantia;
- odontologia: procedimento já definido pelo profissional, região ou dente, sessões, materiais, exames, prazo e pagamento. Não diagnostique nem prometa resultado clínico;
- marcenaria: móvel/projeto, medidas, material, acabamento, ferragens, entrega, instalação e prazo;
- elétrica/hidráulica/construção/pintura/limpeza/tecnologia/consultoria/outros: escopo, local, quantidade ou dimensão, materiais, inclusões, exclusões, prazo e garantia aplicáveis.

Monte itens comerciais claros. Separe mão de obra, peças ou materiais quando o usuário informar valores separados. Preserve detalhes profissionais em notes. Campos obrigatórios para concluir: área, cliente, título, ao menos um item com descrição/quantidade/preço, validade e pagamento. E-mail e WhatsApp do cliente são opcionais.

Responda exclusivamente com um objeto JSON com estas propriedades: draft, assistant_message, ready, missing_fields. draft deve conter service_area, client_name, client_email, client_phone, title, introduction, valid_until no formato YYYY-MM-DD, payment_terms, notes, discount numérico e items (description, quantity, unit_price). ready só pode ser true quando todos os campos obrigatórios estiverem completos.`
}

export function validateAssistantResult(value: any): QuoteAssistantResult {
  const draft = sanitizeQuoteDraft(value?.draft)
  const missing = missingQuoteFields(draft)
  return {
    draft,
    assistant_message: text(value?.assistant_message, 600) || (missing.length ? 'Pode me informar o próximo dado do orçamento?' : 'A proposta está pronta para sua revisão.'),
    ready: missing.length === 0,
    missing_fields: missing
  }
}
