export default defineNuxtConfig({
  compatibilityDate: '2026-08-26',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  nitro: {
    preset: 'cloudflare'
  },
  runtimeConfig: {
    supabaseServiceRoleKey: '',
    mercadoPagoAccessToken: '',
    mercadoPagoWebhookSecret: '',
    resendApiKey: '',
    eventHashSecret: '',
    public: {
      siteUrl: 'http://localhost:3000',
      supabaseUrl: '',
      supabasePublishableKey: ''
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      titleTemplate: '%s · OrçaFácil',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#111827' },
        {
          name: 'description',
          content: 'Crie propostas comerciais profissionais, envie pelo WhatsApp e acompanhe o aceite do cliente.'
        }
      ]
    }
  }
})
