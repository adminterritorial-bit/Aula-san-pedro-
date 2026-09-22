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

  function contentTypeLabel(type) {
    return {reading:'Lectura',text:'Lectura',video:'Video',presentation:'Presentación',pdf:'Documento PDF',image:'Imagen / infografía',audio:'Audio',link:'Recurso externo',game:'Actividad interactiva',validation:'Validación'}[type] || 'Contenido';
  }

  function contentTypeIcon(type) {
    return {video:'play',presentation:'layers',pdf:'filecheck',image:'search',audio:'play',link:'arrow',game:'game',validation:'shield',reading:'book',text:'book'}[type] || 'book';
  }

  function blockBody(entry) {
    var b=entry.block,type=b.type||'reading',body=b.body||b.text||'',url=b.url||'';
    var inner='';
    if(type==='video'){
      inner='<div class="media-experience">' + (url?'<video controls preload="metadata" src="'+A.escape(url)+'"></video>':'<div class="asset-unavailable">'+A.icon('play',24)+'<strong>Video pendiente</strong><span>'+A.escape(body||'Agrega una URL de video desde Gestión Aula.')+'</span></div>') + '</div>';
    } else if(type==='presentation'||type==='pdf'){
      inner='<div class="presentation-experience">' + (url?'<iframe title="'+A.escape(b.title)+'" src="'+A.escape(url)+'"></iframe>':'<div class="asset-unavailable">'+A.icon('layers',24)+'<strong>'+A.escape(type==='pdf'?'Documento PDF':'Presentación')+'</strong><span>'+A.escape(body||'Recurso pendiente de URL.')+'</span></div>') + '</div>';
    } else if(type==='image'){
      inner=url?'<div class="image-learning-experience"><div class="image-learning-canvas"><img src="'+A.escape(url)+'" alt="'+A.escape(b.title)+'"></div></div>':'<div class="asset-unavailable">'+A.icon('search',24)+'<strong>Imagen pendiente</strong></div>';
    } else if(type==='audio'){
      inner='<div class="audio-experience"><span>'+A.icon('play',28)+'</span><div><strong>'+A.escape(b.title)+'</strong><small>Escucha el recurso a tu ritmo.</small>'+(url?'<audio controls src="'+A.escape(url)+'"></audio>':'<p>'+A.escape(body)+'</p>')+'</div></div>';
    } else if(type==='link'){
      inner='<div class="link-card"><div>'+A.icon('arrow',24)+'<div><strong>Recurso externo</strong><p>'+A.escape(body||'Este contenido se abrirá en una pestaña nueva.')+'</p></div></div>'+(url?'<a href="'+A.escape(url)+'" target="_blank" rel="noopener">Abrir recurso '+A.icon('arrow',16)+'</a>':'')+'</div>';
    } else if(type==='game'){
      inner='<div class="activity-experience"><div class="validation-question-heading">'+A.icon('game',24)+'<div><span>Actividad interactiva</span><h3>Toma una decisión</h3></div></div><p>'+A.escape(body)+'</p><div class="validation-answer-grid"><button type="button" class="demo-choice" data-ok="0"><span>A</span><strong>Actuar sin verificar</strong></button><button type="button" class="demo-choice" data-ok="1"><span>B</span><strong>Verificar, decidir y dejar evidencia</strong></button></div><p id="gameFeedback" class="content-feedback"></p></div>';
    } else if(type==='validation'){
      inner='<div class="validation-experience"><div class="validation-question-heading">'+A.icon('shield',24)+'<div><span>Validación rápida</span><h3>Comprueba tu comprensión</h3></div></div><p>'+A.escape(body)+'</p><div class="validation-answer-grid"><button type="button" class="demo-valid" data-ok="1"><span>A</span><strong>Comprendido</strong></button><button type="button" class="demo-valid" data-ok="0"><span>B</span><strong>Quiero revisarlo de nuevo</strong></button></div><p id="validationFeedback" class="content-feedback"></p></div>';
    } else {
      inner='<div class="reading-experience">' + (body?body.split(/\n{2,}/).map(function(p){return '<p>'+A.escape(p)+'</p>';}).join(''):'<p>Este contenido aún no tiene texto.</p>') + '</div>';
    }

    return '<article class="content-experience"><header class="content-experience-header"><div class="content-type-mark">'+A.icon(contentTypeIcon(type),22)+'</div><div class="content-title-copy"><span>'+A.escape(contentTypeLabel(type))+' · '+(b.required?'Obligatorio':'Opcional')+'</span><h2>'+A.escape(b.title)+'</h2>'+(body&&type!=='reading'&&type!=='text'?'<p>'+A.escape(body)+'</p>':'')+'</div></header><div class="content-experience-body">'+inner+'</div></article>';
  }

  function examMarkup(course) {
    var questions=course.questions||[];
    if(!questions.length) return '<section class="exam-experience"><div class="asset-unavailable">'+A.icon('graduation',28)+'<strong>Evaluación no configurada</strong></div></section>';
    return '<section class="exam-experience"><header class="exam-experience-hero"><span>'+A.icon('graduation',28)+'</span><div><small>Evaluación certificable</small><h2>Examen final</h2><p>Responde todas las preguntas. Necesitas mínimo <strong>'+Number(course.passing_score||80)+'%</strong> para aprobar.</p></div><div class="exam-answer-progress"><strong id="examAnsweredCount">0/'+questions.length+'</strong><span>respondidas</span></div></header><form id="examForm"><div class="exam-question-stack">'+questions.map(function(q,i){return '<article class="exam-learning-question" data-exam-question="'+A.escape(q.id)+'"><div class="exam-question-number">'+(i+1)+'</div><div class="exam-question-content"><h3>'+A.escape(q.prompt)+'</h3><div class="exam-learning-options">'+(q.options||[]).map(function(op,oi){return '<label><input type="radio" name="'+A.escape(q.id)+'" value="'+oi+'" required><span>'+String.fromCharCode(65+oi)+'</span><strong>'+A.escape(op)+'</strong></label>';}).join('')+'</div></div></article>';}).join('')+'</div><footer class="exam-submit-bar"><div>'+A.icon('shield',17)+'<span>Revisa tus respuestas antes de enviar el examen.</span></div><button class="primary-button" id="submitExam">Enviar evaluación</button></footer></form></section>';
  }

  function resultMarkup(res) {
    return '<section class="exam-result '+(res.passed?'passed':'failed')+'"><div class="result-celebration-icon">'+(res.passed?A.icon('trophy',34):A.icon('shield',34))+'</div><span class="result-eyebrow">'+(res.passed?'Resultado aprobado':'Resultado')+'</span><h2>'+(res.passed?'Capacitación aprobada':'Aún no alcanzas la nota mínima')+'</h2><div class="result-score">'+res.score+'%</div><p>'+(res.passed?'La certificación quedó registrada en tu historial.':'Puedes revisar el contenido y volver a intentarlo cuando estés listo.')+'</p><div class="result-actions">'+(res.passed&&res.code?'<a class="result-primary" href="#/certificate/'+encodeURIComponent(res.code)+'">'+A.icon('badge',17)+' Abrir certificado</a>':'<button class="result-primary" id="retryExam">'+A.icon('refresh',17)+' Volver a intentar</button>')+'<a class="result-secondary" href="#/catalog">Mis capacitaciones</a></div></section>';
  }

  function achievementSideMarkup(course,done,required,cert) {
    var pct=required.length?Math.round(required.filter(function(x){return done.indexOf(x.block.id)>=0;}).length/required.length*100):0;
    var achievements=[
      {name:'Primer paso',ok:done.length>=1,icon:'sparkle',desc:'Completaste tu primer contenido.'},
      {name:'Mitad de ruta',ok:pct>=50,icon:'target',desc:'Ya recorriste la mitad.'},
      {name:'Ruta completada',ok:pct>=100,icon:'badge',desc:'Terminaste el contenido obligatorio.'},
      {name:'Certificación',ok:!!cert,icon:'trophy',desc:'Obtuviste el certificado.'}
    ];
    return '<section class="learner-side-card"><div class="side-card-title">'+A.icon('trophy',18)+'<div><strong>Tus logros</strong><small>'+achievements.filter(function(x){return x.ok;}).length+' de '+achievements.length+' desbloqueados</small></div></div><div class="achievement-mini-grid">'+achievements.map(function(a){return '<article class="'+(a.ok?'unlocked':'locked')+'"><span>'+A.icon(a.ok?a.icon:'shield',16)+'</span><div><strong>'+A.escape(a.name)+'</strong><small>'+(a.ok?A.escape(a.desc):'Sigue avanzando para desbloquearlo.')+'</small></div></article>';}).join('')+'</div></section>';
  }

  function phaseProgressSideMarkup(course,done) {
    return '<section class="learner-side-card phase-progress-card"><div class="side-card-title">'+A.icon('shield',18)+'<div><strong>Progreso por fase</strong><small>Tu recorrido de aprendizaje</small></div></div><div class="phase-mini-progress">'+(course.phases||[]).map(function(p,i){var req=(p.blocks||[]).filter(function(b){return b.required;});var completed=req.filter(function(b){return done.indexOf(b.id)>=0;}).length;var pct=req.length?Math.round(completed/req.length*100):0;return '<button type="button" data-phase-first="'+A.escape(((p.blocks||[])[0]||{}).id||'')+'"><span class="'+(pct===100?'done':'')+'">'+(pct===100?'✓':i+1)+'</span><div><strong>'+A.escape(p.title)+'</strong><div><i style="width:'+pct+'%"></i></div><small>'+pct+'%</small></div></button>';}).join('')+'</div></section>';
  }

  function practiceGateMarkup(course,id) {
    var p=A.ui.practice&&A.ui.practice[id];
    if(!p||(!p.nextBlock&&!p.loading)) return '';
    var body='';
    if(p.loading){
      body='<div class="practice-gate-loading"><span class="spin">'+A.icon('refresh',28)+'</span><strong>Preparando una pregunta aleatoria…</strong><span>Estamos tomando una pregunta del banco de esta capacitación.</span></div>';
    } else if(p.error||!p.question){
      body='<div class="practice-gate-error">'+A.icon('shield',28)+'<strong>No pudimos cargar la pregunta rápida.</strong><span>'+A.escape(p.error||'Inténtalo otra vez para continuar.')+'</span><div class="practice-gate-error-actions"><button id="retryPractice">'+A.icon('refresh',16)+' Cargar otra pregunta</button><button id="skipPractice" class="practice-gate-skip">Continuar por ahora '+A.icon('arrow',16)+'</button></div></div>';
    } else {
      var q=p.question;
      body='<div class="practice-gate-question"><span class="practice-gate-kicker">'+A.icon('sparkle',14)+' Reto de transición</span><h3>'+A.escape(q.prompt)+'</h3><div class="practice-gate-options">'+(q.options||[]).map(function(op,i){var selected=p.selected===i;var cls=selected?(p.checked?(p.correct?'selected correct':'selected incorrect'):'selected'):'';return '<button type="button" class="'+cls+'" data-practice-option="'+i+'" '+(p.checked?'disabled':'')+'><span>'+String.fromCharCode(65+i)+'</span><strong>'+A.escape(op)+'</strong>'+(selected&&p.checked?(p.correct?'✓':'×'):'')+'</button>';}).join('')+'</div>'+(p.checked?'<div class="practice-answer-feedback '+(p.correct?'correct':'incorrect')+'">'+(p.correct?A.icon('badge',17):A.icon('shield',17))+'<div><strong>'+(p.correct?'¡Correcto!':'Respuesta registrada')+'</strong><span>'+(p.correct?'Puedes continuar con el siguiente contenido.':'No revelaremos la respuesta correcta. Puedes continuar y reforzarla durante la ruta.')+'</span></div></div>':'')+'</div><footer class="practice-gate-footer"><div>'+A.icon('shield',16)+'<span>Este reto es de práctica. No suma ni resta puntos del examen final.</span></div><button id="continueAfterPractice" class="practice-gate-continue" '+(!p.checked?'disabled':'')+'>'+A.icon('arrow',17)+' Continuar</button></footer><div class="practice-gate-target">Siguiente: <strong>'+A.escape((A.flatten(course).find(function(x){return x.block.id===p.nextBlock;})||{block:{title:'Examen final'}}).block.title)+'</strong></div>';
    }
    return '<div class="practice-gate-backdrop"><section class="practice-gate-modal" role="dialog" aria-modal="true"><div class="practice-gate-accent"></div><header class="practice-gate-header"><div class="practice-gate-icon">'+A.icon('brain',26)+'</div><div><span>Antes de continuar</span><h2>Pregunta rápida</h2><p>Elige una opción. Te diremos si acertaste, pero nunca mostraremos cuál era la respuesta correcta.</p></div></header>'+body+'</section></div>';
  }

  A.courseView = function (id) {
    var course=A.course(id),uid=A.currentUid(); if(!course){location.hash='#/catalog';return;}
    var flat=A.flatten(course),done=A.progress(uid,id),required=flat.filter(function(x){return x.block.required;});
    var examUnlocked=required.every(function(x){return done.indexOf(x.block.id)>=0;});
    var selected=A.ui.selectedBlock[id];
    if(!selected||!flat.some(function(x){return x.block.id===selected;})){
      var next=flat.find(function(x){return done.indexOf(x.block.id)<0;})||flat[0];
      selected=next&&next.block.id;A.ui.selectedBlock[id]=selected;
    }
    var current=flat.find(function(x){return x.block.id===selected;}),currentIndex=flat.findIndex(function(x){return current&&x.block.id===current.block.id;}),pct=A.percent(uid,course);
    var cert=A.cert(uid,id);

    var outline=(course.phases||[]).map(function(phase,phaseIndex){
      var blocks=(phase.blocks||[]);
      var req=blocks.filter(function(b){return b.required;}),phaseDone=req.filter(function(b){return done.indexOf(b.id)>=0;}).length,phasePct=req.length?Math.round(phaseDone/req.length*100):0;
      return '<section class="outline-phase-card"><div class="outline-phase-heading"><span class="'+(phasePct===100?'complete':'')+'">'+(phasePct===100?'✓':phaseIndex+1)+'</span><div><strong>'+A.escape(phase.title)+'</strong><small>'+phaseDone+'/'+req.length+' obligatorios · '+phasePct+'%</small></div></div><div class="outline-block-list">'+blocks.map(function(block){var i=flat.findIndex(function(x){return x.block.id===block.id;}),locked=!A.canManage()&&flat.slice(0,i).filter(function(x){return x.block.required;}).some(function(x){return done.indexOf(x.block.id)<0;}),complete=done.indexOf(block.id)>=0;return '<button type="button" data-block="'+A.escape(block.id)+'" class="'+(block.id===selected?'active ':'')+(complete?'done ':'')+'" '+(locked?'disabled':'')+'><span>'+(complete?'✓':locked?'🔒':A.icon(contentTypeIcon(block.type),15))+'</span><div><strong>'+A.escape(block.title)+'</strong><small>'+A.escape(contentTypeLabel(block.type))+' · '+(block.required?'Obligatorio':'Opcional')+'</small></div></button>';}).join('')+'</div></section>';
    }).join('');

    var stageContent=A.ui.examCourse===id
      ? (A.ui.lastExam&&A.ui.lastExam.courseId===id?resultMarkup(A.ui.lastExam):examMarkup(course))
      : (current?blockBody(current):'<div class="learner-empty-stage">'+A.icon('book',38)+'<h2>Esta capacitación aún no tiene contenido visible.</h2><p>Cuando el equipo publique contenidos aparecerán aquí.</p></div>');

    var stageNav='';
    if(A.ui.examCourse!==id&&current){
      stageNav='<div class="learner-stage-nav"><button class="stage-nav-button previous" id="previousContent" '+(currentIndex<=0?'disabled':'')+'>'+A.icon('arrow',18).replace('M5 12h14','M19 12H5').replace('m13 6 6 6-6 6','m11 6-6 6 6 6')+'<span><small>Anterior</small><strong>'+A.escape((flat[currentIndex-1]||{block:{title:'Inicio'}}).block.title)+'</strong></span></button><div class="stage-nav-center">'+(done.indexOf(current.block.id)>=0?'<span class="stage-completed-indicator">✓ Este paso ya cuenta en tu progreso</span>':'<span class="stage-pending-indicator">'+A.icon('brain',14)+' Siguiente abrirá una pregunta rápida</span>')+'</div><button class="stage-nav-button next" id="nextContent"><span><small>'+(currentIndex>=flat.length-1?'Finalizar contenido':'Siguiente')+'</small><strong>'+A.escape((flat[currentIndex+1]||{block:{title:'Examen final'}}).block.title)+'</strong></span>'+A.icon('arrow',18)+'</button></div>';
    }

    var examCallout=(A.ui.examCourse!==id&&examUnlocked&&currentIndex===flat.length-1)
      ? '<button class="exam-callout" id="launchExam"><span>'+A.icon('graduation',24)+'</span><div><strong>¡Ruta de contenidos completada!</strong><small>Ya puedes presentar el examen final. Debes obtener mínimo '+Number(course.passing_score||80)+'%.</small></div>'+A.icon('arrow',20)+'</button>'
      : '';

    var html='<main class="learner-course-app">' +
      '<section class="learner-course-hero">' +
        (course.cover_url?'<img class="learner-hero-cover" src="'+A.escape(course.cover_url)+'" alt="">':'') +
        '<div class="hero-motion-field" aria-hidden="true">'+Array.from({length:9}).map(function(_,i){return '<i style="--i:'+i+'"></i>';}).join('')+'<span class="hero-motion-orbit orbit-a"></span><span class="hero-motion-orbit orbit-b"></span><span class="hero-motion-spark spark-a"></span><span class="hero-motion-spark spark-b"></span></div>' +
        '<div class="learner-hero-content"><div class="learner-hero-copy"><div class="hero-chip-row"><span class="hero-learning-chip">'+A.icon('book',14)+' Capacitación institucional</span><span class="hero-learning-chip soft">'+A.escape(course.category||'General')+' · '+Number(course.estimated_minutes||30)+' min</span></div><h1>'+A.escape(course.title)+'</h1><p>'+A.escape(course.description||'Continúa tu ruta de aprendizaje y completa cada actividad a tu ritmo.')+'</p><div class="hero-progress-inline"><div><span style="width:'+pct+'%"></span></div><strong>'+pct+'% completado</strong><small>'+required.filter(function(x){return done.indexOf(x.block.id)>=0;}).length+' de '+required.length+' contenidos obligatorios</small></div><div class="learner-hero-actions"><button id="heroContinue" class="hero-primary-button">'+A.icon('play',18)+' '+(pct?'Continuar donde quedé':'Comenzar capacitación')+'</button><span>'+(examUnlocked?'Examen final desbloqueado':'Tu progreso se guarda automáticamente al avanzar')+'</span></div></div></div>' +
      '</section>' +

      '<div class="learner-course-layout">' +
        '<aside class="learner-outline"><div class="outline-header"><div><span>Tu ruta</span><strong>Contenido de la capacitación</strong></div></div><div class="outline-scroll">'+outline+'<button class="outline-exam-card '+(examUnlocked?'unlocked':'')+'" id="outlineExam" '+(!examUnlocked?'disabled':'')+'><span>'+(examUnlocked?A.icon('graduation',20):'🔒')+'</span><div><strong>Examen final</strong><small>'+(examUnlocked?'Desbloqueado · aprobar con '+Number(course.passing_score||80)+'%':'Completa los contenidos obligatorios')+'</small></div>'+(examUnlocked?A.icon('arrow',17):'')+'</button></div></aside>' +

        '<section class="learner-stage-column"><div class="stage-context-bar"><div><span>'+(A.ui.examCourse===id?'Evaluación final':A.escape(current?current.phase.title:'Capacitación'))+'</span>'+(current&&A.ui.examCourse!==id?'<strong>'+(currentIndex+1)+' de '+flat.length+'</strong>':'')+'</div>'+(current&&A.ui.examCourse!==id?'<div class="stage-context-progress"><span style="width:'+(flat.length?((currentIndex+1)/flat.length)*100:0)+'%"></span></div>':'')+'</div><div class="learner-stage-card">'+stageContent+'</div>'+stageNav+examCallout+'</section>' +

        '<aside class="learner-progress-panel">'+achievementSideMarkup(course,done,required,cert)+phaseProgressSideMarkup(course,done)+'<section class="learner-side-card motivation-card">'+A.icon('sparkle',20)+'<div><strong>'+(pct>=100?'Excelente trabajo.':pct>=50?'Vas muy bien.':pct>0?'Buen comienzo.':'Tu ruta comienza aquí.')+'</strong><span>'+(pct>=100?'Ya completaste el contenido obligatorio. Presenta el examen cuando estés listo.':pct>=50?'Ya recorriste más de la mitad de la capacitación.':pct>0?'Cada contenido completado te acerca a la certificación.':'Avanza paso a paso. Aula San Pedro guardará tu progreso.')+'</span></div></section></aside>' +
      '</div>' +
      practiceGateMarkup(course,id) +
    '</main>';

    document.getElementById('root').innerHTML=A.shell(html);A.bindShell();

    document.querySelectorAll('.outline-block-list [data-block]').forEach(function(b){b.onclick=function(){A.ui.examCourse=null;A.ui.selectedBlock[id]=b.getAttribute('data-block');A.courseView(id);};});
    document.querySelectorAll('[data-phase-first]').forEach(function(b){b.onclick=function(){var bid=b.getAttribute('data-phase-first');if(bid){A.ui.selectedBlock[id]=bid;A.courseView(id);}};});
    var heroContinue=document.getElementById('heroContinue');if(heroContinue)heroContinue.onclick=function(){var el=document.querySelector('.learner-stage-column');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});};

    document.querySelectorAll('.demo-choice').forEach(function(b){b.onclick=function(){var el=document.getElementById('gameFeedback');el.textContent=b.getAttribute('data-ok')==='1'?'Correcto: primero verifica, decide y deja evidencia.':'Revisa la decisión antes de continuar.';};});
    document.querySelectorAll('.demo-valid').forEach(function(b){b.onclick=function(){var el=document.getElementById('validationFeedback');el.textContent=b.getAttribute('data-ok')==='1'?'Validación registrada.':'Puedes volver al contenido antes de avanzar.';};});

    async function markAndAdvance(nextBlock){
      if(!current)return;
      if(done.indexOf(current.block.id)<0){
        await A.rpc('aula_complete_block',{p_course_id:id,p_block_id:current.block.id});
        done.push(current.block.id);
      }
      if(nextBlock&&(course.questions||[]).length){
        A.ui.practice=A.ui.practice||{};
        A.ui.practice[id]={loading:true,nextBlock:nextBlock};
        A.courseView(id);
        try{
          var q=await A.rpc('aula_get_practice_question',{p_course_id:id,p_seed:String(Date.now())});
          A.ui.practice[id]={question:q,checked:false,selected:null,correct:false,nextBlock:nextBlock};
        }catch(err){A.ui.practice[id]={error:A.errorText(err),nextBlock:nextBlock};}
        A.courseView(id);
      } else if(nextBlock){A.ui.selectedBlock[id]=nextBlock;A.courseView(id);}
      else {A.courseView(id);}
    }

    var previous=document.getElementById('previousContent');if(previous)previous.onclick=function(){if(currentIndex>0){A.ui.examCourse=null;A.ui.selectedBlock[id]=flat[currentIndex-1].block.id;A.courseView(id);}};
    var nextBtn=document.getElementById('nextContent');if(nextBtn)nextBtn.onclick=async function(){nextBtn.disabled=true;try{await markAndAdvance(flat[currentIndex+1]?flat[currentIndex+1].block.id:null);}catch(err){A.toast(A.errorText(err));nextBtn.disabled=false;}};

    document.querySelectorAll('[data-practice-option]').forEach(function(b){b.onclick=async function(){var p=A.ui.practice[id];if(!p||p.checked)return;var oi=Number(b.getAttribute('data-practice-option'));p.selected=oi;try{var r=await A.rpc('aula_check_practice_answer',{p_course_id:id,p_question_id:p.question.id,p_option_index:oi});p.correct=!!r.correct;p.checked=true;}catch(err){p.error=A.errorText(err);}A.courseView(id);};});
    var continuePractice=document.getElementById('continueAfterPractice');if(continuePractice)continuePractice.onclick=function(){var p=A.ui.practice[id];if(p&&p.nextBlock){A.ui.selectedBlock[id]=p.nextBlock;delete A.ui.practice[id];A.courseView(id);}};
    var retryPractice=document.getElementById('retryPractice');if(retryPractice)retryPractice.onclick=async function(){var p=A.ui.practice[id];A.ui.practice[id]={loading:true,nextBlock:p.nextBlock};A.courseView(id);try{var q=await A.rpc('aula_get_practice_question',{p_course_id:id,p_seed:String(Date.now())});A.ui.practice[id]={question:q,checked:false,selected:null,correct:false,nextBlock:p.nextBlock};}catch(err){A.ui.practice[id]={error:A.errorText(err),nextBlock:p.nextBlock};}A.courseView(id);};
    var skipPractice=document.getElementById('skipPractice');if(skipPractice)skipPractice.onclick=function(){var p=A.ui.practice[id];if(p&&p.nextBlock){A.ui.selectedBlock[id]=p.nextBlock;delete A.ui.practice[id];A.courseView(id);}};

    function openExam(){if(!examUnlocked)return;A.ui.examCourse=id;A.ui.lastExam=null;A.courseView(id);}
    var launch=document.getElementById('launchExam');if(launch)launch.onclick=openExam;
    var outlineExam=document.getElementById('outlineExam');if(outlineExam)outlineExam.onclick=openExam;

    var form=document.getElementById('examForm');if(form){
      form.onchange=function(){var count=(course.questions||[]).filter(function(q){return !!form.querySelector('input[name="'+q.id+'"]:checked');}).length;var el=document.getElementById('examAnsweredCount');if(el)el.textContent=count+'/'+(course.questions||[]).length;document.querySelectorAll('.exam-learning-question').forEach(function(row){var idq=row.getAttribute('data-exam-question');row.classList.toggle('answered',!!form.querySelector('input[name="'+idq+'"]:checked'));});};
      form.onsubmit=async function(e){e.preventDefault();var answers={};course.questions.forEach(function(q){var p=form.querySelector('input[name="'+q.id+'"]:checked');if(p)answers[q.id]=Number(p.value);});var btn=document.getElementById('submitExam');btn.disabled=true;btn.textContent='Calificando…';try{var res=await A.rpc('aula_submit_exam',{p_course_id:id,p_answers:answers});A.ui.lastExam={courseId:id,score:res.score,passed:res.passed,code:res.code||null};if(res.passed&&res.code&&!A.cert(uid,id))A.state.certificates.push({id:A.uid('cert'),code:res.code,user_id:uid,course_id:id,score:res.score,issued_at:new Date().toISOString()});A.courseView(id);}catch(err){A.toast(A.errorText(err));btn.disabled=false;btn.textContent='Enviar evaluación';}};
    }
    var retry=document.getElementById('retryExam');if(retry)retry.onclick=function(){A.ui.lastExam=null;A.courseView(id);};
  };

  A.games = function () {
    var list=[
      {key:'memory',name:'Memoria de conceptos',icon:'brain',description:'Une conceptos, definiciones, principios o responsabilidades de una capacitación.',tag:'Memoria',accent:'violet'},
      {key:'classify',name:'Clasificación',icon:'shapes',description:'Clasifica riesgos, señales, documentos, procesos o decisiones en categorías.',tag:'Clasificación',accent:'cyan'},
      {key:'order',name:'Ordenar pasos',icon:'ordered',description:'Organiza procedimientos y protocolos en la secuencia correcta.',tag:'Secuencia',accent:'amber'},
      {key:'visual',name:'Búsqueda visual',icon:'search',description:'Encuentra riesgos, elementos o puntos de control dentro de una imagen.',tag:'Observación',accent:'blue'},
      {key:'rpg',name:'Mini RPG',icon:'game',description:'Recorre zonas, completa misiones y toma decisiones dentro de un escenario.',tag:'Simulación',accent:'indigo'},
      {key:'cards',name:'Cartas de decisión',icon:'layers',description:'Resuelve casos prácticos, compara alternativas y recibe retroalimentación.',tag:'Decisiones',accent:'green'}
    ];
    var selected=A.ui.gamePreview?list.find(function(x){return x.key===A.ui.gamePreview;}):null;

    var html='<main class="learner-games-page">' +
      '<section class="games-original-hero"><div><span>' + A.icon('sparkle',15) + ' Biblioteca didáctica</span><h1>Juegos San Pedro</h1><p>Plantillas interactivas para convertir contenidos institucionales en experiencias más dinámicas sin salir del Aula.</p></div><div class="games-hero-metric"><strong>' + list.length + '</strong><span>Plantillas disponibles</span></div></section>' +
      '<section class="games-section-heading"><span>BIBLIOTECA INTERACTIVA</span><h2>Explora las dinámicas disponibles</h2><p>Selecciona una experiencia para revisar cómo puede utilizarse dentro de una capacitación.</p></section>' +
      '<div class="games-grid">' + list.map(function(g,i){return '<article tabindex="0" role="button" data-game-preview="' + g.key + '" class="game-card-accent-' + g.accent + '" style="--game-delay:' + (i*55) + 'ms"><div>' + A.icon(g.icon,28) + '</div><small class="game-card-kicker">' + A.escape(g.tag) + '</small><h3>' + A.escape(g.name) + '</h3><p>' + A.escape(g.description) + '</p><span>Plantilla disponible</span></article>';}).join('') + '</div>' +
      (selected?'<section class="game-preview-drawer"><button type="button" id="closeGamePreview" class="game-preview-close">×</button><div class="game-preview-icon game-card-accent-' + selected.accent + '">' + A.icon(selected.icon,34) + '</div><div class="game-preview-copy"><span>PREVISUALIZACIÓN DIDÁCTICA</span><h2>' + A.escape(selected.name) + '</h2><p>' + A.escape(selected.description) + '</p><div class="game-preview-points"><span>✓ Reutilizable por capacitación</span><span>✓ Retroalimentación inmediata</span><span>✓ Compatible con rutas obligatorias</span><span>✓ Evidencia de interacción preparada</span></div></div><div class="game-preview-actions"><a href="#/catalog" class="secondary-button">Volver a cursos</a>' + (A.canManage()?'<a href="#/studio" class="primary-button">Configurar en Gestión Aula</a>':'') + '</div></section>':'') +
    '</main>';

    document.getElementById('root').innerHTML=A.shell(html);A.bindShell();
    document.querySelectorAll('[data-game-preview]').forEach(function(card){
      function open(){A.ui.gamePreview=card.getAttribute('data-game-preview');A.games();}
      card.onclick=open;
      card.onkeydown=function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();open();}};
    });
    var close=document.getElementById('closeGamePreview');if(close)close.onclick=function(){A.ui.gamePreview=null;A.games();};
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
