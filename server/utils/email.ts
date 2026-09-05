import type { H3Event } from 'h3'

async function deliverEmail(apiKey: string, payload: { from: string, to: string, subject: string, html: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, to: [payload.to] })
  })
  if (!response.ok) throw createError({ statusCode: 502, statusMessage: 'Falha no envio de e-mail.' })
  return await response.json() as { id: string }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char))
}

export async function sendProposalEmail(event: H3Event, to: string, companyName: string, clientName: string, title: string, url: string) {
  const config = useRuntimeConfig(event)
  if (!config.resendApiKey) return { sent: false, reason: 'resend_not_configured' }
  const result = await deliverEmail(config.resendApiKey, {
    from: 'OrçaFácil <propostas@orcafacil.com.br>',
    to,
    subject: `${companyName} enviou uma proposta: ${title}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px"><h2>Olá, ${escapeHtml(clientName)}</h2><p>${escapeHtml(companyName)} enviou uma proposta comercial para você.</p><p><strong>${escapeHtml(title)}</strong></p><p style="margin:28px 0"><a href="${url}" style="background:#16a34a;color:white;text-decoration:none;padding:12px 18px;border-radius:8px">Abrir proposta</a></p><p style="color:#64748b;font-size:12px">Você poderá visualizar e responder pelo celular.</p></div>`
  })
  return { sent: true, id: result.id }
}

export async function sendOwnerResponseEmail(event: H3Event, to: string, clientName: string, title: string, decision: string) {
  const config = useRuntimeConfig(event)
  if (!config.resendApiKey) return { sent: false }
  const accepted = decision === 'accepted'
  await deliverEmail(config.resendApiKey, {
    from: 'OrçaFácil <notificacoes@orcafacil.com.br>',
    to,
    subject: accepted ? `Proposta aceita por ${clientName}` : `Proposta recusada por ${clientName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px"><h2>${accepted ? 'Proposta aceita' : 'Proposta recusada'}</h2><p><strong>${escapeHtml(clientName)}</strong> respondeu à proposta <strong>${escapeHtml(title)}</strong>.</p></div>`
  })
  return { sent: true }
}
