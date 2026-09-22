(function (w) {
  var A = w.AulaDemo;

  function journey(item) {
    var c = item.course || item, a = item.assignment || {}, uid = A.currentUid(), pct = A.percent(uid, c), cert = A.cert(uid, c.id);
    var due = a.due_at ? new Date(a.due_at + 'T23:59:59') : null;
    var overdue = !!(due && due.getTime() < Date.now() && !cert);
    var state = cert ? 'certified' : pct >= 100 ? 'exam' : pct > 0 ? 'progress' : 'new';
    return { c:c, a:a, pct:pct, cert:cert, overdue:overdue, state:state };
  }

  function statusLabel(state) {
    return { certified:'Certificada', exam:'Lista para examen', progress:'En progreso', new:'Sin iniciar' }[state] || 'Sin iniciar';
  }

  function dueLabel(value) {
    if (!value) return 'Sin vencimiento';
    try { return 'Vence ' + new Date(value + 'T23:59:59').toLocaleDateString('es-CO'); }
    catch (_) { return 'Vence ' + value; }
  }

  function coverFrame(course, compact) {
    var cls='course-cover-frame ' + (compact ? 'compact ' : '') + (course.cover_url ? 'loaded' : '');
    return '<div class="' + cls + '">' +
      (course.cover_url
        ? '<img src="' + A.escape(course.cover_url) + '" alt="' + A.escape(course.title || 'Portada de capacitación') + '" loading="lazy">'
        : '<div class="course-cover-placeholder">' + A.icon('book', compact ? 22 : 34) + '</div>') +
      '<div class="course-cover-shine"></div></div>';
  }

  function homeCourseCard(item) {
    var x=journey(item), c=x.c;
    return '<a class="home-course-card" href="#/course/' + encodeURIComponent(c.id) + '">' +
      '<div class="home-course-cover ' + (c.cover_url ? 'is-ready' : '') + '">' +
        (c.cover_url
          ? '<img src="' + A.escape(c.cover_url) + '" alt="' + A.escape(c.title) + '" loading="lazy">'
          : '<div class="home-cover-fallback">' + A.icon('book',38) + '</div>') +
        '<span>' + A.escape(statusLabel(x.state)) + '</span>' +
      '</div>' +
      '<div class="home-course-body">' +
        '<h3>' + A.escape(c.title) + '</h3>' +
        '<p>' + A.escape(c.description || 'Capacitación institucional.') + '</p>' +
        '<footer><span>' + A.escape(c.category || 'General') + ' · ' + Number(c.estimated_minutes || 30) + ' min</span><span>' + dueLabel(x.a.due_at) + '</span></footer>' +
      '</div>' +
      '<span class="home-course-cta">' + A.icon('play',16) + (x.state==='exam' ? ' Ir al examen' : x.pct ? ' Continuar' : ' Abrir') + '</span>' +
    '</a>';
  }

  function catalogCourseCard(item, index) {
    var x=journey(item), c=x.c;
    var icon=x.state==='certified'?'trophy':x.state==='exam'?'graduation':x.state==='progress'?'play':'book';
    var action=x.state==='certified'?'Repasar':x.state==='exam'?'Presentar examen':x.state==='progress'?'Continuar':'Comenzar';
    var flat=A.flatten(c), required=flat.filter(function(v){return v.block.required;}), done=A.progress(A.currentUid(),c.id);
    var completedCount=required.filter(function(v){return done.indexOf(v.block.id)>=0;}).length;
    return '<article class="catalog-course-card journey-' + x.state + (x.overdue?' overdue':'') + '" style="--delay:' + Math.min(index,12)*45 + 'ms">' +
      '<a class="catalog-card-link-overlay" href="#/course/' + encodeURIComponent(c.id) + '" aria-label="' + A.escape(action + ' ' + c.title) + '"></a>' +
      '<div class="catalog-card-visual">' +
        coverFrame(c,false) +
        '<div class="catalog-card-image-overlay"></div>' +
        '<span class="catalog-card-icon">' + A.icon(icon,22) + '</span>' +
        '<span class="catalog-card-progress-pill">' + x.pct + '%</span>' +
        '<span class="catalog-card-hover-action">' + A.icon('play',19) + ' ' + action + '</span>' +
      '</div>' +
      '<div class="catalog-card-body">' +
        '<div class="catalog-card-status-row"><span class="catalog-status-badge ' + x.state + '">' + A.icon(icon,13) + ' ' + statusLabel(x.state) + '</span>' +
        (x.overdue?'<span class="catalog-overdue-badge">Fecha vencida</span>':'') + '</div>' +
        '<h3>' + A.escape(c.title) + '</h3>' +
        '<p>' + A.escape(c.description || 'Capacitación institucional.') + '</p>' +
        '<div class="catalog-card-progress"><div><span style="width:' + x.pct + '%"></span></div><small>' + completedCount + ' de ' + required.length + ' contenidos obligatorios</small></div>' +
        '<div class="catalog-card-facts"><span>' + A.icon('calendar',14) + ' ' + dueLabel(x.a.due_at) + '</span><span>' + A.icon('filecheck',14) + ' Aprobación ' + Number(c.passing_score || 80) + '%</span></div>' +
      '</div>' +
      '<footer class="catalog-card-footer">' +
        (x.cert?'<a class="catalog-certificate-button" href="#/certificate/' + encodeURIComponent(x.cert.code) + '">' + A.icon('badge',16) + ' Certificado</a>':'') +
        '<a class="catalog-open-button" href="#/course/' + encodeURIComponent(c.id) + '">' + action + ' ' + A.icon('arrow',16) + '</a>' +
      '</footer>' +
    '</article>';
  }

  function resumeLearningCard(item) {
    var x=journey(item), c=x.c;
    return '<section class="catalog-resume-card">' +
      '<div class="catalog-resume-cover">' + coverFrame(c,true) + '<span class="catalog-resume-play">' + A.icon(x.state==='exam'?'graduation':'play',20) + '</span></div>' +
      '<div class="catalog-resume-copy"><span>' + (x.state==='exam'?'Ya puedes cerrar esta ruta':'Continúa donde quedaste') + '</span><h2>' + A.escape(c.title) + '</h2><div class="catalog-resume-progress"><div><span style="width:' + x.pct + '%"></span></div><strong>' + x.pct + '%</strong></div></div>' +
      '<div class="catalog-resume-meta"><span>' + A.icon('clock',14) + ' ' + dueLabel(x.a.due_at) + '</span><a href="#/course/' + encodeURIComponent(c.id) + '">' + (x.state==='exam'?'Ir al examen':'Continuar') + ' ' + A.icon('arrow',17) + '</a></div>' +
    '</section>';
  }

  function routeCard(tp) {
    if (!tp || !tp.position) return '';
    var comps=tp.competencies||[], paths=tp.paths||[];
    return '<section class="home-training-route-card">' +
      '<div class="home-training-route-head"><span class="home-training-route-icon">' + A.icon('briefcase',22) + '</span><div><span>MI RUTA FORMATIVA</span><h2>' + A.escape(tp.position.name) + '</h2><p>' + A.escape(tp.position.department || 'Ruta de formación asociada a tu cargo actual.') + '</p></div></div>' +
      '<div class="home-training-route-content"><div><strong>' + A.icon('target',16) + ' Competencias esperadas</strong><div class="home-training-chip-list">' +
        (comps.length?comps.slice(0,6).map(function(x){return '<span>' + A.escape(x.name) + '<b>N' + Number(x.required_level||1) + '</b></span>';}).join(''):'<small>Aún no hay competencias configuradas para este cargo.</small>') +
      '</div></div><div><strong>' + A.icon('layers',16) + ' Rutas asignadas</strong><div class="home-training-path-list">' +
        (paths.length?paths.map(function(x){return '<span>' + A.icon('layers',14) + ' ' + A.escape(x.name) + '</span>';}).join(''):'<small>Aún no hay rutas vinculadas a este cargo.</small>') +
      '</div></div></div></section>';
  }

  A.dashboard = function () {
    var uid=A.currentUid(), items=A.assigned(uid), certs=A.state.certificates.filter(function(c){return c.user_id===uid;});
    var firstName=String((A.profile&&A.profile.full_name)||'Colaborador').trim().split(/\s+/)[0]||'Colaborador';
    var tp=A.trainingProfile;
    var visible=items.slice(0,6);

    var html='<main class="learner-home-page">' +
      '<section class="home-original-hero">' +
        '<div class="home-hero-motion" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
        '<div><span class="home-hero-pill">' + A.icon('sparkle',15) + ' Plataforma conectada</span>' +
          '<h1>Aprende, participa y certifícate.</h1>' +
          '<p>' + A.escape(firstName) + ', completa contenidos, recursos, actividades y juegos antes de presentar la evaluación final de cada ruta.</p>' +
          '<div class="home-hero-actions"><a class="home-yellow-button" href="#/catalog">Ver mis capacitaciones</a>' +
          (A.canManage()?'<a class="home-glass-button" href="#/studio">' + A.icon('shield',18) + ' Gestión Aula</a>':'') + '</div>' +
        '</div>' +
        '<div class="home-hero-metric"><strong>' + certs.length + '</strong><span>Certificados obtenidos</span></div>' +
      '</section>' +

      '<section class="home-metric-grid">' +
        '<article>' + A.icon('book',24) + '<div><span>Asignadas visibles</span><strong>' + items.length + '</strong></div></article>' +
        '<article>' + A.icon('graduation',24) + '<div><span>Certificadas</span><strong>' + certs.length + '</strong></div></article>' +
        '<article>' + A.icon('game',24) + '<div><span>Juegos disponibles</span><strong>6+</strong></div></article>' +
        '<article>' + A.icon('badge',24) + '<div><span>Nota mínima</span><strong>80%</strong></div></article>' +
      '</section>' +

      routeCard(tp) +

      '<section class="home-section-heading"><div><span>CONTINUAR APRENDIZAJE</span><h2>Capacitaciones asignadas</h2><p>Abre cualquier capacitación sin perder la navegación principal.</p></div><a href="#/catalog">Ver todas</a></section>' +
      (visible.length?'<div class="home-course-grid">' + visible.map(homeCourseCard).join('') + '</div>':'<div class="home-empty">' + A.icon('book',30) + '<h3>Aún no tienes capacitaciones visibles</h3><p>Cuando te asignen una capacitación publicada aparecerá aquí.</p></div>') +

      '<section class="home-section-heading section-spacing-top"><div><span>CERTIFICACIÓN</span><h2>Mis certificados</h2><p>Consulta las evidencias que ya has obtenido.</p></div></section>' +
      (certs.length?'<div class="home-certificate-list">' + certs.slice(0,6).map(function(item){var co=A.course(item.course_id);return '<article><div><b>' + A.escape(co?co.title:'Capacitación institucional') + '</b><span>Código: ' + A.escape(item.code) + '</span><small>' + new Date(item.issued_at).toLocaleDateString('es-CO') + ' · ' + item.score + '%</small></div><a href="#/certificate/' + encodeURIComponent(item.code) + '">' + A.icon('trophy',16) + ' Abrir certificado</a></article>';}).join('') + '</div>':'<div class="home-empty compact">' + A.icon('trophy',28) + '<h3>Aún no tienes certificados</h3><p>Aprueba una capacitación con la nota mínima para generarlo automáticamente.</p></div>') +
    '</main>';

    document.getElementById('root').innerHTML=A.shell(html); A.bindShell();
    if (!A.trainingProfile && !A.ui.trainingProfileLoading) {
      A.ui.trainingProfileLoading=true;
      A.loadTrainingProfile().finally(function(){A.ui.trainingProfileLoading=false;if(location.hash===''||location.hash==='#/'||location.hash==='#')A.dashboard();});
    }
  };

  A.catalog = function () {
    var items=A.assigned(A.currentUid()).map(journey);
    A.ui.catalogFilter=A.ui.catalogFilter||'all'; A.ui.catalogSearch=A.ui.catalogSearch||''; A.ui.catalogSort=A.ui.catalogSort||'recent';
    var q=A.ui.catalogSearch.trim().toLowerCase();
    var filtered=items.filter(function(x){
      var ok=A.ui.catalogFilter==='all'||x.state===A.ui.catalogFilter;
      return ok&&(!q||(x.c.title+' '+x.c.description+' '+(x.c.category||'')).toLowerCase().indexOf(q)>=0);
    });
    if(A.ui.catalogSort==='progress') filtered.sort(function(a,b){return b.pct-a.pct;});
    if(A.ui.catalogSort==='title') filtered.sort(function(a,b){return a.c.title.localeCompare(b.c.title,'es');});
    if(A.ui.catalogSort==='due') filtered.sort(function(a,b){return String(a.a.due_at||'9999').localeCompare(String(b.a.due_at||'9999'));});

    var counts={all:items.length,new:0,progress:0,exam:0,certified:0};
    items.forEach(function(x){counts[x.state]=(counts[x.state]||0)+1;});
    var filters=[['all','Todas'],['new','Sin iniciar'],['progress','En progreso'],['exam','Listas para examen'],['certified','Certificadas']];
    var resume=items.filter(function(x){return x.state==='progress'||x.state==='exam';}).sort(function(a,b){return b.pct-a.pct;})[0]||null;
    var firstName=String((A.profile&&A.profile.full_name)||'Colaborador').trim().split(/\s+/)[0]||'Colaborador';

    var html='<main class="learner-course-app learner-catalog-app catalog-original-page">' +
      '<section class="catalog-original-hero">' +
        '<div class="catalog-original-hero-motion" aria-hidden="true"><span class="original-hero-orb orb-large"></span><span class="original-hero-orb orb-small"></span><span class="original-hero-spark spark-one"></span><span class="original-hero-spark spark-two"></span><span class="original-hero-dot dot-one"></span><span class="original-hero-dot dot-two"></span><span class="original-hero-dot dot-three"></span></div>' +
        '<div class="catalog-original-copy"><span class="catalog-original-pill">' + A.icon('sparkle',15) + ' Plataforma conectada</span><h1>Aprende, participa y certifícate.</h1><p>' + A.escape(firstName) + ', completa tus contenidos, recursos y actividades dentro de una misma ruta antes de presentar el examen final.</p>' +
          '<div class="catalog-original-actions">' +
            (resume?'<a class="catalog-original-yellow" href="#/course/' + encodeURIComponent(resume.c.id) + '">' + A.icon('play',18) + ' Continuar capacitación</a>':'<a class="catalog-original-yellow" href="#catalogWorkspace">' + A.icon('book',18) + ' Ver mis capacitaciones</a>') +
            '<a class="catalog-original-glass" href="#/games">' + A.icon('game',18) + ' Juegos</a>' +
          '</div></div>' +
        '<div class="catalog-original-hero-metric"><strong>' + counts.certified + '</strong><span>Certificados obtenidos</span></div>' +
      '</section>' +

      '<section class="catalog-original-metrics" aria-label="Resumen de capacitaciones">' +
        '<article>' + A.icon('book',24) + '<div><span>Asignadas visibles</span><strong>' + counts.all + '</strong></div></article>' +
        '<article>' + A.icon('play',24) + '<div><span>En progreso</span><strong>' + counts.progress + '</strong></div></article>' +
        '<article>' + A.icon('graduation',24) + '<div><span>Listas para examen</span><strong>' + counts.exam + '</strong></div></article>' +
        '<article>' + A.icon('trophy',24) + '<div><span>Certificadas</span><strong>' + counts.certified + '</strong></div></article>' +
      '</section>' +

      (resume?resumeLearningCard(resume):'') +

      '<section class="catalog-workspace" id="catalogWorkspace">' +
        '<header class="catalog-workspace-header catalog-original-heading"><div><span>CONTINUAR APRENDIZAJE</span><h2>Mis capacitaciones</h2><p>Busca, filtra y continúa tu ruta con el mismo lenguaje visual de Aula San Pedro.</p></div><div class="catalog-result-count"><strong>' + filtered.length + '</strong><span>' + (filtered.length===1?'capacitación':'capacitaciones') + '</span></div></header>' +
        '<div class="catalog-toolbar"><label class="catalog-search">' + A.icon('search',18) + '<input id="catalogSearch" value="' + A.escape(A.ui.catalogSearch) + '" placeholder="Buscar capacitación…"></label><label class="catalog-sort">' + A.icon('sliders',17) + '<select id="catalogSort"><option value="recent">Más recientes</option><option value="due">Fecha límite</option><option value="progress">Mayor progreso</option><option value="title">A–Z</option></select></label></div>' +
        '<div class="catalog-filter-row" aria-label="Filtros de capacitaciones">' + A.icon('filter',16) + filters.map(function(f){return '<button data-filter="' + f[0] + '" class="' + (A.ui.catalogFilter===f[0]?'active':'') + '"><span>' + f[1] + '</span><strong>' + counts[f[0]] + '</strong></button>';}).join('') + '</div>' +
        (filtered.length?'<div class="catalog-course-grid">' + filtered.map(catalogCourseCard).join('') + '</div>':'<div class="catalog-empty">' + A.icon('search',30) + '<h3>No encontramos capacitaciones con esos filtros</h3><p>Prueba otra búsqueda o vuelve a mostrar todas tus capacitaciones.</p><button id="clearCatalogFilters">Ver todas</button></div>') +
      '</section>' +
    '</main>';

    document.getElementById('root').innerHTML=A.shell(html); A.bindShell();
    var search=document.getElementById('catalogSearch'); if(search)search.oninput=function(){A.ui.catalogSearch=search.value;A.catalog();};
    var sort=document.getElementById('catalogSort'); if(sort){sort.value=A.ui.catalogSort;sort.onchange=function(){A.ui.catalogSort=sort.value;A.catalog();};}
    document.querySelectorAll('[data-filter]').forEach(function(b){b.onclick=function(){A.ui.catalogFilter=b.getAttribute('data-filter');A.catalog();};});
    var clear=document.getElementById('clearCatalogFilters'); if(clear)clear.onclick=function(){A.ui.catalogSearch='';A.ui.catalogFilter='all';A.catalog();};
  };

  function blockBody(entry) {
    var b=entry.block,type=b.type||'reading',body=b.body||b.text||'',url=b.url||'';
    if(type==='video') return '<div class="course-media-frame">'+(url?'<video controls preload="metadata" src="'+A.escape(url)+'"></video>':'<div class="media-fallback">▶<strong>Video</strong><span>'+A.escape(body||'Agrega una URL de video desde Gestión Aula.')+'</span></div>')+'</div>';
    if(type==='presentation'||type==='pdf') return '<div class="course-media-frame">'+(url?'<iframe title="'+A.escape(b.title)+'" src="'+A.escape(url)+'"></iframe>':'<div class="media-fallback">▣<strong>'+A.escape(type==='pdf'?'Documento PDF':'Presentación')+'</strong><span>'+A.escape(body||'Recurso pendiente de URL.')+'</span></div>')+'</div>';
    if(type==='image') return url?'<div class="course-image-resource"><img src="'+A.escape(url)+'" alt="'+A.escape(b.title)+'"></div>':'<div class="media-fallback">▧<strong>Imagen</strong></div>';
    if(type==='audio') return '<div class="course-resource-card"><strong>Audio de aprendizaje</strong>'+(url?'<audio controls src="'+A.escape(url)+'"></audio>':'<p>'+A.escape(body)+'</p>')+'</div>';
    if(type==='link') return '<div class="course-resource-card"><p>'+A.escape(body)+'</p>'+(url?'<a class="primary-button" href="'+A.escape(url)+'" target="_blank" rel="noopener">Abrir recurso externo ↗</a>':'')+'</div>';
    if(type==='game') return '<div class="course-resource-card"><span class="eyebrow">Actividad interactiva</span><h3>Toma una decisión</h3><p>'+A.escape(body)+'</p><div class="demo-actions"><button type="button" class="secondary-button demo-choice" data-ok="0">Actuar sin verificar</button><button type="button" class="secondary-button demo-choice" data-ok="1">Verificar, decidir y dejar evidencia</button></div><p id="gameFeedback" class="demo-muted"></p></div>';
    if(type==='validation') return '<div class="course-resource-card"><span class="eyebrow">Validación</span><h3>Comprueba tu comprensión</h3><p>'+A.escape(body)+'</p><div class="demo-actions"><button type="button" class="secondary-button demo-valid" data-ok="1">Comprendido</button><button type="button" class="secondary-button demo-valid" data-ok="0">Quiero revisarlo de nuevo</button></div><p id="validationFeedback" class="demo-muted"></p></div>';
    return '<div class="course-reading"><p>'+A.escape(body).replace(/\n/g,'</p><p>')+'</p></div>';
  }

  function examMarkup(course) {
    if(!course.questions||!course.questions.length) return '<section class="course-exam-panel"><h3>Evaluación no configurada</h3></section>';
    return '<section class="course-exam-panel"><span class="eyebrow">Evaluación certificable</span><h2>Examen final</h2><p>Responde '+course.questions.length+' preguntas. Nota mínima: <b>'+course.passing_score+'%</b>.</p><form id="examForm">'+course.questions.map(function(q,i){return '<article class="premium-exam-question"><div class="question-number">'+(i+1)+'</div><div><h3>'+A.escape(q.prompt)+'</h3>'+(q.options||[]).map(function(op,oi){return '<label><input type="radio" name="'+A.escape(q.id)+'" value="'+oi+'" required><span>'+A.escape(op)+'</span></label>';}).join('')+'</div></article>';}).join('')+'<button class="primary-button" id="submitExam">Enviar evaluación</button></form></section>';
  }

  function resultMarkup(res) {
    return '<section class="exam-result '+(res.passed?'passed':'failed')+'"><div class="result-orb">'+(res.passed?'✓':'!')+'</div><span class="eyebrow">'+(res.passed?'Resultado aprobado':'Resultado')+'</span><h2>'+(res.passed?'Capacitación aprobada':'Aún no alcanzas la nota mínima')+'</h2><p>Tu resultado fue <b>'+res.score+'%</b>.</p>'+(res.passed&&res.code?'<a class="primary-button" href="#/certificate/'+encodeURIComponent(res.code)+'">Abrir certificado</a>':'<button class="primary-button" id="retryExam">Intentar nuevamente</button>')+'</section>';
  }

  function practiceMarkup(course) {
    A.ui.practice=A.ui.practice||{};
    var p=A.ui.practice[course.id];
    if(!p) return '<section class="practice-card"><div><span class="eyebrow">Práctica segura</span><h3>Entrena antes del examen</h3><p>Recibe una pregunta del banco real sin revelar la respuesta correcta.</p></div><button id="loadPractice" class="secondary-button">Generar pregunta</button></section>';
    if(p.loading) return '<section class="practice-card"><p>Cargando pregunta práctica…</p></section>';
    if(p.error) return '<section class="practice-card"><p>'+A.escape(p.error)+'</p><button id="loadPractice" class="secondary-button">Reintentar</button></section>';
    if(!p.question) return '<section class="practice-card"><p>No hay preguntas disponibles para práctica.</p></section>';
    var q=p.question;
    return '<section class="practice-card"><span class="eyebrow">Pregunta práctica</span><h3>'+A.escape(q.prompt)+'</h3><div class="practice-options">'+(q.options||[]).map(function(op,i){return '<button class="practice-option '+(p.selected===i?(p.correct?'correct':'wrong'):'')+'" data-practice-option="'+i+'">'+A.escape(op)+'</button>';}).join('')+'</div>'+(p.checked?'<p class="practice-feedback '+(p.correct?'ok':'bad')+'">'+(p.correct?'¡Correcto! Puedes continuar.':'Respuesta registrada. Revisa el contenido; este reto de práctica nunca bloquea tu avance.')+'</p>':'')+(p.checked&&p.nextBlock?'<button id="continueAfterPractice" class="primary-button">Siguiente contenido →</button>':'<button id="loadPractice" class="text-button">Cambiar pregunta</button>')+'</section>';
  }

  function achievementMarkup(course, done, required, cert) {
    var pct=required.length?Math.round(required.filter(function(x){return done.indexOf(x.block.id)>=0;}).length/required.length*100):0;
    var achievements=[
      {name:'Primer paso',ok:done.length>=1,icon:'◆'},
      {name:'Mitad de ruta',ok:pct>=50,icon:'◐'},
      {name:'Ruta completada',ok:pct>=100,icon:'✓'},
      {name:'Certificación',ok:!!cert,icon:'★'}
    ];
    var phases=(course.phases||[]).map(function(p){
      var req=(p.blocks||[]).filter(function(b){return b.required;});
      var complete=req.filter(function(b){return done.indexOf(b.id)>=0;}).length;
      var phasePct=req.length?Math.round(complete/req.length*100):0;
      return '<div class="phase-progress-row"><div><strong>'+A.escape(p.title)+'</strong><small>'+complete+'/'+req.length+' obligatorios</small></div><div class="mini-progress"><span style="width:'+phasePct+'%"></span></div><b>'+phasePct+'%</b></div>';
    }).join('');
    return '<section class="course-achievements"><div class="course-achievement-card"><span class="eyebrow">Tus logros</span><div class="achievement-grid">'+achievements.map(function(a){return '<div class="'+(a.ok?'unlocked':'locked')+'"><span>'+a.icon+'</span><small>'+A.escape(a.name)+'</small></div>';}).join('')+'</div></div><div class="phase-progress-card"><span class="eyebrow">Progreso por fase</span>'+phases+'</div></section>';
  }

  A.courseView = function (id) {
    var c=A.course(id),uid=A.currentUid(); if(!c){location.hash='#/catalog';return;}
    var flat=A.flatten(c),done=A.progress(uid,id),required=flat.filter(function(x){return x.block.required;});
    var allDone=required.every(function(x){return done.indexOf(x.block.id)>=0;});
    var selected=A.ui.selectedBlock[id];
    if(!selected||!flat.some(function(x){return x.block.id===selected;})){var next=flat.find(function(x){return done.indexOf(x.block.id)<0;})||flat[0];selected=next&&next.block.id;A.ui.selectedBlock[id]=selected;}
    var current=flat.find(function(x){return x.block.id===selected;}),pct=A.percent(uid,c),currentIndex=flat.findIndex(function(x){return current&&x.block.id===current.block.id;});

    var rail=flat.map(function(x,i){var complete=done.indexOf(x.block.id)>=0;var locked=!A.canManage()&&flat.slice(0,i).filter(function(y){return y.block.required;}).some(function(y){return done.indexOf(y.block.id)<0;});return '<button class="course-rail-item '+(x.block.id===selected?'active':'')+' '+(complete?'done':'')+'" data-block="'+A.escape(x.block.id)+'" '+(locked?'disabled':'')+'><span class="rail-state">'+(complete?'✓':locked?'🔒':i+1)+'</span><div><strong>'+A.escape(x.block.title)+'</strong><small>'+A.escape(x.phase.title)+'</small></div></button>';}).join('');

    var stage=current?'<section class="course-stage-card"><div class="course-stage-heading"><div><span class="eyebrow">'+A.escape(current.phase.title)+'</span><h2>'+A.escape(current.block.title)+'</h2></div><span class="content-type-chip">'+A.escape(current.block.type||'reading')+'</span></div>'+blockBody(current)+'<div class="course-stage-actions">'+(currentIndex>0?'<button id="previousContent" class="secondary-button">← Contenido anterior</button>':'')+'<button id="completeBlock" class="'+(done.indexOf(current.block.id)>=0?'secondary-button':'primary-button')+'">'+(done.indexOf(current.block.id)>=0?'✓ Este paso ya cuenta en tu progreso':'Marcar como completado')+'</button>'+(done.indexOf(current.block.id)>=0&&flat[currentIndex+1]?'<button id="nextContent" class="secondary-button">Siguiente →</button>':'')+'</div></section>':'<section class="course-stage-card"><p>No hay contenido configurado.</p></section>';

    var exam=A.ui.examCourse===id?(A.ui.lastExam&&A.ui.lastExam.courseId===id?resultMarkup(A.ui.lastExam):examMarkup(c)):'<section class="course-exam-teaser"><div><span class="eyebrow">Evaluación final</span><h2>Certifica tu aprendizaje</h2><p>'+(allDone?'Ya completaste todos los contenidos obligatorios.':'Completa primero todos los contenidos obligatorios para desbloquear el examen.')+'</p></div><button id="launchExam" class="primary-button" '+(allDone?'':'disabled')+'>Presentar examen</button></section>';

    var html='<div class="learner-course-app"><section class="learner-course-hero">' + (c.cover_url ? '<img class="learner-hero-cover" src="' + A.escape(c.cover_url) + '" alt="">' : '') + '<div class="learner-hero-overlay"></div><div class="learner-hero-content"><div class="learner-hero-copy"><div class="hero-chip-row"><span class="hero-learning-chip">Capacitación institucional</span><span class="hero-learning-chip soft">'+required.length+' contenidos obligatorios</span><span class="hero-learning-chip soft">'+A.escape(c.category||'General')+' · '+Number(c.estimated_minutes||30)+' min</span></div><h1>'+A.escape(c.title)+'</h1><p>'+A.escape(c.description)+'</p><div class="learner-hero-actions"><a class="hero-primary-button" href="#/catalog">← Mis capacitaciones</a><span>Tu progreso se guarda automáticamente.</span></div></div><div class="hero-progress-orbit"><div class="hero-progress-ring" style="--progress:'+pct+'"><div><strong>'+pct+'%</strong><span>completado</span></div></div><small>'+done.length+' contenidos registrados</small></div></div></section>' +
      '<div class="course-workspace"><aside class="course-learning-rail"><div class="rail-head"><span class="eyebrow">Tu recorrido de aprendizaje</span><h3>Contenido de la capacitación</h3></div>'+rail+'</aside><main class="course-learning-stage">'+stage+achievementMarkup(c,done,required,A.cert(uid,id))+'<div class="course-after-stage">'+practiceMarkup(c)+exam+'</div></main></div></div>';

    document.getElementById('root').innerHTML=A.shell(html);A.bindShell();
    document.querySelectorAll('.course-rail-item').forEach(function(b){b.onclick=function(){A.ui.selectedBlock[id]=b.getAttribute('data-block');A.courseView(id);};});
    document.querySelectorAll('.demo-choice').forEach(function(b){b.onclick=function(){var el=document.getElementById('gameFeedback');el.textContent=b.getAttribute('data-ok')==='1'?'Correcto: primero verifica, decide y deja evidencia.':'Revisa la decisión antes de continuar.';};});
    document.querySelectorAll('.demo-valid').forEach(function(b){b.onclick=function(){document.getElementById('validationFeedback').textContent=b.getAttribute('data-ok')==='1'?'Validación registrada en la experiencia.':'Puedes volver al contenido antes de completar el bloque.';};});

    var complete=document.getElementById('completeBlock');
    if(complete&&current)complete.onclick=async function(){if(done.indexOf(current.block.id)>=0)return;complete.disabled=true;complete.textContent='Guardando…';try{await A.rpc('aula_complete_block',{p_course_id:id,p_block_id:current.block.id});if(done.indexOf(current.block.id)<0)done.push(current.block.id);A.toast('Progreso guardado.');var ix=flat.findIndex(function(x){return x.block.id===current.block.id;});if(flat[ix+1])A.ui.selectedBlock[id]=flat[ix+1].block.id;A.courseView(id);}catch(err){A.toast(A.errorText(err));complete.disabled=false;complete.textContent='Marcar como completado';}};

    var previousContent=document.getElementById('previousContent');if(previousContent)previousContent.onclick=function(){if(currentIndex>0){A.ui.selectedBlock[id]=flat[currentIndex-1].block.id;A.courseView(id);}};
    var nextContent=document.getElementById('nextContent');if(nextContent)nextContent.onclick=function(){if(flat[currentIndex+1]){A.ui.selectedBlock[id]=flat[currentIndex+1].block.id;A.courseView(id);}};
    var loadPractice=document.getElementById('loadPractice');
    if(loadPractice)loadPractice.onclick=async function(){A.ui.practice=A.ui.practice||{};A.ui.practice[id]={loading:true};A.courseView(id);try{var q=await A.rpc('aula_get_practice_question',{p_course_id:id,p_seed:String(Date.now())});A.ui.practice[id]={question:q,checked:false,selected:null,correct:false};}catch(err){A.ui.practice[id]={error:A.errorText(err)};}A.courseView(id);};
    document.querySelectorAll('[data-practice-option]').forEach(function(b){b.onclick=async function(){var p=A.ui.practice[id];if(!p||p.checked)return;var oi=Number(b.getAttribute('data-practice-option'));p.selected=oi;try{var r=await A.rpc('aula_check_practice_answer',{p_course_id:id,p_question_id:p.question.id,p_option_index:oi});p.correct=!!r.correct;p.checked=true;}catch(err){p.error=A.errorText(err);}A.courseView(id);};});

    var continueAfterPractice=document.getElementById('continueAfterPractice');if(continueAfterPractice)continueAfterPractice.onclick=function(){var p=A.ui.practice&&A.ui.practice[id];if(p&&p.nextBlock){A.ui.selectedBlock[id]=p.nextBlock;delete A.ui.practice[id];A.courseView(id);}};
    var launch=document.getElementById('launchExam');if(launch)launch.onclick=function(){A.ui.examCourse=id;A.ui.lastExam=null;A.courseView(id);};
    var form=document.getElementById('examForm');if(form)form.onsubmit=async function(e){e.preventDefault();var answers={};c.questions.forEach(function(q){var p=form.querySelector('input[name="'+q.id+'"]:checked');if(p)answers[q.id]=Number(p.value);});var btn=document.getElementById('submitExam');btn.disabled=true;btn.textContent='Calificando…';try{var res=await A.rpc('aula_submit_exam',{p_course_id:id,p_answers:answers});A.ui.lastExam={courseId:id,score:res.score,passed:res.passed,code:res.code||null};if(res.passed&&res.code&&!A.cert(uid,id))A.state.certificates.push({id:A.uid('cert'),code:res.code,user_id:uid,course_id:id,score:res.score,issued_at:new Date().toISOString()});A.courseView(id);}catch(err){A.toast(A.errorText(err));btn.disabled=false;btn.textContent='Enviar evaluación';}};
    var retry=document.getElementById('retryExam');if(retry)retry.onclick=function(){A.ui.lastExam=null;A.courseView(id);};
  };

  A.games = function () {
    var list=[['Memoria de conceptos','Une conceptos y definiciones.'],['Clasificación','Clasifica riesgos, señales o procesos.'],['Ordenar pasos','Organiza procedimientos y protocolos.'],['Búsqueda visual','Encuentra elementos dentro de una imagen.'],['Mini RPG','Recorre zonas y completa misiones.'],['Cartas de decisión','Resuelve casos y recibe retroalimentación.']];
    var html='<div class="learner-games-page"><section class="games-hero"><div><span class="eyebrow-light">Biblioteca didáctica</span><h1>Aprender también puede sentirse como jugar.</h1><p>Formatos interactivos reutilizables para complementar cualquier capacitación.</p></div><div class="games-hero-orb">6</div></section><div class="premium-game-grid">'+list.map(function(g,i){return '<article><div class="game-index">0'+(i+1)+'</div><h3>'+A.escape(g[0])+'</h3><p>'+A.escape(g[1])+'</p><span>Plantilla disponible</span></article>';}).join('')+'</div></div>';
    document.getElementById('root').innerHTML=A.shell(html);A.bindShell();
  };

  A.certificateView = function (code) {
    var cert=A.state.certificates.find(function(c){return c.code===code;});
    if(!cert){document.getElementById('root').innerHTML=A.shell('<div class="certificate-page"><div class="home-empty"><h2>Certificado no encontrado</h2><a class="primary-button" href="#/">Volver</a></div></div>');A.bindShell();return;}
    if(cert.user_id!==A.currentUid()&&!A.canManage()){location.hash='#/';return;}
    var u=A.user(cert.user_id),c=A.course(cert.course_id);
    var html='<div class="certificate-page"><div class="print-hide certificate-toolbar"><a class="secondary-button" href="#/">← Volver</a><button id="printCert" class="primary-button">Imprimir / guardar PDF</button></div><section class="premium-certificate"><div class="certificate-watermark">A</div><span class="certificate-kicker">AULA DE FORMACIÓN · SAN PEDRO</span><h1>Certificado</h1><p>Se certifica que</p><div class="certificate-recipient">'+A.escape(u?u.full_name:'Usuario')+'</div><p>completó y aprobó satisfactoriamente la capacitación</p><div class="certificate-course">'+A.escape(c?c.title:'Capacitación')+'</div><div class="certificate-meta"><span><b>Puntaje</b><br>'+cert.score+'%</span><span><b>Fecha</b><br>'+new Date(cert.issued_at).toLocaleDateString('es-CO')+'</span><span><b>Código</b><br>'+A.escape(cert.code)+'</span></div><div class="certificate-signature-line"><span>Formación Institucional</span><span>Validación digital</span></div></section></div>';
    document.getElementById('root').innerHTML=A.shell(html);A.bindShell();document.getElementById('printCert').onclick=function(){window.print();};
  };
})(window);
