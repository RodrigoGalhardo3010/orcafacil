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
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      thinking: { type: 'disabled' },
      temperature: 0.2,
      max_tokens: 2200,
      response_format: { type: 'json_object' },
      user_id: user.id,
      messages: [
        { role: 'system', content: quoteAssistantSystemPrompt(today) },
        { role: 'system', content: `Rascunho atual validado pelo servidor: ${JSON.stringify(currentDraft)}` },
        ...messages
      ]
    }),
    signal: AbortSignal.timeout(25000)
  }).catch(() => null)

  if (!response?.ok) {
    throw createError({ statusCode: 502, statusMessage: 'A IA está indisponível no momento. Seu rascunho foi preservado; tente novamente.' })
  }

  const payload: any = await response.json()
  const choice = payload?.choices?.[0]
  const content = choice?.message?.content
  if (!content) throw createError({ statusCode: 502, statusMessage: 'A IA não conseguiu elaborar o orçamento. Tente explicar o serviço de outra forma.' })
  if (choice?.finish_reason === 'length') throw createError({ statusCode: 502, statusMessage: 'A resposta ficou longa demais. Seu rascunho foi preservado; envie os detalhes em partes menores.' })

  try {
    return validateAssistantResult(parseAssistantContent(content))
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'A resposta da IA não pôde ser validada. Seu rascunho foi preservado.' })
  }
})
