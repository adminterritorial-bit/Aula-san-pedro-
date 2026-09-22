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
      refresh: '<path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 11"/><path d="M5.5 15A7 7 0 0 0 18 17.5l2-4.5"/>',
      play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
      trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4"/><path d="M17 6h3v2a4 4 0 0 1-4 4"/>',
      graduation: '<path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v4c3 2 9 2 12 0v-4"/><path d="M22 9v6"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
      filecheck: '<path d="M14 2H6a2 2 0 0 0-2 2v16h16V8Z"/><path d="M14 2v6h6"/><path d="m8 15 2 2 4-4"/>',
      arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      filter: '<path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/>',
      sliders: '<path d="M4 6h10"/><path d="M18 6h2"/><circle cx="16" cy="6" r="2"/><path d="M4 12h2"/><path d="M10 12h10"/><circle cx="8" cy="12" r="2"/><path d="M4 18h8"/><path d="M16 18h4"/><circle cx="14" cy="18" r="2"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      badge: '<path d="M12 2 9.7 4.1 6.6 4 6 7l-2.3 2.1L5 12l-1.3 2.9L6 17l.6 3 3.1-.1L12 22l2.3-2.1 3.1.1.6-3 2.3-2.1L19 12l1.3-2.9L18 7l-.6-3-3.1.1Z"/><path d="m9 12 2 2 4-4"/>',
      briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3"/><path d="M3 12h18"/><path d="M10 12v2h4v-2"/>',
      target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
      layers: '<path d="m12 2 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
      brain: '<path d="M9.5 4.5a3 3 0 0 0-5.5 2A3 3 0 0 0 4 12a3 3 0 0 0 2 5.5A3 3 0 0 0 11 20V4a3 3 0 0 0-1.5.5Z"/><path d="M14.5 4.5a3 3 0 0 1 5.5 2 3 3 0 0 1 0 5.5 3 3 0 0 1-2 5.5A3 3 0 0 1 13 20V4a3 3 0 0 1 1.5.5Z"/><path d="M8 9H5M16 9h3M8 15H6M16 15h2"/>',
      shapes: '<circle cx="6.5" cy="6.5" r="3.5"/><rect x="13" y="3" width="7" height="7" rx="1"/><path d="m6 14-4 7h8Z"/><path d="m17 14 4 7h-8Z"/>',
      ordered: '<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 6h1v4H4M3 14h3l-3 4h3"/>'
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
    var route=A.route(), section=route[0]||'home', mobileTitle='Inicio', mobileSubtitle='Formación institucional';
    if(section==='catalog') mobileTitle='Mis capacitaciones';
    else if(section==='games') mobileTitle='Juegos';
    else if(section==='studio') mobileTitle='Gestión Aula';
    else if(section==='certificate') mobileTitle='Certificado';
    else if(section==='course') {
      var mobileCourse=route[1] ? A.course(decodeURIComponent(route[1])) : null;
      mobileTitle=mobileCourse ? mobileCourse.title : 'Capacitación';
      mobileSubtitle='Ruta de aprendizaje';
    }
    var management = A.canManage()
      ? '<button type="button" data-nav-hash="#/studio" class="' + A.nav('studio') + '">' + A.icon('shield') + '<span>Gestión Aula</span></button>'
      : '';
    var mobileNavCount=A.canManage()?4:3;

    return '<div class="learner-app-shell">' +
      '<aside class="learner-global-sidebar">' +
        '<button type="button" data-nav-hash="#/" class="learner-sidebar-brand learner-sidebar-brand-original">' +
          '<span class="aula-symbol aula-symbol-premium"><span>A</span><i></i></span>' +
          '<div class="aula-brand-copy"><strong>Aula San Pedro</strong><small>FORMACIÓN INSTITUCIONAL</small></div>' +
        '</button>' +

        '<div class="learner-sidebar-user"><div class="learner-sidebar-avatar">' + A.escape(initials) + '</div><div><strong>' + A.escape(displayName) + '</strong><span>' + A.escape(role) + '</span></div></div>' +

        '<nav class="learner-sidebar-nav" aria-label="Navegación principal">' +
          '<button type="button" data-nav-hash="#/" class="' + A.nav('home') + '">' + A.icon('home') + '<span>Inicio</span></button>' +
          '<button type="button" data-nav-hash="#/catalog" class="' + A.nav('catalog') + '">' + A.icon('book') + '<span>Mis capacitaciones</span></button>' +
          '<button type="button" data-nav-hash="#/games" class="' + A.nav('games') + '">' + A.icon('game') + '<span>Juegos</span></button>' +
          management +
        '</nav>' +

        '<div class="learner-sidebar-bottom">' +
          '<button id="logoutBtn" class="learner-sidebar-signout">' + A.icon('logout') + '<span>Cerrar sesión</span></button>' +
          '<div class="learner-sidebar-security">' + A.icon('sparkle',16) + '<span>Acceso institucional protegido con Google y Supabase.</span></div>' +
        '</div>' +
      '</aside>' +

      '<header class="learner-mobile-appbar">' +
        '<button type="button" data-nav-hash="#/" class="mobile-app-brand" aria-label="Ir al inicio"><span>A</span></button>' +
        '<div class="mobile-app-title"><strong>' + A.escape(mobileTitle) + '</strong><small>' + A.escape(mobileSubtitle) + '</small></div>' +
        '<button type="button" id="mobileProfileBtn" class="mobile-profile-button" aria-label="Abrir cuenta"><span>' + A.escape(initials) + '</span></button>' +
      '</header>' +

      '<div class="learner-shell-main"><div class="experience-route-progress"></div><div class="learner-route-transition">' + content + '</div></div>' +

      '<nav class="learner-mobile-global-nav nav-items-' + mobileNavCount + '" aria-label="Navegación móvil">' +
        '<button type="button" data-nav-hash="#/" class="' + A.nav('home') + '"><span class="mobile-nav-icon">' + A.icon('home',21) + '</span><span>Inicio</span></button>' +
        '<button type="button" data-nav-hash="#/catalog" class="' + A.nav('catalog') + '"><span class="mobile-nav-icon">' + A.icon('book',21) + '</span><span>Cursos</span></button>' +
        '<button type="button" data-nav-hash="#/games" class="' + A.nav('games') + '"><span class="mobile-nav-icon">' + A.icon('game',21) + '</span><span>Juegos</span></button>' +
        (A.canManage()?'<button type="button" data-nav-hash="#/studio" class="' + A.nav('studio') + '"><span class="mobile-nav-icon">' + A.icon('shield',21) + '</span><span>Gestión</span></button>':'') +
      '</nav>' +

      '<div class="mobile-profile-backdrop" id="mobileProfileBackdrop"></div>' +
      '<aside class="mobile-profile-sheet" id="mobileProfileSheet" aria-hidden="true">' +
        '<div class="mobile-sheet-handle"></div>' +
        '<div class="mobile-profile-identity"><span class="mobile-profile-avatar">' + A.escape(initials) + '</span><div><strong>' + A.escape(displayName) + '</strong><small>' + A.escape((u.email||'') + (u.email?' · ':'') + role) + '</small></div><button type="button" id="closeMobileProfile" aria-label="Cerrar">×</button></div>' +
        '<div class="mobile-profile-actions">' +
          '<button type="button" id="installAulaBtn">' + A.icon('sparkle',18) + '<span><strong>Instalar Aula</strong><small>Agregar a la pantalla de inicio</small></span>' + A.icon('arrow',17) + '</button>' +
          '<button type="button" id="mobileRefreshBtn">' + A.icon('refresh',18) + '<span><strong>Actualizar aplicación</strong><small>Recargar contenido y diseño</small></span>' + A.icon('arrow',17) + '</button>' +
          '<button type="button" id="mobileLogoutBtn" class="mobile-danger-action">' + A.icon('logout',18) + '<span><strong>Cerrar sesión</strong><small>Finalizar sesión institucional</small></span>' + A.icon('arrow',17) + '</button>' +
        '</div>' +
        '<div class="mobile-sheet-security">' + A.icon('shield',16) + '<span>Tu sesión usa autenticación institucional y datos protegidos en Supabase.</span></div>' +
      '</aside>' +
    '</div>';
  };

  A.bindShell = function () {
    document.documentElement.classList.remove('mobile-sheet-open','course-outline-open');
    document.querySelectorAll('[data-nav-hash]').forEach(function (b) {
      b.onclick = function () { location.hash = b.getAttribute('data-nav-hash'); };
    });

    var signOut=async function(){
      await A.sb.auth.signOut();
      A.session = null; A.profile = null; A.trainingProfile = null; A.trainingAdmin = null;
      A.hydrate({}); w.AulaRender();
    };
    var b = document.getElementById('logoutBtn');
    if (b) b.onclick = signOut;
    var mobileLogout=document.getElementById('mobileLogoutBtn');
    if(mobileLogout) mobileLogout.onclick=signOut;

    var sheet=document.getElementById('mobileProfileSheet');
    var backdrop=document.getElementById('mobileProfileBackdrop');
    var openSheet=function(){
      if(!sheet)return;
      sheet.classList.add('open');
      if(backdrop)backdrop.classList.add('open');
      sheet.setAttribute('aria-hidden','false');
      document.documentElement.classList.add('mobile-sheet-open');
    };
    var closeSheet=function(){
      if(!sheet)return;
      sheet.classList.remove('open');
      if(backdrop)backdrop.classList.remove('open');
      sheet.setAttribute('aria-hidden','true');
      document.documentElement.classList.remove('mobile-sheet-open');
    };
    var profileBtn=document.getElementById('mobileProfileBtn');
    if(profileBtn)profileBtn.onclick=openSheet;
    var closeProfile=document.getElementById('closeMobileProfile');
    if(closeProfile)closeProfile.onclick=closeSheet;
    if(backdrop)backdrop.onclick=closeSheet;

    var refreshBtn=document.getElementById('mobileRefreshBtn');
    if(refreshBtn)refreshBtn.onclick=function(){location.reload();};

    var installBtn=document.getElementById('installAulaBtn');
    if(installBtn)installBtn.onclick=async function(){
      if(w.matchMedia&&w.matchMedia('(display-mode: standalone)').matches || w.navigator.standalone){
        A.toast('Aula ya está abierta como aplicación.');
        closeSheet();
        return;
      }
      if(w.__aulaInstallPrompt){
        w.__aulaInstallPrompt.prompt();
        try{await w.__aulaInstallPrompt.userChoice;}catch(_){}
        w.__aulaInstallPrompt=null;
        closeSheet();
        return;
      }
      var ua=navigator.userAgent||'';
      if(/iPad|iPhone|iPod/.test(ua)){
        A.toast('En Safari: Compartir → Añadir a pantalla de inicio.');
      } else {
        A.toast('Abre el menú del navegador y elige Instalar aplicación o Añadir a pantalla de inicio.');
      }
      closeSheet();
    };
  };

  A.loginView = function (notice) {
    document.getElementById('root').innerHTML =
      '<main class="auth-page auth-page-premium">' +
        '<section class="auth-hero auth-hero-premium">' +
          '<div class="auth-ambient auth-ambient-one"></div><div class="auth-ambient auth-ambient-two"></div>' +
          '<div class="auth-hero-top"><div class="auth-premium-brand"><span class="auth-brand-symbol">A<i></i></span><div><strong>Aula San Pedro</strong><small>FORMACIÓN INSTITUCIONAL</small></div></div><span class="auth-live-pill">' + A.icon('sparkle',15) + ' Plataforma institucional</span></div>' +
          '<div class="auth-hero-content">' +
            '<span class="eyebrow-light">' + A.icon('graduation',16) + ' LMS institucional inteligente</span>' +
            '<h1>Aprende, participa y <em>certifícate.</em></h1>' +
            '<p>Una experiencia de formación diseñada para que cada funcionario encuentre su ruta, avance a su ritmo y mantenga evidencias verificables de su aprendizaje.</p>' +
            '<div class="auth-feature-grid auth-feature-grid-premium">' +
              '<article><span>' + A.icon('layers',22) + '</span><div><strong>Rutas personalizadas</strong><small>Capacitaciones, competencias y obligaciones según cargo.</small></div></article>' +
              '<article><span>' + A.icon('game',22) + '</span><div><strong>Aprendizaje interactivo</strong><small>Videos, recursos, prácticas, juegos y evaluaciones.</small></div></article>' +
              '<article><span>' + A.icon('badge',22) + '</span><div><strong>Certificación verificable</strong><small>Progreso, resultados y certificados dentro de una misma ruta.</small></div></article>' +
              '<article><span>' + A.icon('shield',22) + '</span><div><strong>Acceso institucional</strong><small>Google Workspace, Supabase y permisos por rol.</small></div></article>' +
            '</div>' +
          '</div>' +
          '<div class="auth-product-preview" aria-hidden="true">' +
            '<div class="auth-preview-sidebar"><span>A</span><i></i><i></i><i></i></div>' +
            '<div class="auth-preview-main"><div class="auth-preview-top"></div><div class="auth-preview-hero"><i></i><i></i><strong>Tu aprendizaje continúa aquí.</strong></div><div class="auth-preview-cards"><i></i><i></i><i></i></div></div>' +
          '</div>' +
          '<div class="auth-hero-footer"><span>' + A.icon('shield',14) + ' Acceso protegido</span><span>' + A.icon('target',14) + ' Formación por competencias</span><span>' + A.icon('trophy',14) + ' Trazabilidad de logros</span></div>' +
        '</section>' +

        '<section class="auth-panel auth-panel-premium">' +
          '<div class="auth-panel-inner">' +
            '<div class="auth-panel-badge"><span>A</span></div>' +
            '<div class="auth-panel-heading"><span class="eyebrow">Acceso a la plataforma</span><h2>Bienvenido.</h2><p>Continúa con tu cuenta institucional de la Alcaldía de San Pedro.</p></div>' +
            '<div class="institutional-domain-pill">' + A.icon('shield',15) + ' @' + A.INSTITUTIONAL_DOMAIN + '</div>' +
            '<div class="google-login-shell"><div id="googleButtonHost" class="google-button-host"></div></div>' +
            '<p id="googleLoginMessage" class="warning-message" style="display:' + (notice ? 'block' : 'none') + '">' + A.escape(notice || '') + '</p>' +
            '<div class="auth-divider"><span>Acceso alterno</span></div>' +
            '<details class="alternate-login alternate-login-premium"><summary><span>' + A.icon('book',16) + ' Ingresar con correo y contraseña</span><b>+</b></summary>' +
              '<form id="loginForm" class="alternate-login-form"><label>Correo institucional<input id="loginEmail" type="email" autocomplete="username" placeholder="usuario@' + A.INSTITUTIONAL_DOMAIN + '" required></label><label>Contraseña<input id="loginPass" type="password" autocomplete="current-password" required></label><button class="secondary-button login-secondary-button" id="loginBtn">Ingresar con contraseña</button><p id="loginMessage" class="warning-message" style="display:none"></p></form>' +
            '</details>' +
            '<div class="auth-security-note">' + A.icon('shield',17) + '<div><strong>Solo cuentas autorizadas</strong><span>El dominio institucional también se valida en Supabase.</span></div></div>' +
            '<small class="auth-panel-footer">Aula San Pedro · Formación institucional segura</small>' +
          '</div>' +
        '</section>' +
      '</main>';

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
