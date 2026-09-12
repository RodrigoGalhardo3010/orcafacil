// Linha do tempo de negociação: helpers compartilhados entre os endpoints
// públicos (cliente) e autenticados (vendedor).

export async function getProposalRounds(supabase: any, proposalId: string) {
  const { data, error } = await supabase.from('proposal_negotiation_rounds')
    .select('*').eq('proposal_id', proposalId).order('seq', { ascending: true })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao carregar a negociação.' })
  return data || []
}

export function nextRoundSeq(rounds: any[]) {
  return rounds.reduce((max, round) => Math.max(max, Number(round.seq) || 0), 0) + 1
}

export function openRound(rounds: any[]) {
  return rounds.find(round => round.status === 'open') || null
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
