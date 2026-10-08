import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const load = file => readFileSync(file, 'utf8')
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const scripts = ['js/supabase.js','js/core.js','js/learning.js','js/studio.js','js/app.js','sw.js']
for (const file of scripts) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
}
const page = load('index.html')
const offline = load('404.html')
const app = load('js/app.js')
const learning = load('js/learning.js')
const auth = load('js/core.js')
const config = load('js/supabase.js')
const worker = load('sw.js')
const css = load('aula-premium.css')
assert(page.includes('aula-premium.css'), 'Premium stylesheet missing')
assert(offline.includes('aula-premium.css'), 'Fallback stylesheet missing')
assert(worker.includes('aula-premium.css'), 'PWA does not cache styles')
assert(worker.includes('aula-san-pedro-shell-v5'), 'PWA version mismatch')
assert(page.includes('js/core.js') && page.includes('js/learning.js'), 'Required modules absent')
assert(config.includes('dvdpgllezrmttrknbcjq.supabase.co'), 'Wrong Supabase project')
assert(!config.includes('service_role'), 'Secret administrative key reference in browser')
assert(auth.includes('sanpedro-valle.gov.co'), 'Institutional domain missing')
assert(auth.includes('signInWithIdToken'), 'Existing Google login missing')
assert(auth.includes('use_fedcm_for_button: true'), 'FedCM support missing')
assert(auth.includes('A.backendIssue'), 'API error fallback missing')
assert(auth.includes('refreshSession()'), 'Session refresh recovery missing')
assert(auth.includes('A.accessErrorView'), 'Access recovery view missing')
assert(app.includes('A.backendIssue'), 'App must display backend recovery screen')
assert(auth.includes('aula_bootstrap'), 'Municipal membership bootstrap missing')
assert(auth.includes('aula_mark_password_changed'), 'Password gate missing')
assert(learning.includes('allRequiredComplete') && learning.includes('A.ui.examCourse=id;'),
  'Completion-to-exam navigation regression')
assert(learning.includes("aula_submit_exam"), 'Server-side assessment missing')
assert(learning.includes("aula_complete_block"), 'Progress RPC missing')
assert(css.includes('prefers-reduced-motion'), 'Reduced-motion support missing')
assert(app.includes('AulaRender'), 'Router missing')
console.log('OK: municipal JS syntax, auth contract, content routing, PWA, and static assets')
