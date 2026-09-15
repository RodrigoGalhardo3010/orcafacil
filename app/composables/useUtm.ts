// Propaga os parâmetros de campanha (UTM) das páginas públicas até o cadastro.
export function useUtm() {
  const route = useRoute()
  const utmSuffix = computed(() => {
    const params = new URLSearchParams()
    for (const key of ['utm_source', 'utm_campaign', 'utm_medium', 'utm_content']) {
      const value = route.query[key]
      if (typeof value === 'string' && value) params.set(key, value)
    }
    const query = params.toString()
    return query ? `&${query}` : ''
  })
  return { utmSuffix }
}
