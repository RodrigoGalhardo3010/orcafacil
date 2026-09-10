export default defineNuxtConfig({
  compatibilityDate: '2026-08-26',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css', '~/assets/css/premium.css'],
  nitro: {
    preset: 'cloudflare'
  },
  runtimeConfig: {
    supabaseServiceRoleKey: '',
    mercadoPagoAccessToken: '',
    mercadoPagoWebhookSecret: '',
    mercadoPagoPayerEmailOverride: '',
    resendApiKey: '',
    resendFromEmail: 'OrçaFácil <onboarding@resend.dev>',
    deepseekApiKey: '',
    deepseekModel: 'deepseek-v4-flash',
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
        { name: 'theme-color', content: '#090a0f' },
        {
          name: 'description',
          content: 'Crie propostas comerciais profissionais, envie pelo WhatsApp e acompanhe o aceite do cliente.'
        }
      ]
    }
  }
})
