(function (w) {
  var A = w.AulaDemo = w.AulaDemo || {};
  A.sb = w.AulaSupabase;
  A.INSTITUTIONAL_DOMAIN = 'sanpedro-valle.gov.co';
  A.GOOGLE_CLIENT_ID = '103022555921-i7cqb3o8tc4lbtf7n9endse1d423ck4m.apps.googleusercontent.com';
  A.oauthRedirect = function () { return location.origin + location.pathname; };
  A.isInstitutionalEmail = function (email) {
    email = String(email || '').trim().toLowerCase();
    return email.endsWith('@' + A.INSTITUTIONAL_DOMAIN) && email.split('@').length === 2;
  };
  A.googleProviderEnabled = null;
  A.checkGoogleProvider = async function () {
    try {
      var cfg = w.AulaSupabaseConfig || {};
      if (!cfg.url || !cfg.key) return null;
      var response = await fetch(cfg.url + '/auth/v1/settings', { headers: { apikey: cfg.key } });
      if (!response.ok) return null;
      var settings = await response.json();
      A.googleProviderEnabled = !!(settings && settings.external && settings.external.google);
      return A.googleProviderEnabled;
    } catch (_) {
      return null;
    }
  };
  A.session = null;
  A.profile = null;
  A.trainingProfile = null;
  A.trainingAdmin = null;
  A.state = { users: [], courses: [], assignments: [], progress: {}, certificates: [], activity: [] };
  A.ui = { tab: 'courses', selectedCourse: null, selectedBlock: {}, examCourse: null, lastExam: null, busy: false };

  A.icon = function (name, size) {
    size = size || 18;
    var paths = {
      home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M9 20v-6h6v6"/>',
      book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4v15.5"/><path d="M6.5 4H20v13H6.5A2.5 2.5 0 0 0 4 19.5"/>',
      game: '<path d="M6 11h4"/><path d="M8 9v4"/><path d="M15 12h.01"/><path d="M18 10h.01"/><path d="M7 5h10a4 4 0 0 1 3.8 2.7l1 3A6 6 0 0 1 16 19l-2-2h-4l-2 2a6 6 0 0 1-5.8-8.3l1-3A4 4 0 0 1 7 5Z"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
      logout: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/>',
      sparkle: '<path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2Z"/><path d="m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8Z"/><path d="m19 13-.7 1.8-1.8.7 1.8.7L19 18l.7-1.8 1.8-.7-1.8-.7Z"/>',
      refresh: '<path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 11"/><path d="M5.5 15A7 7 0 0 0 18 17.5l2-4.5"/>'
    };
    return '<svg aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || paths.sparkle) + '</svg>';
  };

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
  A.loadTrainingProfile = async function (force) {
    if (!A.logged()) return null;
    if (A.trainingProfile && !force) return A.trainingProfile;
    try {
      A.trainingProfile = await A.rpc('aula_get_my_training_profile');
      return A.trainingProfile;
    } catch (_) {
      A.trainingProfile = null;
      return null;
    }
  };
  A.loadTrainingAdmin = async function (force) {
    if (!A.canManageUsers()) return null;
    if (A.trainingAdmin && !force) return A.trainingAdmin;
    A.trainingAdmin = await A.rpc('aula_training_admin_bootstrap');
    return A.trainingAdmin;
  };
  A.localLog = function (text) { A.state.activity.unshift({ id: 'local-' + Date.now(), at: new Date().toISOString(), text: text }); A.state.activity = A.state.activity.slice(0, 50); };

  A.shell = function (content) {
    var u = A.user() || A.profile || { full_name: 'Usuario', role: '' };
    var displayName = u.full_name || 'Usuario';
    var initials = String(displayName).trim().split(/\s+/).filter(Boolean).slice(0,2).map(function (x) { return x[0]; }).join('').toUpperCase() || 'SP';
    var roleLabels = { colaborador:'Colaborador', creador_contenido:'Creador de contenido', revisor:'Revisor', admin:'Administrador', super_admin:'Super Admin' };
    var role = roleLabels[u.role] || u.role || 'Colaborador';
    var management = A.canManage() ? '<a class="' + A.nav('studio') + '" href="#/studio">' + A.icon('shield') + '<span>Gestión Aula</span></a>' : '';
    return '<div class="learner-app-shell">' +
      '<aside class="learner-global-sidebar">' +
        '<a href="#/" class="learner-sidebar-brand learner-sidebar-brand-original"><span class="aula-symbol">A</span><div><strong>Aula San Pedro</strong><small>FORMACIÓN INSTITUCIONAL</small></div></a>' +
        '<div class="learner-sidebar-user"><div class="learner-sidebar-avatar">' + A.escape(initials) + '</div><div><strong>' + A.escape(displayName) + '</strong><span>' + A.escape(role) + '</span></div></div>' +
        '<nav class="learner-sidebar-nav" aria-label="Navegación principal">' +
          '<a class="' + A.nav('home') + '" href="#/">' + A.icon('home') + '<span>Inicio</span></a>' +
          '<a class="' + A.nav('catalog') + '" href="#/catalog">' + A.icon('book') + '<span>Mis capacitaciones</span></a>' +
          '<a class="' + A.nav('games') + '" href="#/games">' + A.icon('game') + '<span>Juegos</span></a>' +
          management +
        '</nav>' +
        '<div class="learner-sidebar-bottom"><button id="logoutBtn" class="learner-sidebar-signout">' + A.icon('logout') + '<span>Cerrar sesión</span></button>' +
        '<div class="learner-sidebar-security">' + A.icon('sparkle',16) + '<span>Acceso institucional protegido con Google y Supabase.</span></div></div>' +
      '</aside>' +
      '<div class="learner-shell-main"><div class="experience-route-progress"></div><div class="learner-route-transition">' + content + '</div></div>' +
      '<nav class="learner-mobile-global-nav"><a href="#/">' + A.icon('home') + '<span>Inicio</span></a><a href="#/catalog">' + A.icon('book') + '<span>Cursos</span></a><a href="#/games">' + A.icon('game') + '<span>Juegos</span></a>' + (A.canManage() ? '<a href="#/studio">' + A.icon('shield') + '<span>Gestión</span></a>' : '') + '</nav>' +
    '</div>';
  };
  A.bindShell = function () {
    var b = document.getElementById('logoutBtn');
    if (b) b.onclick = async function () {
      await A.sb.auth.signOut();
      A.session = null; A.profile = null; A.trainingProfile = null; A.trainingAdmin = null;
      A.hydrate({}); w.AulaRender();
    };
  };

  A.loginView = function (notice) {
    document.getElementById('root').innerHTML = '<main class="auth-page"><section class="auth-hero"><div class="demo-brand-mark">A</div><span class="eyebrow-light">Aula institucional · San Pedro</span><h1>Ingresa con tu cuenta institucional de Google.</h1><p>El acceso principal utiliza Google Workspace de la Alcaldía. El Aula conserva cursos, progreso, evaluaciones y certificados en Supabase.</p><div class="auth-feature-grid"><div><strong>Cuenta institucional</strong><span>Acceso exclusivo para @' + A.INSTITUTIONAL_DOMAIN + '.</span></div><div><strong>Inicio rápido</strong><span>Sin crear otra contraseña si ya tienes tu cuenta de Google institucional.</span></div></div></section>' +
      '<section class="auth-panel"><div class="auth-form"><div><span class="eyebrow">Acceso institucional</span><h2>Iniciar sesión</h2><p>Usa tu cuenta Google de la Alcaldía de San Pedro.</p></div>' +
      '<div class="institutional-domain-pill">@' + A.INSTITUTIONAL_DOMAIN + '</div>' +
      '<div id="googleButtonHost" style="min-height:44px"></div>' +
      '<p id="googleLoginMessage" class="warning-message" style="display:' + (notice ? 'block' : 'none') + '">' + A.escape(notice || '') + '</p>' +
      '<div class="auth-divider"><span>o acceso alterno</span></div>' +
      '<details class="alternate-login"><summary>Ingresar con correo y contraseña</summary><form id="loginForm" class="alternate-login-form"><label>Correo institucional<input id="loginEmail" type="email" autocomplete="username" placeholder="usuario@' + A.INSTITUTIONAL_DOMAIN + '" required></label><label>Contraseña<input id="loginPass" type="password" autocomplete="current-password" required></label><button class="secondary-button" id="loginBtn">Ingresar con contraseña</button><p id="loginMessage" class="warning-message" style="display:none"></p></form></details>' +
      '<small class="demo-muted">El acceso externo al dominio institucional está bloqueado también en la base de datos.</small></div></section></main>';

    var googleMessage = document.getElementById('googleLoginMessage');
    var googleHost = document.getElementById('googleButtonHost');

    var renderGoogleButton = async function () {
      var enabled = await A.checkGoogleProvider();
      if (enabled === false) {
        googleMessage.style.display = 'block';
        googleMessage.textContent = 'El proveedor Google está deshabilitado en Supabase Auth.';
        return;
      }

      var attempts = 0;
      var waitForGoogle = function () {
        if (w.google && w.google.accounts && w.google.accounts.id) {
          try {
            w.google.accounts.id.initialize({
              client_id: A.GOOGLE_CLIENT_ID,
              hd: A.INSTITUTIONAL_DOMAIN,
              ux_mode: 'popup',
              auto_select: false,
              callback: async function (response) {
                googleMessage.style.display = 'none';
                try {
                  if (!response || !response.credential) throw new Error('Google no devolvió una credencial válida.');
                  var result = await A.sb.auth.signInWithIdToken({
                    provider: 'google',
                    token: response.credential
                  });
                  if (result.error) throw result.error;
                  var email = result.data && result.data.user ? result.data.user.email : '';
                  if (!A.isInstitutionalEmail(email)) {
                    await A.sb.auth.signOut({ scope: 'local' });
                    throw new Error('Debes usar una cuenta institucional @' + A.INSTITUTIONAL_DOMAIN + '.');
                  }
                  A.session = result.data.session;
                  await A.refresh();
                  location.hash = '#/';
                  w.AulaRender();
                } catch (err) {
                  googleMessage.style.display = 'block';
                  googleMessage.textContent = A.errorText(err, 'No fue posible iniciar sesión con Google.');
                }
              }
            });
            googleHost.innerHTML = '';
            w.google.accounts.id.renderButton(googleHost, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: Math.min(360, Math.max(260, googleHost.clientWidth || 320))
            });
          } catch (err) {
            googleMessage.style.display = 'block';
            googleMessage.textContent = A.errorText(err, 'No fue posible inicializar Google.');
          }
          return;
        }
        attempts += 1;
        if (attempts < 50) return setTimeout(waitForGoogle, 100);
        googleMessage.style.display = 'block';
        googleMessage.textContent = 'No fue posible cargar Google Identity Services. Recarga la página e inténtalo nuevamente.';
      };
      waitForGoogle();
    };

    renderGoogleButton();

    document.getElementById('loginForm').onsubmit = async function (e) {
      e.preventDefault(); var m = document.getElementById('loginMessage'); var btn = document.getElementById('loginBtn'); var email = document.getElementById('loginEmail').value.trim().toLowerCase();
      if (!A.isInstitutionalEmail(email)) { m.style.display = 'block'; m.textContent = 'Usa tu correo institucional @' + A.INSTITUTIONAL_DOMAIN + '.'; return; }
      m.style.display = 'none'; btn.disabled = true; btn.textContent = 'Ingresando…';
      try {
        var result = await A.sb.auth.signInWithPassword({ email: email, password: document.getElementById('loginPass').value });
        if (result.error) throw result.error;
        A.session = result.data.session;
        await A.refresh();
        location.hash = '#/';
        w.AulaRender();
      } catch (err) {
        m.style.display = 'block'; m.textContent = A.errorText(err, 'No fue posible iniciar sesión.');
      } finally { btn.disabled = false; btn.textContent = 'Ingresar con contraseña'; }
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

    if (A.session) {
      var email = A.session.user && A.session.user.email;
      if (!A.isInstitutionalEmail(email)) {
        await A.sb.auth.signOut({ scope: 'local' });
        A.session = null;
        A.profile = null;
        throw new Error('Esta Aula solo admite cuentas institucionales @' + A.INSTITUTIONAL_DOMAIN + '.');
      }
      try {
        await A.refresh();
      } catch (err) {
        await A.sb.auth.signOut({ scope: 'local' });
        A.session = null;
        A.profile = null;
        throw err;
      }
    }

    A.sb.auth.onAuthStateChange(function (event, session) {
      A.session = session;
      if (event === 'SIGNED_OUT') {
        A.profile = null;
        A.hydrate({});
        if (w.AulaRender) w.AulaRender();
      }
    });
  };
})(window);
