import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'

function load(file, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText
  const context = {
    exports: {}, require: createRequire(import.meta.url),
    createError: details => Object.assign(new Error(details.statusMessage), details),
    ...globals
  }
  vm.runInNewContext(code, context, { filename: file })
  return context.exports
}

test('runtime environment prefers Cloudflare bindings and keeps the Nuxt fallback', () => {
  const { getRuntimeEnv } = load('server/utils/runtime-env.ts')
  const event = { context: { cloudflare: { env: { SECRET: 'worker-secret' } } } }

  assert.equal(getRuntimeEnv(event, 'SECRET', 'nuxt-value'), 'worker-secret')
  assert.equal(getRuntimeEnv({ context: {} }, 'SECRET', 'nuxt-value'), 'nuxt-value')
})

for (const secret of ['', 'unit-test-secret']) {
  test(`webhook rejects ${secret ? 'invalid signatures' : 'missing configuration'} before calling billing`, async () => {
    let billingCalls = 0
    const handler = load('server/api/billing/webhook.post.ts', {
      defineEventHandler: handler => handler,
      readBody: async () => ({ type: 'subscription_preapproval', data: { id: '123' } }),
      getQuery: () => ({}), getHeader: () => '',
      useRuntimeConfig: () => ({ mercadoPagoWebhookSecret: secret }),
      mercadoPagoRequest: async () => { billingCalls++; return {} }
    }).default
    await assert.rejects(handler({}), error => error.statusCode === (secret ? 401 : 503))
    assert.equal(billingCalls, 0)
  })
}

test('email sends escaped HTML to Resend and propagates provider failure', async () => {
  let payload
  let succeed = true
  const email = load('server/utils/email.ts', {
    useRuntimeConfig: () => ({ resendApiKey: 'test-key' }),
    fetch: async (url, options) => {
      assert.equal(url, 'https://api.resend.com/emails')
      assert.equal(options.method, 'POST')
      payload = JSON.parse(options.body)
      return { ok: succeed, json: async () => ({ id: 'unit-test-id' }) }
    }
  })
  const result = await email.sendProposalEmail({}, 'test@example.com', '<Company>', '<Client>', '<Title>', 'https://example.com/p/demo')
  assert.equal(result.sent, true)
  assert.equal(result.id, 'unit-test-id')
  assert.deepEqual(payload.to, ['test@example.com'])
  assert.ok(payload.html.includes('&lt;Client&gt;'))
  assert.ok(!payload.html.includes('<Company>'))
  succeed = false
  await assert.rejects(email.sendOwnerResponseEmail({}, 'test@example.com', 'Client', 'Title', 'accepted'), error => error.statusCode === 502)
})

test('unconfigured email does not call the provider', async () => {
  const email = load('server/utils/email.ts', {
    useRuntimeConfig: () => ({ resendApiKey: '' }),
    fetch: () => { throw new Error('Unexpected external request') }
  })
  assert.equal((await email.sendProposalEmail({}, '', '', '', '', '')).sent, false)
})
