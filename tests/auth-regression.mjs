import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync('js/core.js', 'utf8')
function instance(client) {
  const root = { innerHTML: '' }
  const browser = { AulaSupabase: client }
  const context = {
    window: browser,
    document: { getElementById() { return root } },
    console: { warn() {} },
    setTimeout() {}
  }
  vm.runInNewContext(source, context, { filename: 'js/core.js' })
  return { app: browser.AulaDemo, root }
}
const session = { user: { id: 'test-user', email: 'persona@sanpedro-valle.gov.co' } }

// Autenticación válida pero ejecución SQL denegada: no renovar JWT ni elevar permisos.
{
  let refreshCount = 0
  const { app } = instance({
    rpc: async () => ({ error: { status: 401, code: '42501', message: 'permission denied' } }),
    auth: {
      getUser: async () => ({ data: { user: session.user }, error: null }),
      refreshSession: async () => { refreshCount++; throw Error('do not refresh valid sessions') }
    }
  })
  app.session = session
  await assert.rejects(app.rpc('aula_bootstrap'), e => e.code === '42501')
  assert.equal(refreshCount, 0, 'A permission failure must not trigger a token refresh loop')
  assert.match(app.accessErrorMessage({ status: 401, code: '42501' }), /permisos/)
}

// Token realmente inválido: intentar una única renovación, sin guardar tokens en logs.
{
  let calls = 0
  let refreshCount = 0
  const { app } = instance({
    rpc: async () => ++calls === 1
      ? { error: { status: 401, code: 'PGRST301', message: 'JWT invalid' } }
      : { data: { profile: { id: session.user.id, role: 'super_admin' }, courses: [], users: [] }, error: null },
    auth: {
      getUser: async () => ({ data: { user: null }, error: { status: 401 } }),
      refreshSession: async () => { refreshCount++; return { data: { session }, error: null } }
    }
  })
  app.session = session
  const data = await app.rpc('aula_bootstrap')
  assert.equal(data.profile.role, 'super_admin')
  assert.equal(refreshCount, 1)
  assert.equal(calls, 2)
}

// Si no hay membresía, el cliente jamás debe asumir permisos.
{
  const { app } = instance({
    rpc: async name => ({ data: name === 'aula_bootstrap'
      ? { profile: null, users: [], courses: [] }
      : { notifications: [], agenda: [] }, error: null })
  })
  app.session = session
  await assert.rejects(app.refresh(), e => e.code === 'AULA_MEMBERSHIP')
  assert.equal(app.profile, null)
}

// Un 401 persistente al cargar una sesión no expulsa ni oculta el error.
{
  let listeners = 0
  let signouts = 0
  const { app } = instance({
    rpc: async () => ({ error: { status: 401, code: '42501', message: 'permission denied' } }),
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user: session.user }, error: null }),
      onAuthStateChange: () => { listeners++; return { data: { subscription: { unsubscribe() {} } } } },
      signOut: async () => { signouts++ }
    }
  })
  await app.init()
  assert.equal(app.session.user.id, session.user.id)
  assert.equal(app.backendIssue.code, '42501')
  assert.equal(listeners, 1, 'Keep the auth listener after backend failures')
  assert.equal(signouts, 0, 'Do not log out a verified user after a database failure')
}
console.log('OK: denied RPC, JWT refresh, membership isolation, and authenticated retry state')
