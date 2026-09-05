import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Include staged ignored files as well as other files eligible for publication.
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))]
const patterns = [
  ['Mercado Pago token', /(?:APP_USR|TEST)-[A-Za-z0-9_-]{10,}/],
  ['Supabase secret', /sb_secret_[A-Za-z0-9_-]{10,}/],
  ['Resend key', /\bre_[A-Za-z0-9_-]{20,}/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['Private key', /-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['Database URL with password', /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:/]+:[^\s@]+@/],
  ['Credential assignment', /(?:password|passwd|api[_-]?key|access[_-]?token|client[_-]?secret|service[_-]?role[_-]?key)\s*[:=]\s*["'][^"'\s]{12,}["']/i]
]
const findings = []
for (const file of files) {
  if (/(?:^|\/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|id_rsa|id_ed25519)$|\.(?:pem|key|p12|pfx)$/i.test(file) && file !== '.env.example') {
    findings.push(`${file}: credential file must not be published`)
  }
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  for (const [index, line] of lines.entries()) {
    for (const [label, pattern] of patterns) {
      if (pattern.test(line)) findings.push(`${file}:${index + 1}: ${label}`)
    }
  }
}
if (findings.length) {
  console.error(findings.join('\n'))
  process.exit(1)
}
console.log(`${files.length} files scanned; no credential patterns found. Values are never printed. This check does not replace review.`)
