(function (w) {
  var A = w.AulaDemo = w.AulaDemo || {};
  A.sb = w.AulaSupabase;
  A.session = null;
  A.profile = null;
  A.state = { users: [], courses: [], assignments: [], progress: {}, certificates: [], activity: [] };
  A.ui = { tab: 'courses', selectedCourse: null, selectedBlock: {}, examCourse: null, lastExam: null, busy: false };

  A.uid = function (prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9); };
  A.escape = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; }); };
  A.errorText = function (e, fallback) { return (e && (e.message || e.error_description || e.error)) || fallback || 'Ocurrió un error.'; };
  A.route = function () { return (location.hash || '#/').replace(/^#/, '').split('?')[0].split('/').filter(Boolean); };
  A.logged = function () { return !!(A.session && A.session.user); };
  A.currentUid = function () { return A.session && A.session.user ? A.session.user.id : null; };
  A.user = function (id) { var uid = id || A.currentUid(); return A.state.users.find(function (u) { return u.id === uid; }) || (A.profile && A.profile.id === uid ? A.profile : null); };
  A.course = function (id) { return A.state.courses.find(function (c) { return c.id === id; }); };
  A.flatten = function (c) { var out = []; (c && c.phases || []).forEach(function (p) { (p.blocks || []).forEach(function (b) { out.push({ phase: p, block: b }); }); }); return out; };
  A.progress = function (uid, cid) { uid = uid || A.currentUid(); A.state.progress[uid] = A.state.progress[uid] || {}; A.state.progress[uid][cid] = A.state.progress[uid][cid] || []; return A.state.progress[uid][cid]; };
  A.percent = function (uid, c) { var req = A.flatten(c).filter(function (x) { return x.block.required; }); if (!req.length) return 0; var done = A.progress(uid, c.id); return Math.round(req.filter(function (x) { return done.indexOf(x.block.id) >= 0; }).length / req.length * 100); };
  A.cert = function (uid, cid) { uid = uid || A.currentUid(); return A.state.certificates.find(function (c) { return c.user_id === uid && c.course_id === cid; }); };
  A.canManage = function () { return !!A.profile && ['creador_contenido', 'revisor', 'admin', 'super_admin'].indexOf(A.profile.role) >= 0; };
  A.canManageUsers = function () { return !!A.profile && ['admin', 'super_admin'].indexOf(A.profile.role) >= 0; };
  A.isSuperAdmin = function () { return !!A.profile && A.profile.role === 'super_admin'; };
  A.assigned = function (uid) {
    uid = uid || A.currentUid();
    if (A.canManage() && uid === A.currentUid()) {
      return A.state.courses.filter(function (c) { return c.status === 'published'; }).map(function (c) {
        var a = A.state.assignments.find(function (x) { return x.user_id === uid && x.course_id === c.id; });
        return { assignment: a || {}, course: c };
      });
    }
    return A.state.assignments.filter(function (a) { return a.user_id === uid; }).map(function (a) { return { assignment: a, course: A.course(a.course_id) }; }).filter(function (x) { return x.course && x.course.status === 'published'; });
  };
  A.nav = function (name) { var p = A.route(); return (name === 'home' && p.length === 0) || p[0] === name ? 'active' : ''; };

  A.toast = function (message) {
    var old = document.querySelector('.demo-toast'); if (old) old.remove();
    var el = document.createElement('div'); el.className = 'demo-toast'; el.textContent = message; document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 3200);
  };
  A.setBusy = function (busy) {
    A.ui.busy = !!busy;
    document.querySelectorAll('button,input,select,textarea').forEach(function (el) { if (el.id !== 'logoutBtn') el.disabled = !!busy; });
  };

  A.rpc = async function (name, args) {
    var res = await A.sb.rpc(name, args || {});
    if (res.error) throw res.error;
    return res.data;
  };
  A.invoke = async function (name, body) {
    var res = await A.sb.functions.invoke(name, { body: body || {} });
    if (res.error) throw res.error;
    if (res.data && res.data.ok === false) throw new Error(res.data.error || 'La operación no fue aceptada.');
    return res.data;
  };
  A.hydrate = function (data) {
    data = data || {};
    A.profile = data.profile || null;
    A.state.users = data.users || [];
    A.state.courses = data.courses || [];
    A.state.assignments = data.assignments || [];
    A.state.certificates = data.certificates || [];
    A.state.activity = data.activity || [];
    A.state.progress = {};
    (data.progress || []).forEach(function (p) {
      A.state.progress[p.user_id] = A.state.progress[p.user_id] || {};
      A.state.progress[p.user_id][p.course_id] = p.completed_blocks || [];
    });
  };
  A.refresh = async function () {
    if (!A.logged()) return;
    var data = await A.rpc('aula_bootstrap');
    A.hydrate(data);
  };
  A.localLog = function (text) { A.state.activity.unshift({ id: 'local-' + Date.now(), at: new Date().toISOString(), text: text }); A.state.activity = A.state.activity.slice(0, 50); };

  A.shell = function (content) {
    var u = A.user() || A.profile || { full_name: 'Usuario', role: '' };
    var management = A.canManage() ? '<a class="' + A.nav('studio') + '" href="#/studio">Gestión</a>' : '';
    return '<div class="app-shell"><header class="demo-topbar">' +
      '<a href="#/" class="demo-brand-inline" style="text-decoration:none"><span class="demo-brand-mark">A</span><span>Aula de Formación<small style="display:block;font-weight:600;color:#718096">SAN PEDRO</small></span></a>' +
      '<nav class="demo-nav"><a class="' + A.nav('home') + '" href="#/">Inicio</a><a class="' + A.nav('catalog') + '" href="#/catalog">Mis capacitaciones</a><a class="' + A.nav('games') + '" href="#/games">Juegos</a>' + management + '<button id="logoutBtn">Cerrar sesión</button></nav>' +
      '<div><strong>' + A.escape(u.full_name) + '</strong><small style="display:block;color:#718096">' + A.escape(u.role) + '</small></div></header><main class="demo-main">' + content + '</main></div>';
  };
  A.bindShell = function () {
    var b = document.getElementById('logoutBtn');
    if (b) b.onclick = async function () { await A.sb.auth.signOut(); A.session = null; A.profile = null; A.hydrate({}); w.AulaRender(); };
  };

  A.loginView = function (notice) {
    document.getElementById('root').innerHTML = '<main class="auth-page"><section class="auth-hero"><div class="demo-brand-mark">A</div><span class="eyebrow-light">Aula institucional · San Pedro</span><h1>Aprende, participa y certifica tu formación desde una sola experiencia.</h1><p>Rutas secuenciales, contenidos, actividades, evaluación, progreso, certificados y gestión administrativa conectados a Supabase.</p><div class="auth-feature-grid"><div><strong>Acceso institucional</strong><span>Usa la misma cuenta Auth disponible en la plataforma municipal.</span></div><div><strong>Datos aislados</strong><span>El Aula comparte autenticación, no las tablas de otros aplicativos.</span></div></div></section>' +
      '<section class="auth-panel"><form class="auth-form" id="loginForm"><div><span class="eyebrow">Acceso a la plataforma</span><h2>Iniciar sesión</h2><p>Ingresa con tu correo y contraseña.</p></div>' +
      '<label>Correo<input id="loginEmail" type="email" autocomplete="username" required></label><label>Contraseña<input id="loginPass" type="password" autocomplete="current-password" required></label>' +
      '<button class="primary-button" id="loginBtn">Ingresar</button><p id="loginMessage" class="warning-message" style="display:' + (notice ? 'block' : 'none') + '">' + A.escape(notice || '') + '</p></form></section></main>';
    document.getElementById('loginForm').onsubmit = async function (e) {
      e.preventDefault(); var m = document.getElementById('loginMessage'); var btn = document.getElementById('loginBtn');
      m.style.display = 'none'; btn.disabled = true; btn.textContent = 'Ingresando…';
      try {
        var result = await A.sb.auth.signInWithPassword({ email: document.getElementById('loginEmail').value.trim(), password: document.getElementById('loginPass').value });
        if (result.error) throw result.error;
        A.session = result.data.session;
        await A.refresh();
        location.hash = '#/';
        w.AulaRender();
      } catch (err) {
        m.style.display = 'block'; m.textContent = A.errorText(err, 'No fue posible iniciar sesión.');
      } finally { btn.disabled = false; btn.textContent = 'Ingresar'; }
    };
  };

  A.passwordChangeView = function () {
    document.getElementById('root').innerHTML = '<main class="auth-page"><section class="auth-hero"><div class="demo-brand-mark">A</div><span class="eyebrow-light">Seguridad de la cuenta</span><h1>Define tu contraseña personal antes de continuar.</h1><p>La contraseña temporal solo permite el primer acceso. El cambio se aplica a tu cuenta Auth compartida.</p></section>' +
      '<section class="auth-panel"><form class="auth-form" id="passwordForm"><div><span class="eyebrow">Primer ingreso</span><h2>Cambiar contraseña</h2><p>Mínimo 10 caracteres con mayúscula, minúscula, número y símbolo.</p></div>' +
      '<label>Nueva contraseña<input id="newPassword" type="password" minlength="10" required></label><label>Confirmar contraseña<input id="confirmPassword" type="password" minlength="10" required></label>' +
      '<button class="primary-button" id="passwordBtn">Actualizar contraseña</button><p id="passwordMessage" class="warning-message" style="display:none"></p></form></section></main>';
    document.getElementById('passwordForm').onsubmit = async function (e) {
      e.preventDefault(); var p = document.getElementById('newPassword').value; var c = document.getElementById('confirmPassword').value; var m = document.getElementById('passwordMessage');
      if (p !== c) { m.style.display = 'block'; m.textContent = 'Las contraseñas no coinciden.'; return; }
      if (!/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p) || !/[^A-Za-z0-9]/.test(p) || /\s/.test(p)) { m.style.display = 'block'; m.textContent = 'Usa mayúscula, minúscula, número y símbolo, sin espacios.'; return; }
      var btn = document.getElementById('passwordBtn'); btn.disabled = true;
      try {
        var meta = Object.assign({}, A.session.user.user_metadata || {}, { must_change_password: false });
        var update = await A.sb.auth.updateUser({ password: p, data: meta }); if (update.error) throw update.error;
        await A.rpc('aula_mark_password_changed');
        await A.sb.auth.signOut(); A.session = null; A.profile = null;
        A.loginView('Contraseña actualizada. Inicia sesión nuevamente.');
      } catch (err) { m.style.display = 'block'; m.textContent = A.errorText(err); }
      finally { btn.disabled = false; }
    };
  };

  A.loadingView = function (text) {
    document.getElementById('root').innerHTML = '<main class="auth-page"><section class="auth-panel" style="margin:auto"><div class="auth-form"><span class="eyebrow">Aula de Formación</span><h2>' + A.escape(text || 'Cargando…') + '</h2><p>Validando sesión y preparando tu ruta de aprendizaje.</p></div></section></main>';
  };

  A.init = async function () {
    A.loadingView('Conectando con Supabase…');
    var sessionResult = await A.sb.auth.getSession();
    if (sessionResult.error) throw sessionResult.error;
    A.session = sessionResult.data.session;
    if (A.session) await A.refresh();
    A.sb.auth.onAuthStateChange(function (event, session) {
      A.session = session;
      if (event === 'SIGNED_OUT') { A.profile = null; A.hydrate({}); if (w.AulaRender) w.AulaRender(); }
    });
  };
})(window);
