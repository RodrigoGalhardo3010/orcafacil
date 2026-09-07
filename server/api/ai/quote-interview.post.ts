const quoteResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['draft', 'assistant_message', 'ready', 'missing_fields'],
  properties: {
    draft: {
      type: 'object',
      additionalProperties: false,
      required: [
        'service_area', 'client_name', 'client_email', 'client_phone', 'title',
        'introduction', 'valid_until', 'payment_terms', 'notes', 'discount', 'items'
      ],
      properties: {
        service_area: { type: 'string' },
        client_name: { type: 'string' },
        client_email: { type: 'string' },
        client_phone: { type: 'string' },
        title: { type: 'string' },
        introduction: { type: 'string' },
        valid_until: { type: 'string' },
        payment_terms: { type: 'string' },
        notes: { type: 'string' },
        discount: { type: 'number' },
        items: {
          type: 'array',
          maxItems: 20,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['description', 'quantity', 'unit_price'],
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number' },
              unit_price: { type: 'number' }
            }
          }
        }
      }
    },
    assistant_message: { type: 'string' },
    ready: { type: 'boolean' },
    missing_fields: { type: 'array', items: { type: 'string' } }
  }
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const config = useRuntimeConfig(event)
  const apiKey = getRuntimeEnv(event, 'NUXT_DEEPSEEK_API_KEY', config.deepseekApiKey)
  const model = getRuntimeEnv(event, 'NUXT_DEEPSEEK_MODEL', config.deepseekModel) || 'deepseek-v4-flash'

  if (!apiKey) {
    throw createError({ statusCode: 503, statusMessage: 'O assistente de IA ainda não foi configurado.' })
  }

  const incoming = Array.isArray(body?.messages) ? body.messages.slice(-24) : []
  const messages = incoming.map((message: any) => ({
    role: message?.role === 'assistant' ? 'assistant' : 'user',
    content: String(message?.content || '').trim().slice(0, 2000)
  })).filter((message: any) => message.content)

  if (!messages.length) throw createError({ statusCode: 400, statusMessage: 'Escreva uma mensagem para iniciar o orçamento.' })

  const currentDraft = sanitizeQuoteDraft(body?.draft)
  const today = new Date().toISOString().slice(0, 10)

  if (isQuotePromptInjection(messages.at(-1)?.content)) {
    return validateAssistantResult({
      draft: currentDraft,
      assistant_message: 'Posso ajudar somente a elaborar esta proposta comercial. Qual informação do serviço você quer acrescentar? Ex.: escopo, quantidade ou valor.'
    })
  }

  const baseInstructions = `${quoteAssistantSystemPrompt(today)}\n\nRascunho atual validado pelo servidor: ${JSON.stringify(currentDraft)}`

  async function requestAssistant(extraInstruction = '') {
    const response = await fetch('https://api.deepseek.com/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        instructions: extraInstruction ? `${baseInstructions}\n\n${extraInstruction}` : baseInstructions,
        input: messages,
        reasoning: { effort: 'none' },
        temperature: 0.2,
        max_output_tokens: 2200,
        user: user.id,
        text: {
          format: {
            type: 'json_schema',
            name: 'orcafacil_quote_interview',
            schema: quoteResponseSchema
          }
        }
      }),
      signal: AbortSignal.timeout(30000)
    }).catch(() => null)

    if (!response?.ok) return null
    const payload: any = await response.json()
    if (payload?.status !== 'completed') return null

    const message = Array.isArray(payload?.output)
      ? payload.output.find((item: any) => item?.type === 'message')
      : null
    const content = Array.isArray(message?.content)
      ? message.content.find((part: any) => part?.type === 'output_text')?.text
      : null

    if (!content) return null
    try {
      return validateAssistantResult(parseAssistantContent(content))
    } catch {
      return null
    }
  }

  const result = await requestAssistant()
    || await requestAssistant('Gere novamente o resultado completo. Preencha todos os campos do schema, use strings vazias para dados ainda não informados e faça apenas uma pergunta curta em assistant_message.')

  if (!result) {
    throw createError({ statusCode: 502, statusMessage: 'A resposta da IA não pôde ser validada. Seu rascunho foi preservado.' })
  }

  return result
})
