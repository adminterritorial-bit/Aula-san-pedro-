(function (w) {
  var A = w.AulaDemo;

  function journey(item) {
    var c = item.course || item, a = item.assignment || {}, uid = A.currentUid(), pct = A.percent(uid, c), cert = A.cert(uid, c.id);
    var due = a.due_at ? new Date(a.due_at + 'T23:59:59') : null;
    var overdue = !!(due && due.getTime() < Date.now() && !cert);
    var state = cert ? 'certified' : pct >= 100 ? 'exam' : pct > 0 ? 'progress' : 'new';
    return { c:c, a:a, pct:pct, cert:cert, overdue:overdue, state:state };
  }

  function stateLabel(x) {
    if (x.cert) return '<span class="journey-chip certified">Certificada</span>';
    if (x.overdue) return '<span class="journey-chip overdue">Vencida</span>';
    if (x.state === 'exam') return '<span class="journey-chip exam">Lista para examen</span>';
    if (x.state === 'progress') return '<span class="journey-chip progress">En progreso</span>';
    return '<span class="journey-chip new">Sin iniciar</span>';
  }

  function courseCard(item, compact) {
    var x = journey(item), c = x.c;
    var letters = String(c.title || 'A').split(/\s+/).slice(0,2).map(function(v){return v[0]||'';}).join('').toUpperCase();
    return '<article class="' + (compact ? 'home-course-card' : 'catalog-course-card') + '">' +
      '<div class="course-visual-cover"><span>' + A.escape(letters) + '</span><div class="course-cover-glow"></div>' + stateLabel(x) + '</div>' +
      '<div class="home-course-body"><div class="course-meta-line"><span>' + A.escape(c.status === 'published' ? 'Capacitación institucional' : c.status) + '</span><b>' + x.pct + '%</b></div>' +
      '<h3>' + A.escape(c.title) + '</h3><p>' + A.escape(c.description || 'Ruta de formación institucional.') + '</p>' +
      '<div class="premium-progress-track"><span style="width:' + x.pct + '%"></span></div>' +
      '<div class="course-card-footer"><small>' + (x.a.due_at ? 'Vence ' + A.escape(x.a.due_at) : 'Sin vencimiento') + '</small>' +
      '<div class="course-card-actions"><a class="course-primary-link" href="#/course/' + encodeURIComponent(c.id) + '">' + (x.pct ? 'Continuar' : 'Comenzar') + ' →</a>' +
      (x.cert ? '<a class="course-cert-link" href="#/certificate/' + encodeURIComponent(x.cert.code) + '">Certificado</a>' : '') + '</div></div></div></article>';
  }

  function routeCard(tp) {
    if (!tp || !tp.position) {
      return '<section class="home-training-route-card route-pending"><div class="home-training-route-icon">◎</div><div class="home-training-route-content"><span class="eyebrow">Ruta formativa</span><h3>Tu cargo todavía no tiene una ruta asociada</h3><p>Cuando Gestión Aula defina tu cargo, competencias y rutas obligatorias aparecerán aquí automáticamente.</p></div></section>';
    }
    var comps = tp.competencies || [], paths = tp.paths || [];
    return '<section class="home-training-route-card"><div class="home-training-route-head"><div class="home-training-route-icon">◎</div><div><span class="eyebrow">Perfil de formación</span><h3>' + A.escape(tp.position.name) + '</h3><p>' + A.escape(tp.position.department || 'Administración Municipal') + '</p></div></div>' +
      '<div class="home-training-route-content"><div><strong>Competencias requeridas</strong><div class="home-training-chip-list">' +
      (comps.length ? comps.map(function(x){return '<span>' + A.escape(x.name) + ' · N' + x.required_level + '</span>';}).join('') : '<span>Sin competencias configuradas</span>') +
      '</div></div><div><strong>Rutas asignadas</strong><div class="home-training-path-list">' +
      (paths.length ? paths.map(function(x){return '<span>↗ ' + A.escape(x.name) + '</span>';}).join('') : '<span>Sin rutas configuradas</span>') +
      '</div></div></div></section>';
  }

  A.dashboard = function () {
    var uid=A.currentUid(), items=A.assigned(uid), certs=A.state.certificates.filter(function(c){return c.user_id===uid;});
    var avg=items.length ? Math.round(items.reduce(function(s,x){return s+A.percent(uid,x.course);},0)/items.length) : 0;
    var inProgress=items.filter(function(x){var j=journey(x);return j.state==='progress'||j.state==='exam';}).length;
    var firstName=String((A.profile&&A.profile.full_name)||'Usuario').trim().split(/\s+/)[0];
    var tp=A.trainingProfile;

    var html='<div class="learner-home-page">' +
      '<section class="home-original-hero"><div class="home-hero-motion"></div><div class="home-hero-copy"><span class="home-hero-pill">Aula institucional · acceso seguro</span>' +
      '<h1>Hola, ' + A.escape(firstName) + '.<br><span>Tu aprendizaje continúa aquí.</span></h1><p>Capacitaciones, rutas, evidencias, evaluaciones y certificados en una sola experiencia.</p>' +
      '<div class="home-hero-actions"><a class="home-yellow-button" href="#/catalog">Ver mis capacitaciones</a>' + (A.canManage()?'<a class="home-glass-button" href="#/studio">Abrir Gestión Aula</a>':'') + '</div></div>' +
      '<div class="home-hero-metric"><div class="hero-progress-ring" style="--progress:' + avg + '"><div><strong>' + avg + '%</strong><span>progreso promedio</span></div></div><small>' + inProgress + ' rutas en curso · ' + certs.length + ' certificados</small></div></section>' +
      '<section class="home-metric-grid"><article><span>Capacitaciones</span><strong>' + items.length + '</strong><small>asignadas a tu perfil</small></article><article><span>En progreso</span><strong>' + inProgress + '</strong><small>incluye listas para examen</small></article><article><span>Certificados</span><strong>' + certs.length + '</strong><small>evidencias emitidas</small></article><article><span>Juegos</span><strong>6</strong><small>formatos interactivos</small></article></section>' +
      routeCard(tp) +
      '<section class="home-section-heading"><div><span class="eyebrow">Continuar aprendizaje</span><h2>Tus capacitaciones</h2><p>Retoma exactamente donde quedaste.</p></div><a href="#/catalog">Ver todas →</a></section>' +
      (items.length?'<div class="home-course-grid">'+items.slice(0,3).map(function(x){return courseCard(x,true);}).join('')+'</div>':'<section class="home-empty"><h3>No tienes capacitaciones asignadas</h3><p>Las rutas obligatorias aparecerán cuando Gestión Aula las vincule a tu cargo.</p></section>') +
      '<section class="home-section-heading section-spacing-top"><div><span class="eyebrow">Evidencia</span><h2>Certificados recientes</h2><p>Resultados verificables de tu formación.</p></div></section>' +
      (certs.length?'<div class="home-certificate-list">'+certs.slice().sort(function(a,b){return new Date(b.issued_at)-new Date(a.issued_at);}).slice(0,4).map(function(c){var course=A.course(c.course_id);return '<a href="#/certificate/'+encodeURIComponent(c.code)+'"><span class="cert-medal">✓</span><div><strong>'+A.escape(course?course.title:'Capacitación')+'</strong><small>'+new Date(c.issued_at).toLocaleDateString('es-CO')+' · '+c.score+'%</small></div><b>Ver →</b></a>';}).join('')+'</div>':'<div class="home-empty compact"><p>Aún no tienes certificados emitidos.</p></div>') +
      '</div>';

    document.getElementById('root').innerHTML=A.shell(html); A.bindShell();
    if (!A.trainingProfile && !A.ui.trainingProfileLoading) {
      A.ui.trainingProfileLoading=true;
      A.loadTrainingProfile().finally(function(){A.ui.trainingProfileLoading=false;if(location.hash===''||location.hash==='#/'||location.hash==='#')A.dashboard();});
    }
  };

  A.catalog = function () {
    var items=A.assigned(A.currentUid()).map(journey);
    A.ui.catalogFilter=A.ui.catalogFilter||'all'; A.ui.catalogSearch=A.ui.catalogSearch||''; A.ui.catalogSort=A.ui.catalogSort||'recent';
    var q=A.ui.catalogSearch.toLowerCase();
    var filtered=items.filter(function(x){
      var ok=A.ui.catalogFilter==='all'||x.state===A.ui.catalogFilter||(A.ui.catalogFilter==='overdue'&&x.overdue);
      return ok && (!q || (x.c.title+' '+x.c.description).toLowerCase().indexOf(q)>=0);
    });
    if(A.ui.catalogSort==='progress') filtered.sort(function(a,b){return b.pct-a.pct;});
    if(A.ui.catalogSort==='title') filtered.sort(function(a,b){return a.c.title.localeCompare(b.c.title,'es');});
    if(A.ui.catalogSort==='due') filtered.sort(function(a,b){return String(a.a.due_at||'9999').localeCompare(String(b.a.due_at||'9999'));});

    var counts={all:items.length,new:0,progress:0,exam:0,certified:0,overdue:0};
    items.forEach(function(x){counts[x.state]=(counts[x.state]||0)+1;if(x.overdue)counts.overdue++;});
    var filters=[['all','Todas'],['new','Sin iniciar'],['progress','En progreso'],['exam','Listas para examen'],['certified','Certificadas'],['overdue','Vencidas']];

    var html='<div class="catalog-original-page"><section class="catalog-hero"><div><span class="eyebrow-light">Ruta personal</span><h1>Mis capacitaciones</h1><p>Busca, filtra y continúa tus rutas de aprendizaje según tu perfil y obligaciones.</p></div><div class="catalog-summary-orb"><strong>'+items.length+'</strong><span>rutas visibles</span></div></section>' +
      '<section class="catalog-toolbar"><div class="catalog-search"><span>⌕</span><input id="catalogSearch" placeholder="Buscar capacitación…" value="'+A.escape(A.ui.catalogSearch)+'"></div><select id="catalogSort"><option value="recent">Más recientes</option><option value="due">Fecha límite</option><option value="progress">Mayor progreso</option><option value="title">A–Z</option></select></section>' +
      '<div class="catalog-filters">'+filters.map(function(f){return '<button data-filter="'+f[0]+'" class="'+(A.ui.catalogFilter===f[0]?'active':'')+'">'+f[1]+' <span>'+counts[f[0]]+'</span></button>';}).join('')+'</div>' +
      (filtered.length?'<div class="catalog-course-grid">'+filtered.map(function(x){return courseCard(x,false);}).join('')+'</div>':'<section class="catalog-empty"><h3>No hay resultados</h3><p>Cambia los filtros o la búsqueda.</p></section>')+'</div>';

    document.getElementById('root').innerHTML=A.shell(html); A.bindShell();
    var search=document.getElementById('catalogSearch'); if(search) search.oninput=function(){A.ui.catalogSearch=search.value;A.catalog();};
    var sort=document.getElementById('catalogSort'); if(sort){sort.value=A.ui.catalogSort;sort.onchange=function(){A.ui.catalogSort=sort.value;A.catalog();};}
    document.querySelectorAll('[data-filter]').forEach(function(b){b.onclick=function(){A.ui.catalogFilter=b.getAttribute('data-filter');A.catalog();};});
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
    return '<section class="practice-card"><span class="eyebrow">Pregunta práctica</span><h3>'+A.escape(q.prompt)+'</h3><div class="practice-options">'+(q.options||[]).map(function(op,i){return '<button class="practice-option '+(p.selected===i?(p.correct?'correct':'wrong'):'')+'" data-practice-option="'+i+'">'+A.escape(op)+'</button>';}).join('')+'</div>'+(p.checked?'<p class="practice-feedback '+(p.correct?'ok':'bad')+'">'+(p.correct?'Correcto. Continúa con confianza.':'Respuesta no acertada. Revisa el contenido y vuelve a practicar.')+'</p>':'')+'<button id="loadPractice" class="text-button">Cambiar pregunta</button></section>';
  }

  A.courseView = function (id) {
    var c=A.course(id),uid=A.currentUid(); if(!c){location.hash='#/catalog';return;}
    var flat=A.flatten(c),done=A.progress(uid,id),required=flat.filter(function(x){return x.block.required;});
    var allDone=required.every(function(x){return done.indexOf(x.block.id)>=0;});
    var selected=A.ui.selectedBlock[id];
    if(!selected||!flat.some(function(x){return x.block.id===selected;})){var next=flat.find(function(x){return done.indexOf(x.block.id)<0;})||flat[0];selected=next&&next.block.id;A.ui.selectedBlock[id]=selected;}
    var current=flat.find(function(x){return x.block.id===selected;}),pct=A.percent(uid,c);

    var rail=flat.map(function(x,i){var complete=done.indexOf(x.block.id)>=0;var locked=!A.canManage()&&flat.slice(0,i).filter(function(y){return y.block.required;}).some(function(y){return done.indexOf(y.block.id)<0;});return '<button class="course-rail-item '+(x.block.id===selected?'active':'')+' '+(complete?'done':'')+'" data-block="'+A.escape(x.block.id)+'" '+(locked?'disabled':'')+'><span class="rail-state">'+(complete?'✓':locked?'🔒':i+1)+'</span><div><strong>'+A.escape(x.block.title)+'</strong><small>'+A.escape(x.phase.title)+'</small></div></button>';}).join('');

    var stage=current?'<section class="course-stage-card"><div class="course-stage-heading"><div><span class="eyebrow">'+A.escape(current.phase.title)+'</span><h2>'+A.escape(current.block.title)+'</h2></div><span class="content-type-chip">'+A.escape(current.block.type||'reading')+'</span></div>'+blockBody(current)+'<div class="course-stage-actions"><button id="completeBlock" class="'+(done.indexOf(current.block.id)>=0?'secondary-button':'primary-button')+'">'+(done.indexOf(current.block.id)>=0?'✓ Completado':'Marcar como completado')+'</button></div></section>':'<section class="course-stage-card"><p>No hay contenido configurado.</p></section>';

    var exam=A.ui.examCourse===id?(A.ui.lastExam&&A.ui.lastExam.courseId===id?resultMarkup(A.ui.lastExam):examMarkup(c)):'<section class="course-exam-teaser"><div><span class="eyebrow">Evaluación final</span><h2>Certifica tu aprendizaje</h2><p>'+(allDone?'Ya completaste todos los contenidos obligatorios.':'Completa primero todos los contenidos obligatorios para desbloquear el examen.')+'</p></div><button id="launchExam" class="primary-button" '+(allDone?'':'disabled')+'>Presentar examen</button></section>';

    var html='<div class="learner-course-app"><section class="learner-course-hero"><div class="learner-hero-overlay"></div><div class="learner-hero-content"><div class="learner-hero-copy"><div class="hero-chip-row"><span class="hero-learning-chip">Capacitación institucional</span><span class="hero-learning-chip soft">'+required.length+' contenidos obligatorios</span></div><h1>'+A.escape(c.title)+'</h1><p>'+A.escape(c.description)+'</p><div class="learner-hero-actions"><a class="hero-primary-button" href="#/catalog">← Mis capacitaciones</a><span>Tu progreso se guarda automáticamente.</span></div></div><div class="hero-progress-orbit"><div class="hero-progress-ring" style="--progress:'+pct+'"><div><strong>'+pct+'%</strong><span>completado</span></div></div><small>'+done.length+' contenidos registrados</small></div></div></section>' +
      '<div class="course-workspace"><aside class="course-learning-rail"><div class="rail-head"><span class="eyebrow">Ruta de aprendizaje</span><h3>Contenido</h3></div>'+rail+'</aside><main class="course-learning-stage">'+stage+'<div class="course-after-stage">'+practiceMarkup(c)+exam+'</div></main></div></div>';

    document.getElementById('root').innerHTML=A.shell(html);A.bindShell();
    document.querySelectorAll('.course-rail-item').forEach(function(b){b.onclick=function(){A.ui.selectedBlock[id]=b.getAttribute('data-block');A.courseView(id);};});
    document.querySelectorAll('.demo-choice').forEach(function(b){b.onclick=function(){var el=document.getElementById('gameFeedback');el.textContent=b.getAttribute('data-ok')==='1'?'Correcto: primero verifica, decide y deja evidencia.':'Revisa la decisión antes de continuar.';};});
    document.querySelectorAll('.demo-valid').forEach(function(b){b.onclick=function(){document.getElementById('validationFeedback').textContent=b.getAttribute('data-ok')==='1'?'Validación registrada en la experiencia.':'Puedes volver al contenido antes de completar el bloque.';};});

    var complete=document.getElementById('completeBlock');
    if(complete&&current)complete.onclick=async function(){if(done.indexOf(current.block.id)>=0)return;complete.disabled=true;complete.textContent='Guardando…';try{await A.rpc('aula_complete_block',{p_course_id:id,p_block_id:current.block.id});if(done.indexOf(current.block.id)<0)done.push(current.block.id);A.toast('Progreso guardado.');var ix=flat.findIndex(function(x){return x.block.id===current.block.id;});if(flat[ix+1])A.ui.selectedBlock[id]=flat[ix+1].block.id;A.courseView(id);}catch(err){A.toast(A.errorText(err));complete.disabled=false;complete.textContent='Marcar como completado';}};

    var loadPractice=document.getElementById('loadPractice');
    if(loadPractice)loadPractice.onclick=async function(){A.ui.practice=A.ui.practice||{};A.ui.practice[id]={loading:true};A.courseView(id);try{var q=await A.rpc('aula_get_practice_question',{p_course_id:id,p_seed:String(Date.now())});A.ui.practice[id]={question:q,checked:false,selected:null,correct:false};}catch(err){A.ui.practice[id]={error:A.errorText(err)};}A.courseView(id);};
    document.querySelectorAll('[data-practice-option]').forEach(function(b){b.onclick=async function(){var p=A.ui.practice[id];if(!p||p.checked)return;var oi=Number(b.getAttribute('data-practice-option'));p.selected=oi;try{var r=await A.rpc('aula_check_practice_answer',{p_course_id:id,p_question_id:p.question.id,p_option_index:oi});p.correct=!!r.correct;p.checked=true;}catch(err){p.error=A.errorText(err);}A.courseView(id);};});

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
