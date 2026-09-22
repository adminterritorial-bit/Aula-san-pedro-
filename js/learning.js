(function (w) {
  var A = w.AulaDemo;

  function card(x) {
    var c = x.course || x, a = x.assignment || {}, uid = A.currentUid(), pct = A.percent(uid, c), cert = A.cert(uid, c.id);
    return '<article class="panel demo-course-card"><span class="demo-kicker">' + (c.status === 'published' ? 'Capacitación publicada' : A.escape(c.status)) + '</span><h3>' + A.escape(c.title) + '</h3><p>' + A.escape(c.description) + '</p>' +
      '<div class="demo-progress-bar"><span style="width:' + pct + '%"></span></div><small class="demo-muted">' + pct + '% completado' + (a.due_at ? ' · vence ' + A.escape(a.due_at) : '') + '</small>' +
      '<div class="demo-card-actions"><a class="primary-button" href="#/course/' + encodeURIComponent(c.id) + '">' + (pct ? 'Continuar' : 'Iniciar') + '</a>' + (cert ? '<a class="secondary-button" href="#/certificate/' + encodeURIComponent(cert.code) + '">Certificado</a>' : '') + '</div></article>';
  }

  A.dashboard = function () {
    var uid = A.currentUid(), items = A.assigned(uid), certs = A.state.certificates.filter(function (c) { return c.user_id === uid; });
    var avg = items.length ? Math.round(items.reduce(function (s, x) { return s + A.percent(uid, x.course); }, 0) / items.length) : 0;
    var html = '<div class="page"><section class="dashboard-hero"><div><span class="hero-pill"><span class="demo-status-dot"></span> Supabase conectado</span><h1>Aprende, participa y certifícate.</h1><p>Completa contenidos obligatorios y actividades antes de presentar la evaluación final.</p><div class="hero-actions"><a class="yellow-button" href="#/catalog">Ver mis capacitaciones</a>' + (A.canManage() ? '<a class="glass-button" href="#/studio">Gestionar Aula</a>' : '') + '</div></div><div class="hero-metric"><strong>' + certs.length + '</strong><span>Certificados obtenidos</span></div></section>' +
      '<section class="metric-grid"><article><div><span>Capacitaciones visibles</span><strong>' + items.length + '</strong></div></article><article><div><span>Certificadas</span><strong>' + certs.length + '</strong></div></article><article><div><span>Juegos disponibles</span><strong>6</strong></div></article><article><div><span>Progreso promedio</span><strong>' + avg + '%</strong></div></article></section>' +
      '<section class="section-heading"><div><span class="eyebrow">Continuar aprendizaje</span><h2>Capacitaciones</h2><p>El avance se conserva en Supabase y se desbloquea de forma secuencial.</p></div><a href="#/catalog">Ver todas</a></section>' +
      (items.length ? '<div class="course-grid">' + items.slice(0, 3).map(card).join('') + '</div>' : '<section class="panel empty-state"><h3>No tienes capacitaciones asignadas</h3><p>Cuando un administrador te asigne una ruta aparecerá aquí.</p></section>') +
      '<section class="section-heading" style="margin-top:34px"><div><span class="eyebrow">Actividad</span><h2>Trazabilidad</h2><p>Últimos eventos relevantes de tu experiencia en Aula.</p></div></section><section class="panel">' +
      (A.state.activity.length ? A.state.activity.slice(0, 8).map(function (ev) { return '<div style="padding:10px 0;border-bottom:1px solid #edf1f6"><b>' + new Date(ev.at).toLocaleString('es-CO') + '</b><div class="demo-muted">' + A.escape(ev.text) + '</div></div>'; }).join('') : '<p class="demo-muted">Aún no hay actividad registrada.</p>') + '</section></div>';
    document.getElementById('root').innerHTML = A.shell(html); A.bindShell();
  };

  A.catalog = function () {
    var items = A.assigned(A.currentUid());
    document.getElementById('root').innerHTML = A.shell('<div class="page"><section class="section-heading"><div><span class="eyebrow">Ruta personal</span><h1>Mis capacitaciones</h1><p>Contenido disponible según tus asignaciones y permisos.</p></div></section>' + (items.length ? '<div class="course-grid">' + items.map(card).join('') + '</div>' : '<section class="panel empty-state"><h3>Sin capacitaciones asignadas</h3><p>Consulta con el administrador del Aula.</p></section>') + '</div>');
    A.bindShell();
  };

  function blockBody(entry) {
    var b = entry.block, type = { video: 'Video', presentation: 'Presentación', reading: 'Lectura', game: 'Actividad interactiva', validation: 'Validación' }[b.type] || b.type;
    if (b.type === 'video' || b.type === 'presentation') return '<div class="demo-media-placeholder"><div><strong>' + (b.type === 'video' ? '▶ ' : '▣ ') + A.escape(type) + '</strong><p>' + A.escape(b.body || 'Recurso de capacitación.') + '</p></div></div>';
    if (b.type === 'game') return '<div class="demo-resource"><h3>Actividad · Toma una decisión</h3><p>' + A.escape(b.body) + '</p><div class="demo-actions"><button type="button" class="secondary-button demo-choice" data-ok="0">Actuar sin revisar</button><button type="button" class="secondary-button demo-choice" data-ok="1">Revisar, decidir y dejar evidencia</button></div><p id="gameFeedback" class="demo-muted"></p></div>';
    if (b.type === 'validation') return '<div class="demo-resource"><h3>Validación rápida</h3><p>' + A.escape(b.body) + '</p><div class="demo-actions"><button type="button" class="secondary-button demo-valid" data-ok="1">Comprendido</button><button type="button" class="secondary-button demo-valid" data-ok="0">Necesito revisarlo</button></div><p id="validationFeedback" class="demo-muted"></p></div>';
    return '<div class="demo-stage-copy"><h3>Contenido de lectura</h3><p>' + A.escape(b.body) + '</p></div>';
  }

  function examMarkup(course) {
    if (!course.questions || !course.questions.length) return '<section class="panel"><h3>Evaluación no configurada</h3></section>';
    return '<section class="exam-panel"><span class="eyebrow">Evaluación certificable</span><h2>Examen final</h2><p>Responde ' + course.questions.length + ' preguntas. Nota mínima: ' + course.passing_score + '%.</p><form id="examForm">' +
      course.questions.map(function (q, i) { return '<article class="demo-exam-question"><h3>' + (i + 1) + '. ' + A.escape(q.prompt) + '</h3>' + (q.options || []).map(function (op, oi) { return '<label><input type="radio" name="' + A.escape(q.id) + '" value="' + oi + '" required> <span>' + A.escape(op) + '</span></label>'; }).join('') + '</article>'; }).join('') +
      '<button class="primary-button" id="submitExam">Enviar examen</button></form></section>';
  }

  function resultMarkup(res) {
    return '<section class="exam-result ' + (res.passed ? 'passed' : 'failed') + '"><div style="font-size:48px">' + (res.passed ? '✓' : '!') + '</div><h2>' + (res.passed ? 'Capacitación aprobada' : 'Aún no alcanzas la nota mínima') + '</h2><p>Resultado: <b>' + res.score + '%</b>.</p>' +
      (res.passed && res.code ? '<a class="primary-button" href="#/certificate/' + encodeURIComponent(res.code) + '">Abrir certificado</a>' : '<button class="primary-button" id="retryExam">Intentar nuevamente</button>') + '</section>';
  }

  A.courseView = function (id) {
    var c = A.course(id), uid = A.currentUid();
    if (!c) { location.hash = '#/catalog'; return; }
    var flat = A.flatten(c), done = A.progress(uid, id), required = flat.filter(function (x) { return x.block.required; });
    var allDone = required.every(function (x) { return done.indexOf(x.block.id) >= 0; });
    var selected = A.ui.selectedBlock[id];
    if (!selected || !flat.some(function (x) { return x.block.id === selected; })) {
      var next = flat.find(function (x) { return done.indexOf(x.block.id) < 0; }) || flat[0]; selected = next && next.block.id; A.ui.selectedBlock[id] = selected;
    }
    var current = flat.find(function (x) { return x.block.id === selected; });
    var pct = A.percent(uid, c);
    var path = flat.map(function (x, i) {
      var complete = done.indexOf(x.block.id) >= 0;
      var priorRequired = flat.slice(0, i).filter(function (y) { return y.block.required; });
      var locked = !A.canManage() && priorRequired.some(function (y) { return done.indexOf(y.block.id) < 0; });
      return '<button type="button" class="secondary-button course-step ' + (x.block.id === selected ? 'active' : '') + '" data-block="' + A.escape(x.block.id) + '" ' + (locked ? 'disabled' : '') + ' style="display:block;width:100%;margin:0 0 8px;text-align:left">' + (complete ? '✓ ' : locked ? '🔒 ' : '') + A.escape(x.block.title) + '</button>';
    }).join('');
    var stage = current ? '<section class="panel"><span class="demo-kicker">' + A.escape(current.phase.title) + '</span><h2>' + A.escape(current.block.title) + '</h2><p class="demo-muted">' + A.escape(current.block.body || '') + '</p>' + blockBody(current) + '<div class="stage-nav" style="margin-top:22px"><button id="completeBlock" class="' + (done.indexOf(current.block.id) >= 0 ? 'secondary-button' : 'primary-button') + '">' + (done.indexOf(current.block.id) >= 0 ? '✓ Contenido completado' : 'Marcar como completado') + '</button></div></section>' : '<section class="panel"><p>No hay contenido configurado.</p></section>';
    var exam = A.ui.examCourse === id ? (A.ui.lastExam && A.ui.lastExam.courseId === id ? resultMarkup(A.ui.lastExam) : examMarkup(c)) : '<section class="panel"><span class="eyebrow">Evaluación final</span><h2>Certifica tu aprendizaje</h2><p>' + (allDone ? 'Ya completaste los contenidos obligatorios.' : 'Completa primero todos los contenidos obligatorios.') + '</p><button id="launchExam" class="primary-button" ' + (allDone ? '' : 'disabled') + '>Presentar examen</button></section>';
    var html = '<div class="page"><section class="section-heading"><div><span class="eyebrow">Capacitación</span><h1>' + A.escape(c.title) + '</h1><p>' + A.escape(c.description) + '</p></div><a href="#/catalog">← Mis capacitaciones</a></section>' +
      '<section class="panel"><div style="display:flex;justify-content:space-between;gap:16px;align-items:center"><div><b>Progreso</b><div class="demo-muted">' + done.length + ' contenidos registrados</div></div><strong>' + pct + '%</strong></div><div class="demo-progress-bar"><span style="width:' + pct + '%"></span></div></section>' +
      '<div class="studio-columns" style="margin-top:22px"><aside class="panel"><h3>Ruta de aprendizaje</h3><p class="demo-muted">Avanza en orden por los contenidos obligatorios.</p>' + path + '</aside><div>' + stage + '<div style="margin-top:20px">' + exam + '</div></div></div></div>';
    document.getElementById('root').innerHTML = A.shell(html); A.bindShell();

    document.querySelectorAll('.course-step').forEach(function (b) { b.onclick = function () { A.ui.selectedBlock[id] = b.getAttribute('data-block'); A.courseView(id); }; });
    document.querySelectorAll('.demo-choice').forEach(function (b) { b.onclick = function () { var f = document.getElementById('gameFeedback'); f.textContent = b.getAttribute('data-ok') === '1' ? 'Correcto: primero verifica, decide y deja evidencia.' : 'Revisa la decisión antes de continuar.'; }; });
    document.querySelectorAll('.demo-valid').forEach(function (b) { b.onclick = function () { document.getElementById('validationFeedback').textContent = b.getAttribute('data-ok') === '1' ? 'Validación registrada en la experiencia.' : 'Puedes revisar nuevamente el contenido antes de marcarlo.'; }; });

    var complete = document.getElementById('completeBlock');
    if (complete && current) complete.onclick = async function () {
      if (done.indexOf(current.block.id) >= 0) return;
      complete.disabled = true; complete.textContent = 'Guardando…';
      try {
        await A.rpc('aula_complete_block', { p_course_id: id, p_block_id: current.block.id });
        if (done.indexOf(current.block.id) < 0) done.push(current.block.id);
        A.toast('Progreso guardado en Supabase.');
        var index = flat.findIndex(function (x) { return x.block.id === current.block.id; });
        if (flat[index + 1]) A.ui.selectedBlock[id] = flat[index + 1].block.id;
        A.courseView(id);
      } catch (err) { A.toast(A.errorText(err)); complete.disabled = false; complete.textContent = 'Marcar como completado'; }
    };
    var launch = document.getElementById('launchExam'); if (launch) launch.onclick = function () { A.ui.examCourse = id; A.ui.lastExam = null; A.courseView(id); };
    var form = document.getElementById('examForm'); if (form) form.onsubmit = async function (e) {
      e.preventDefault(); var answers = {}; c.questions.forEach(function (q) { var p = form.querySelector('input[name="' + q.id + '"]:checked'); if (p) answers[q.id] = Number(p.value); });
      var btn = document.getElementById('submitExam'); btn.disabled = true; btn.textContent = 'Calificando…';
      try {
        var res = await A.rpc('aula_submit_exam', { p_course_id: id, p_answers: answers });
        A.ui.lastExam = { courseId: id, score: res.score, passed: res.passed, code: res.code || null };
        if (res.passed && res.code && !A.cert(uid, id)) A.state.certificates.push({ id: A.uid('cert'), code: res.code, user_id: uid, course_id: id, score: res.score, issued_at: new Date().toISOString() });
        A.courseView(id);
      } catch (err) { A.toast(A.errorText(err)); btn.disabled = false; btn.textContent = 'Enviar examen'; }
    };
    var retry = document.getElementById('retryExam'); if (retry) retry.onclick = function () { A.ui.lastExam = null; A.courseView(id); };
  };

  A.games = function () {
    var list = [['Memoria de conceptos', 'Une conceptos y definiciones.'], ['Clasificación', 'Clasifica riesgos, señales o procesos.'], ['Ordenar pasos', 'Organiza procedimientos y protocolos.'], ['Búsqueda visual', 'Encuentra elementos dentro de una imagen.'], ['Mini RPG', 'Recorre zonas y completa misiones.'], ['Cartas de decisión', 'Resuelve casos y recibe retroalimentación.']];
    document.getElementById('root').innerHTML = A.shell('<div class="page"><section class="section-heading"><div><span class="eyebrow">Biblioteca didáctica</span><h1>Juegos de capacitación</h1><p>Plantillas para complementar las rutas de aprendizaje.</p></div></section><div class="game-library">' + list.map(function (g, i) { return '<article><div style="font-size:26px">' + (i + 1) + '</div><h3>' + A.escape(g[0]) + '</h3><p>' + A.escape(g[1]) + '</p><span>Plantilla disponible</span></article>'; }).join('') + '</div></div>'); A.bindShell();
  };

  A.certificateView = function (code) {
    var cert = A.state.certificates.find(function (c) { return c.code === code; });
    if (!cert) { document.getElementById('root').innerHTML = A.shell('<div class="page"><div class="empty-state"><h2>Certificado no encontrado</h2><a class="primary-button" href="#/">Volver</a></div></div>'); A.bindShell(); return; }
    if (cert.user_id !== A.currentUid() && !A.canManage()) { location.hash = '#/'; return; }
    var u = A.user(cert.user_id), c = A.course(cert.course_id);
    var html = '<div class="page"><div class="print-hide demo-actions"><a class="secondary-button" href="#/">← Volver</a><button id="printCert" class="primary-button">Imprimir / guardar PDF</button></div><section class="demo-certificate"><span class="demo-kicker" style="justify-content:center">Aula de Formación · San Pedro</span><h1>Certificado</h1><p>Se certifica que</p><div class="recipient">' + A.escape(u ? u.full_name : 'Usuario') + '</div><p>completó y aprobó satisfactoriamente la capacitación</p><div class="course">' + A.escape(c ? c.title : 'Capacitación') + '</div><p class="demo-muted">' + A.escape(c ? c.description : '') + '</p><div class="meta"><span><b>Puntaje</b><br>' + cert.score + '%</span><span><b>Fecha</b><br>' + new Date(cert.issued_at).toLocaleDateString('es-CO') + '</span><span><b>Código</b><br>' + A.escape(cert.code) + '</span></div></section></div>';
    document.getElementById('root').innerHTML = A.shell(html); A.bindShell(); document.getElementById('printCert').onclick = function () { window.print(); };
  };
})(window);
