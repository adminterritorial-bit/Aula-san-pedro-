(function (w) {
  var A = w.AulaDemo;

  function tabs() {
    var items = '<button data-tab="courses" class="' + (A.ui.tab === 'courses' ? 'active' : '') + '">Capacitaciones</button>';
    if (A.canManageUsers()) {
      items += '<button data-tab="assignments" class="' + (A.ui.tab === 'assignments' ? 'active' : '') + '">Asignaciones</button>';
      items += '<button data-tab="users" class="' + (A.ui.tab === 'users' ? 'active' : '') + '">Usuarios y roles</button>';
      items += '<button data-tab="certificates" class="' + (A.ui.tab === 'certificates' ? 'active' : '') + '">Ranking y certificados</button>';
    }
    return '<div class="tab-bar">' + items + '</div>';
  }
  function futureDate(days) { var d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
  function blankQuestions(id) {
    var prompts = ['¿Cuál es el objetivo principal de este contenido?', '¿Qué acción debe realizarse primero?', '¿Qué evidencia demuestra la actividad?', '¿Cuál es la decisión más segura?', '¿Qué práctica favorece la mejora continua?', '¿Qué debe verificarse antes de continuar?', '¿Qué significa mantener trazabilidad?', '¿Cuándo debe solicitarse aclaración?', '¿Qué resultado se espera del proceso?', '¿Qué conducta reduce errores?'];
    return prompts.map(function (p, i) { return { id: id + '-q' + i, prompt: p, options: ['Opción correcta', 'Opción B', 'Opción C', 'Opción D'], correct: 0 }; });
  }
  async function persistCourse(c, message) {
    var result = await A.rpc('aula_save_course', { p_course: c });
    if (result && result.id && result.id !== c.id) c.id = result.id;
    A.localLog(message || ('Capacitación guardada: ' + c.title));
    return result;
  }

  function coursePanel() {
    if (A.ui.selectedCourse) {
      var c = A.course(A.ui.selectedCourse); if (!c) { A.ui.selectedCourse = null; return coursePanel(); }
      return '<div class="studio-columns"><section class="panel"><div class="panel-heading"><div><h2>Editar capacitación</h2><p>Los cambios se guardan directamente en Supabase.</p></div></div><form id="editCourseForm" class="demo-inline-form">' +
        '<label>Título<input name="title" value="' + A.escape(c.title) + '" required></label><label>Nota mínima<input name="passing" type="number" min="1" max="100" value="' + c.passing_score + '" required></label>' +
        '<label class="span-2">Descripción<textarea name="description" rows="4">' + A.escape(c.description) + '</textarea></label><label>Estado<select name="status"><option value="published" ' + (c.status === 'published' ? 'selected' : '') + '>Publicado</option><option value="draft" ' + (c.status === 'draft' ? 'selected' : '') + '>Borrador</option><option value="archived" ' + (c.status === 'archived' ? 'selected' : '') + '>Archivado</option></select></label>' +
        '<div class="demo-actions"><button class="primary-button" id="saveCourseBtn">Guardar cambios</button><button type="button" class="secondary-button" id="backCourses">Volver</button></div></form></section>' +
        '<section class="panel"><div class="panel-heading"><div><h2>Contenido</h2><p>Fases y bloques de la ruta secuencial.</p></div></div>' +
        (c.phases || []).map(function (p) { return '<div style="margin-bottom:20px"><h3>' + A.escape(p.title) + '</h3>' + (p.blocks || []).map(function (b) { return '<div class="block-admin-row"><div><b>' + A.escape(b.title) + '</b><small style="display:block">' + A.escape(b.type) + (b.required ? ' · obligatorio' : ' · opcional') + '</small></div><button class="secondary-button delete-block" data-id="' + A.escape(b.id) + '">Eliminar</button></div>'; }).join('') + '</div>'; }).join('') +
        '<form id="addBlockForm" class="demo-inline-form"><label>Título<input name="title" required></label><label>Tipo<select name="type"><option value="reading">Lectura</option><option value="video">Video</option><option value="presentation">Presentación</option><option value="game">Juego</option><option value="validation">Validación</option></select></label><label class="span-2">Contenido<textarea name="body" rows="3" required></textarea></label><label><input name="required" type="checkbox" checked> Obligatorio</label><div><button class="primary-button">Agregar bloque</button></div></form></section>' +
        '<section class="panel"><div class="panel-heading"><div><h2>Evaluación final</h2><p>La calificación se realiza en PostgreSQL; la respuesta correcta no se envía a los colaboradores.</p></div></div><div class="assignment-list">' +
        (c.questions || []).map(function (q, i) { return '<article class="assignment-card"><div><b>' + (i + 1) + '. ' + A.escape(q.prompt) + '</b><span>Correcta: ' + A.escape((q.options || [])[q.correct] || 'Sin definir') + '</span></div></article>'; }).join('') + '</div></section></div>';
    }
    return '<div class="studio-columns"><section class="panel"><div class="panel-heading"><div><h2>Nueva capacitación</h2><p>Crea una ruta con evaluación de 10 preguntas.</p></div></div><form id="newCourseForm" class="demo-inline-form"><label>Título<input name="title" required></label><label>Nota mínima<input name="passing" type="number" min="1" max="100" value="80" required></label><label class="span-2">Descripción<textarea name="description" rows="4" required></textarea></label><button class="primary-button">Crear capacitación</button></form></section>' +
      '<section class="panel"><div class="panel-heading"><div><h2>Capacitaciones</h2><p>' + A.state.courses.length + ' registros persistentes.</p></div></div><div class="assignment-list">' + A.state.courses.map(function (c) { return '<article class="assignment-card"><div><b>' + A.escape(c.title) + '</b><span>' + A.escape(c.description) + '</span><small>' + A.escape(c.status) + '</small></div><button class="secondary-button edit-course" data-id="' + A.escape(c.id) + '">Editar</button></article>'; }).join('') + '</div></section></div>';
  }

  function assignmentsPanel() {
    return '<div class="studio-columns"><section class="panel"><div class="panel-heading"><div><h2>Nueva asignación</h2><p>Relaciona una membresía activa con una capacitación.</p></div></div><form id="assignForm" class="demo-inline-form"><label>Usuario<select name="user">' + A.state.users.filter(function (u) { return u.is_active; }).map(function (u) { return '<option value="' + u.id + '">' + A.escape(u.full_name) + '</option>'; }).join('') + '</select></label><label>Capacitación<select name="course">' + A.state.courses.filter(function (c) { return c.status !== 'archived'; }).map(function (c) { return '<option value="' + A.escape(c.id) + '">' + A.escape(c.title) + '</option>'; }).join('') + '</select></label><label>Vencimiento<input name="due" type="date" value="' + futureDate(15) + '"></label><div><button class="primary-button">Asignar</button></div></form></section>' +
      '<section class="panel"><div class="panel-heading"><div><h2>Asignaciones activas</h2><p>Quitar una asignación no elimina el progreso ni certificados históricos.</p></div></div><div class="assignment-list">' + (A.state.assignments.length ? A.state.assignments.map(function (a) { var u = A.user(a.user_id), c = A.course(a.course_id); return '<article class="assignment-card"><div><b>' + A.escape(c ? c.title : 'Capacitación no disponible') + '</b><span>' + A.escape(u ? u.full_name : 'Usuario no disponible') + '</span><small>' + (a.due_at ? 'Vence ' + A.escape(a.due_at) : 'Sin vencimiento') + '</small></div><button class="danger-button delete-assignment" data-id="' + a.id + '">Quitar</button></article>'; }).join('') : '<div class="empty-state"><p>No hay asignaciones.</p></div>') + '</div></section></div>';
  }

  function usersPanel() {
    var allowed = A.isSuperAdmin() ? ['colaborador', 'creador_contenido', 'revisor', 'admin', 'super_admin'] : ['colaborador', 'creador_contenido', 'revisor'];
    var allRoles = ['colaborador', 'creador_contenido', 'revisor', 'admin', 'super_admin'];
    return '<div class="studio-columns"><section class="panel"><div class="panel-heading"><div><h2>Agregar usuario al Aula</h2><p>Primero se reutiliza Auth si el correo ya existe; solo se crea una cuenta nueva cuando hace falta.</p></div></div><form id="newUserForm" class="demo-inline-form"><label>Nombre completo<input name="name" required></label><label>Correo<input name="email" type="email" required></label><label>Rol<select name="role">' + allowed.map(function (r) { return '<option value="' + r + '">' + r + '</option>'; }).join('') + '</select></label><div><button class="primary-button" id="createUserBtn">Vincular / crear</button></div></form></section>' +
      '<section class="panel"><div class="panel-heading"><div><h2>Usuarios y roles</h2><p>Desactivar aquí solo afecta Aula; no bloquea la cuenta Auth compartida.</p></div></div><div class="demo-table-wrap"><table class="demo-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acción</th></tr></thead><tbody>' +
      A.state.users.map(function (u) {
        var self = u.id === A.currentUid(); var canRole = A.isSuperAdmin() && !self; var actorRank = A.profile.role === 'super_admin' ? 50 : 40; var targetRank = { colaborador: 10, creador_contenido: 20, revisor: 30, admin: 40, super_admin: 50 }[u.role] || 10; var canToggle = !self && actorRank > targetRank;
        return '<tr><td><b>' + A.escape(u.full_name) + '</b><br><small>' + A.escape(u.email) + '</small></td><td><select class="role-change" data-id="' + u.id + '" ' + (canRole ? '' : 'disabled') + '>' + allRoles.map(function (r) { return '<option value="' + r + '" ' + (r === u.role ? 'selected' : '') + '>' + r + '</option>'; }).join('') + '</select></td><td><span class="demo-chip ' + (u.is_active ? 'success' : 'warning') + '">' + (u.is_active ? 'Activo' : 'Inactivo') + '</span></td><td>' + (canToggle ? '<button class="' + (u.is_active ? 'danger-button' : 'secondary-button') + ' toggle-user" data-id="' + u.id + '">' + (u.is_active ? 'Desactivar' : 'Reactivar') + '</button>' : '<small class="demo-muted">Protegido</small>') + '</td></tr>';
      }).join('') + '</tbody></table></div></section></div>';
  }

  function certificatesPanel() {
    var sorted = A.state.certificates.slice().sort(function (a, b) { return Number(b.score) - Number(a.score); });
    return '<div class="studio-columns certificates-layout"><section class="panel"><div class="panel-heading"><div><h2>Ranking y certificados emitidos</h2><p>Resultados persistentes de las rutas de formación.</p></div></div>' +
      (sorted.length ? '<div class="certificate-list">' + sorted.map(function (c, i) { var u = A.user(c.user_id), course = A.course(c.course_id); return '<article class="certificate-row-card"><div class="certificate-rank">#' + (i + 1) + '</div><div class="certificate-main"><b>' + A.escape(u ? u.full_name : 'Usuario') + '</b><span>' + A.escape(course ? course.title : 'Capacitación') + '</span><small>Código: ' + A.escape(c.code) + ' · Puntaje: ' + c.score + '% · Emisión: ' + new Date(c.issued_at).toLocaleDateString('es-CO') + '</small></div><div class="certificate-actions"><a class="secondary-button" href="#/certificate/' + encodeURIComponent(c.code) + '">Abrir</a></div></article>'; }).join('') + '</div>' : '<div class="empty-state"><h3>Aún no hay certificados emitidos</h3></div>') +
      '</section><section class="panel"><div class="panel-heading"><div><h2>Emitir certificado</h2><p>Uso administrativo para regularizaciones o cargas autorizadas.</p></div></div><form id="manualCertForm" class="demo-inline-form"><label>Usuario<select name="user">' + A.state.users.filter(function (u) { return u.is_active; }).map(function (u) { return '<option value="' + u.id + '">' + A.escape(u.full_name) + '</option>'; }).join('') + '</select></label><label>Capacitación<select name="course">' + A.state.courses.map(function (c) { return '<option value="' + A.escape(c.id) + '">' + A.escape(c.title) + '</option>'; }).join('') + '</select></label><label>Puntaje<input name="score" type="number" min="0" max="100" value="95"></label><button class="primary-button">Emitir certificado</button></form></section></div>';
  }

  function bind() {
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { A.ui.tab = b.getAttribute('data-tab'); A.ui.selectedCourse = null; A.studio(); }; });
    document.querySelectorAll('.edit-course').forEach(function (b) { b.onclick = function () { A.ui.selectedCourse = b.getAttribute('data-id'); A.studio(); }; });
    var back = document.getElementById('backCourses'); if (back) back.onclick = function () { A.ui.selectedCourse = null; A.studio(); };

    var nf = document.getElementById('newCourseForm'); if (nf) nf.onsubmit = async function (e) {
      e.preventDefault(); var f = new FormData(nf), id = 'course-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      var c = { id: id, title: String(f.get('title')), description: String(f.get('description')), status: 'draft', passing_score: Number(f.get('passing')) || 80, phases: [{ id: A.uid('phase'), title: 'Fase 1 · Contenidos', blocks: [] }], questions: blankQuestions(id) };
      try { await persistCourse(c, 'Capacitación creada: ' + c.title); A.state.courses.unshift(c); A.ui.selectedCourse = c.id; A.toast('Capacitación creada.'); A.studio(); } catch (err) { A.toast(A.errorText(err)); }
    };
    var ef = document.getElementById('editCourseForm'); if (ef) ef.onsubmit = async function (e) {
      e.preventDefault(); var c = A.course(A.ui.selectedCourse), f = new FormData(ef); var old = { title: c.title, description: c.description, passing_score: c.passing_score, status: c.status };
      c.title = String(f.get('title')); c.description = String(f.get('description')); c.passing_score = Math.max(1, Math.min(100, Number(f.get('passing')) || 80)); c.status = String(f.get('status'));
      try { await persistCourse(c); A.toast('Capacitación actualizada.'); A.studio(); } catch (err) { Object.assign(c, old); A.toast(A.errorText(err)); }
    };
    var ab = document.getElementById('addBlockForm'); if (ab) ab.onsubmit = async function (e) {
      e.preventDefault(); var c = A.course(A.ui.selectedCourse), f = new FormData(ab); if (!c.phases.length) c.phases = [{ id: A.uid('phase'), title: 'Fase 1 · Contenidos', blocks: [] }];
      var b = { id: A.uid('block'), title: String(f.get('title')), type: String(f.get('type')), required: f.get('required') === 'on', body: String(f.get('body')) }; c.phases[c.phases.length - 1].blocks.push(b);
      try { await persistCourse(c, 'Contenido agregado a ' + c.title); A.toast('Contenido agregado.'); A.studio(); } catch (err) { c.phases[c.phases.length - 1].blocks.pop(); A.toast(A.errorText(err)); }
    };
    document.querySelectorAll('.delete-block').forEach(function (b) { b.onclick = async function () { if (!confirm('¿Eliminar este bloque?')) return; var c = A.course(A.ui.selectedCourse), id = b.getAttribute('data-id'), backup = JSON.parse(JSON.stringify(c.phases)); c.phases.forEach(function (p) { p.blocks = (p.blocks || []).filter(function (x) { return x.id !== id; }); }); try { await persistCourse(c, 'Contenido eliminado de ' + c.title); A.studio(); } catch (err) { c.phases = backup; A.toast(A.errorText(err)); } }; });

    var af = document.getElementById('assignForm'); if (af) af.onsubmit = async function (e) {
      e.preventDefault(); var f = new FormData(af), uid = String(f.get('user')), cid = String(f.get('course')), due = String(f.get('due') || '') || null;
      try { var r = await A.rpc('aula_assign_course', { p_user_id: uid, p_course_id: cid, p_due_at: due }); var existing = A.state.assignments.find(function (a) { return a.user_id === uid && a.course_id === cid; }); if (existing) { existing.due_at = due; } else { A.state.assignments.push({ id: r.id, user_id: uid, course_id: cid, due_at: due }); } A.toast('Asignación guardada.'); A.studio(); } catch (err) { A.toast(A.errorText(err)); }
    };
    document.querySelectorAll('.delete-assignment').forEach(function (b) { b.onclick = async function () { var id = b.getAttribute('data-id'); try { await A.rpc('aula_unassign_course', { p_assignment_id: id }); A.state.assignments = A.state.assignments.filter(function (a) { return a.id !== id; }); A.toast('Asignación retirada; historial conservado.'); A.studio(); } catch (err) { A.toast(A.errorText(err)); } }; });

    var uf = document.getElementById('newUserForm'); if (uf) uf.onsubmit = async function (e) {
      e.preventDefault(); var f = new FormData(uf), name = String(f.get('name')).trim(), email = String(f.get('email')).trim().toLowerCase(), role = String(f.get('role')), btn = document.getElementById('createUserBtn'); btn.disabled = true; btn.textContent = 'Procesando…';
      try {
        var linked = await A.rpc('aula_add_existing_user', { p_email: email, p_full_name: name, p_role: role }); var user;
        if (linked && linked.found) { user = { id: linked.user_id, full_name: name, email: email, role: role, is_active: true, must_change_password: false }; A.toast('Cuenta Auth existente vinculada al Aula.'); }
        else { var created = await A.invoke('aula-create-managed-user', { email: email, full_name: name, role: role }); user = { id: created.user.id, full_name: name, email: email, role: role, is_active: true, must_change_password: true }; alert('Usuario creado. Contraseña temporal (se muestra una sola vez):\n\n' + created.temporary_password + '\n\nEl usuario deberá cambiarla al ingresar.'); }
        var pos = A.state.users.findIndex(function (u) { return u.id === user.id; }); if (pos >= 0) A.state.users[pos] = user; else A.state.users.push(user); A.studio();
      } catch (err) { A.toast(A.errorText(err)); } finally { btn.disabled = false; btn.textContent = 'Vincular / crear'; }
    };
    document.querySelectorAll('.role-change').forEach(function (s) { s.onchange = async function () { var u = A.user(s.getAttribute('data-id')), old = u.role, next = s.value; try { await A.rpc('aula_set_member_role', { p_user_id: u.id, p_role: next }); u.role = next; A.toast('Rol actualizado.'); } catch (err) { s.value = old; A.toast(A.errorText(err)); } }; });
    document.querySelectorAll('.toggle-user').forEach(function (b) { b.onclick = async function () { var u = A.user(b.getAttribute('data-id')), next = !u.is_active; try { await A.rpc('aula_set_member_active', { p_user_id: u.id, p_active: next }); u.is_active = next; A.toast(next ? 'Usuario reactivado en Aula.' : 'Usuario desactivado solo en Aula.'); A.studio(); } catch (err) { A.toast(A.errorText(err)); } }; });

    var cf = document.getElementById('manualCertForm'); if (cf) cf.onsubmit = async function (e) {
      e.preventDefault(); var f = new FormData(cf), uid = String(f.get('user')), cid = String(f.get('course')), score = Math.max(0, Math.min(100, Number(f.get('score')) || 0));
      try { var r = await A.rpc('aula_issue_certificate', { p_user_id: uid, p_course_id: cid, p_score: score }); var existing = A.cert(uid, cid); if (!existing) A.state.certificates.push({ id: A.uid('cert'), code: r.code, user_id: uid, course_id: cid, score: score, issued_at: new Date().toISOString() }); A.toast('Certificado emitido.'); A.studio(); } catch (err) { A.toast(A.errorText(err)); }
    };
  }

  A.studio = function () {
    if (!A.canManage()) { location.hash = '#/'; return; }
    if (!A.canManageUsers() && A.ui.tab !== 'courses') A.ui.tab = 'courses';
    var body = A.ui.tab === 'courses' ? coursePanel() : A.ui.tab === 'assignments' ? assignmentsPanel() : A.ui.tab === 'users' ? usersPanel() : certificatesPanel();
    var html = '<div class="page admin-page"><section class="admin-hero"><div><span class="eyebrow-light">Gestión · Constructor de Aula</span><h1>Administra la formación desde el mismo aplicativo.</h1><p>Capacitaciones, contenidos, asignaciones, usuarios, progreso y certificados con persistencia real en Supabase.</p></div><div class="admin-role"><strong>' + A.escape(A.profile.role) + '</strong><span>Rol activo</span></div></section>' + tabs() + body + '</div>';
    document.getElementById('root').innerHTML = A.shell(html); A.bindShell(); bind();
  };
})(window);
