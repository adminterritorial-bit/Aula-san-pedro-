(function (w) {
  var A = w.AulaDemo;

  function tabs() {
    var items = '<button data-tab="courses" class="' + (A.ui.tab === 'courses' ? 'active' : '') + '">' + A.icon('book',17) + '<span>Capacitaciones</span></button>';
    if (A.canManageUsers()) {
      items += '<button data-tab="assignments" class="' + (A.ui.tab === 'assignments' ? 'active' : '') + '">' + A.icon('target',17) + '<span>Asignaciones</span></button>';
      items += '<button data-tab="users" class="' + (A.ui.tab === 'users' ? 'active' : '') + '">' + A.icon('briefcase',17) + '<span>Usuarios y roles</span></button>';
      items += '<button data-tab="compliance" class="' + (A.ui.tab === 'compliance' ? 'active' : '') + '">' + A.icon('shield',17) + '<span>Cumplimiento</span></button>';
      items += '<button data-tab="certificates" class="' + (A.ui.tab === 'certificates' ? 'active' : '') + '">' + A.icon('trophy',17) + '<span>Certificados</span></button>';
    }
    return '<div class="tab-bar integrated-tab-bar">' + items + '</div>';
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

  function csvCell(value) {
    var s = String(value == null ? '' : value);
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function downloadText(name, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }
  function courseReadiness(c) {
    var phases = c.phases || [];
    var blocks = A.flatten(c);
    var required = blocks.filter(function(x){ return x.block.required; }).length;
    var questions = (c.questions || []).length;
    var ready = phases.length > 0 && required > 0 && questions === 10;
    return { phases:phases.length, blocks:blocks.length, required:required, questions:questions, ready:ready };
  }
  function roleLabel(role) {
    return {colaborador:'Colaborador',creador_contenido:'Creador de contenido',revisor:'Revisor',admin:'Administrador',super_admin:'Super Admin'}[role] || role;
  }
  function moveItem(list, index, delta) {
    var next=index+delta;
    if(index<0||next<0||next>=list.length) return false;
    var item=list[index]; list.splice(index,1); list.splice(next,0,item); return true;
  }

  function coursePanel() {
    A.ui.courseSearch=A.ui.courseSearch||'';
    A.ui.courseStatus=A.ui.courseStatus||'all';

    if (A.ui.selectedCourse) {
      var c = A.course(A.ui.selectedCourse);
      if (!c) { A.ui.selectedCourse = null; return coursePanel(); }
      c.phases = c.phases || [];
      c.questions = c.questions || [];
      var ready=courseReadiness(c);

      var phasesHtml=c.phases.map(function(p,pi){
        var blocks=(p.blocks||[]).map(function(b,bi){
          return '<div class="block-admin-row premium-admin-row"><div class="admin-order-controls"><button type="button" class="icon-button move-block" data-phase="'+pi+'" data-block="'+bi+'" data-delta="-1" '+(bi===0?'disabled':'')+'>↑</button><button type="button" class="icon-button move-block" data-phase="'+pi+'" data-block="'+bi+'" data-delta="1" '+(bi===(p.blocks||[]).length-1?'disabled':'')+'>↓</button></div><div class="admin-row-copy"><b>'+A.escape(b.title)+'</b><small>'+A.escape(b.type||'reading')+(b.required?' · obligatorio':' · opcional')+(b.url?' · recurso enlazado':'')+'</small></div><button type="button" class="danger-button compact delete-block" data-id="'+A.escape(b.id)+'">Eliminar</button></div>';
        }).join('');
        return '<article class="phase-admin-card"><header><div class="admin-order-controls"><button type="button" class="icon-button move-phase" data-index="'+pi+'" data-delta="-1" '+(pi===0?'disabled':'')+'>↑</button><button type="button" class="icon-button move-phase" data-index="'+pi+'" data-delta="1" '+(pi===c.phases.length-1?'disabled':'')+'>↓</button></div><div><span class="eyebrow">Fase '+(pi+1)+'</span><h3>'+A.escape(p.title)+'</h3></div><button type="button" class="text-action danger delete-phase" data-index="'+pi+'">Eliminar fase</button></header><div class="phase-block-list">'+(blocks||'<div class="demo-empty-mini">Aún no hay contenidos en esta fase.</div>')+'</div></article>';
      }).join('');

      var questionHtml=c.questions.map(function(q,i){
        return '<article class="question-admin-row"><div class="question-order"><button type="button" class="icon-button move-question" data-index="'+i+'" data-delta="-1" '+(i===0?'disabled':'')+'>↑</button><button type="button" class="icon-button move-question" data-index="'+i+'" data-delta="1" '+(i===c.questions.length-1?'disabled':'')+'>↓</button></div><div><strong>'+(i+1)+'. '+A.escape(q.prompt)+'</strong><small>Correcta: '+A.escape((q.options||[])[Number(q.correct)]||'Sin definir')+'</small></div><button type="button" class="danger-button compact delete-question" data-index="'+i+'">Eliminar</button></article>';
      }).join('');

      return '<div class="course-editor-layout">' +
        '<section class="panel-card course-editor-summary"><div class="section-title-row"><div><span class="eyebrow">Preparación</span><h2>'+A.escape(c.title)+'</h2><p>La publicación exige al menos un contenido obligatorio y exactamente 10 preguntas.</p></div><span class="readiness-badge '+(ready.ready?'ready':'pending')+'">'+(ready.ready?'Lista para publicar':'En preparación')+'</span></div><div class="readiness-grid"><span><b>'+ready.phases+'</b> Fases</span><span><b>'+ready.blocks+'</b> Contenidos</span><span><b>'+ready.required+'</b> Obligatorios</span><span><b>'+ready.questions+'/10</b> Preguntas</span></div></section>' +
        '<section class="panel-card"><div class="section-title-row"><div><span class="eyebrow">Información principal</span><h3>Datos básicos</h3></div><button type="button" class="secondary-button compact" id="backCourses">← Volver</button></div><form id="editCourseForm" class="demo-inline-form">' +
          '<label>Título<input name="title" value="'+A.escape(c.title)+'" required></label><label>Nota mínima<input name="passing" type="number" min="1" max="100" value="'+c.passing_score+'" required></label>' +
          '<label>Categoría<input name="category" value="'+A.escape(c.category||'General')+'" required></label><label>Duración estimada (min)<input name="minutes" type="number" min="1" max="1440" value="'+Number(c.estimated_minutes||30)+'"></label>' +
          '<label class="span-2">Descripción<textarea name="description" rows="4">'+A.escape(c.description)+'</textarea></label>' +
          '<label class="span-2">Portada por URL<input name="cover_url" type="url" value="'+A.escape(c.cover_url||'')+'" placeholder="https://…"></label>' +
          '<label class="span-2 file-upload-card">O subir una portada<input id="coverFile" type="file" accept="image/png,image/jpeg,image/webp"><small>PNG, JPG o WEBP · máximo 5 MB.</small></label>' +
          (c.cover_url?'<div class="span-2 course-cover-preview"><img src="'+A.escape(c.cover_url)+'" alt="Portada de '+A.escape(c.title)+'"></div>':'') +
          '<label>Estado<select name="status"><option value="draft" '+(c.status==='draft'?'selected':'')+'>Borrador</option><option value="published" '+(c.status==='published'?'selected':'')+'>Publicado</option><option value="archived" '+(c.status==='archived'?'selected':'')+'>Archivado</option></select></label><div class="demo-actions"><button class="primary-button" id="saveCourseBtn">Guardar cambios</button></div>' +
        '</form></section>' +
        '<section class="panel-card"><div class="section-title-row"><div><span class="eyebrow">Constructor</span><h3>Fases y contenidos</h3><p>Divide contenidos largos y ordena el recorrido de aprendizaje.</p></div></div>' +
          '<div class="phase-admin-list">'+(phasesHtml||'<div class="demo-empty-mini">Empieza agregando una fase.</div>')+'</div>' +
          '<form id="addPhaseForm" class="demo-inline-form admin-subform"><label class="span-2">Nueva fase<input name="title" placeholder="Ej. Introducción, Procedimiento, Cierre…" required></label><button class="secondary-button">Agregar fase</button></form>' +
          '<form id="addBlockForm" class="demo-inline-form admin-subform"><label>Fase<select name="phase">'+c.phases.map(function(p,i){return '<option value="'+i+'">'+A.escape(p.title)+'</option>';}).join('')+'</select></label><label>Tipo<select name="type"><option value="reading">Lectura</option><option value="video">Video</option><option value="presentation">Presentación</option><option value="pdf">PDF</option><option value="image">Imagen</option><option value="audio">Audio</option><option value="link">Enlace</option><option value="game">Juego</option><option value="validation">Validación</option></select></label><label class="span-2">Título<input name="title" required></label><label class="span-2">Contenido / instrucciones<textarea name="body" rows="3"></textarea></label><label class="span-2">URL del recurso (opcional)<input name="url" type="url" placeholder="https://…"></label><label><input name="required" type="checkbox" checked> Contenido obligatorio</label><div><button class="primary-button" '+(!c.phases.length?'disabled':'')+'>Agregar contenido</button></div></form>' +
        '</section>' +
        '<section class="panel-card"><div class="section-title-row"><div><span class="eyebrow">Evaluación certificable</span><h3>Banco de preguntas</h3><p>La respuesta correcta se conserva en PostgreSQL y no se entrega al colaborador.</p></div><span class="plain-chip">'+c.questions.length+'/10 preguntas</span></div>' +
          '<div class="question-admin-list">'+(questionHtml||'<div class="demo-empty-mini">Aún no hay preguntas.</div>')+'</div>' +
          '<form id="addQuestionForm" class="demo-inline-form admin-subform"><label class="span-2">Pregunta<input name="prompt" required></label><label>Opción A<input name="a" required></label><label>Opción B<input name="b" required></label><label>Opción C<input name="c" required></label><label>Opción D<input name="d" required></label><label>Correcta<select name="correct"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select></label><div><button class="primary-button" '+(c.questions.length>=10?'disabled':'')+'>Agregar pregunta</button></div></form>' +
          '<div class="question-import-box"><span class="eyebrow">Importación rápida</span><p>Una línea por pregunta: <b>Pregunta;A;B;C;D;Correcta</b> (Correcta = A, B, C, D o 1–4).</p><textarea id="questionImportText" rows="5" placeholder="¿Pregunta?;Opción A;Opción B;Opción C;Opción D;A"></textarea><div class="demo-actions"><button type="button" class="secondary-button" id="importQuestions">Importar</button><button type="button" class="secondary-button" id="downloadQuestionTemplate">Plantilla</button><button type="button" class="secondary-button" id="exportQuestions">Exportar</button></div></div>' +
        '</section></div>';
    }

    var q=A.ui.courseSearch.toLowerCase();
    var filtered=A.state.courses.filter(function(c){
      var statusOk=A.ui.courseStatus==='all'||c.status===A.ui.courseStatus;
      var text=(c.title+' '+c.description+' '+(c.category||'')).toLowerCase();
      return statusOk&&(!q||text.indexOf(q)>=0);
    });

    return '<div class="courses-manager-pro courses-center"><section class="panel-card"><div class="section-title-row"><div><span class="eyebrow">Capacitaciones</span><h2>Diseña experiencias de aprendizaje completas.</h2></div><span class="plain-chip">'+filtered.length+' capacitación(es)</span></div><div class="manager-toolbar"><div class="search-field"><span>⌕</span><input id="courseSearch" placeholder="Buscar…" value="'+A.escape(A.ui.courseSearch)+'"></div><select id="courseStatusFilter"><option value="all">Todos los estados</option><option value="published">Publicadas</option><option value="draft">Borradores</option><option value="archived">Archivadas</option></select></div><div class="course-admin-grid">'+(filtered.length?filtered.map(function(c){var r=courseReadiness(c);return '<article class="course-admin-card">'+(c.cover_url?'<img src="'+A.escape(c.cover_url)+'" alt="">':'<div class="course-admin-cover-fallback">'+A.escape(String(c.title).slice(0,2).toUpperCase())+'</div>')+'<div><span class="status-badge '+A.escape(c.status)+'">'+A.escape(c.status)+'</span><h3>'+A.escape(c.title)+'</h3><p>'+A.escape(c.description)+'</p><div class="admin-course-meta"><span>'+A.escape(c.category||'General')+'</span><span>'+Number(c.estimated_minutes||30)+' min</span><span>'+r.questions+'/10 preguntas</span></div><button class="primary-button edit-course" data-id="'+A.escape(c.id)+'">Editar</button></div></article>';}).join(''):'<div class="demo-empty-mini">No hay capacitaciones para mostrar.</div>')+'</div></section>' +
      '<section class="panel-card"><span class="eyebrow">Nueva capacitación</span><h3>Comienza con una estructura clara.</h3><p>Se crea como borrador; nadie podrá verla hasta que cumpla los criterios de publicación.</p><form id="newCourseForm" class="demo-inline-form"><label>Título<input name="title" required></label><label>Nota mínima<input name="passing" type="number" min="1" max="100" value="80" required></label><label>Categoría<input name="category" value="General"></label><label>Duración (min)<input name="minutes" type="number" min="1" max="1440" value="30"></label><label class="span-2">Descripción<textarea name="description" rows="4" required></textarea></label><button class="primary-button">Crear capacitación</button></form></section></div>';
  }

  function assignmentsPanel() {
    A.ui.assignmentSearch=A.ui.assignmentSearch||'';
    A.ui.assignmentRole=A.ui.assignmentRole||'all';
    A.ui.assignmentState=A.ui.assignmentState||'active';
    A.ui.selectedAssignmentUsers=A.ui.selectedAssignmentUsers||[];

    var courseId=A.ui.assignmentCourse||((A.state.courses.find(function(c){return c.status==='published';})||{}).id||'');
    var search=A.ui.assignmentSearch.toLowerCase();
    var selectedSet=new Set(A.ui.selectedAssignmentUsers);
    var filteredUsers=A.state.users.filter(function(u){
      var roleOk=A.ui.assignmentRole==='all'||u.role===A.ui.assignmentRole;
      var stateOk=A.ui.assignmentState==='all'||(A.ui.assignmentState==='active'?u.is_active:!u.is_active);
      var text=(u.full_name+' '+u.email).toLowerCase();
      return roleOk&&stateOk&&(!search||text.indexOf(search)>=0);
    });
    var courseAssignments=A.state.assignments.filter(function(a){return !courseId||a.course_id===courseId;});

    return '<div class="assignment-center"><section class="panel-card assignment-hero-card"><div class="section-title-row"><div><span class="eyebrow">Centro de asignaciones</span><h2>Asigna a muchas personas en pocos pasos.</h2><p>Una sola operación de Supabase para toda la selección.</p></div><div class="assignment-summary-icon">◎</div></div></section>' +
      '<section class="panel-card"><div class="course-picker-grid"><div class="course-picker"><label>1. Capacitación publicada</label><select id="assignmentCourse">'+A.state.courses.filter(function(c){return c.status==='published';}).map(function(c){return '<option value="'+A.escape(c.id)+'" '+(c.id===courseId?'selected':'')+'>'+A.escape(c.title)+'</option>';}).join('')+'</select></div><div class="course-picker"><label>Vencimiento</label><input id="bulkDueDate" type="date" value="'+futureDate(30)+'"><small>La fecha se aplica a toda la selección.</small></div></div></section>' +
      '<section class="panel-card"><div class="section-title-row"><div><span class="eyebrow">2. Personas</span><h3>Selecciona por filtros o correos</h3></div><strong>'+selectedSet.size+' seleccionada(s)</strong></div><div class="manager-toolbar three"><div class="search-field"><span>⌕</span><input id="assignmentSearch" value="'+A.escape(A.ui.assignmentSearch)+'" placeholder="Nombre o correo"></div><select id="assignmentRole"><option value="all">Todos los roles</option>'+['colaborador','creador_contenido','revisor','admin','super_admin'].map(function(r){return '<option value="'+r+'" '+(A.ui.assignmentRole===r?'selected':'')+'>'+roleLabel(r)+'</option>';}).join('')+'</select><select id="assignmentState"><option value="active">Solo activos</option><option value="all">Activos e inactivos</option><option value="inactive">Solo inactivos</option></select></div><div class="bulk-buttons"><button id="selectFilteredUsers" class="secondary-button">Seleccionar todos los filtrados</button><button id="clearAssignmentSelection" class="secondary-button">Limpiar selección</button></div><div class="demo-table-wrap"><table class="demo-table selection-table"><thead><tr><th></th><th>Persona</th><th>Rol</th><th>Estado actual</th></tr></thead><tbody>'+filteredUsers.map(function(u){var a=A.state.assignments.find(function(x){return x.user_id===u.id&&x.course_id===courseId;});return '<tr><td><input class="assignment-user-check" type="checkbox" value="'+u.id+'" '+(selectedSet.has(u.id)?'checked':'')+'></td><td><b>'+A.escape(u.full_name)+'</b><br><small>'+A.escape(u.email)+'</small></td><td>'+A.escape(roleLabel(u.role))+'</td><td><span class="demo-chip '+(a?'success':'')+'">'+(a?(a.due_at?'Asignada · '+A.escape(a.due_at):'Asignada'):'Sin asignar')+'</span></td></tr>';}).join('')+'</tbody></table></div><div class="email-selector-box"><label>Seleccionar por correos<textarea id="assignmentEmails" rows="3" placeholder="usuario1@sanpedro-valle.gov.co, usuario2@sanpedro-valle.gov.co"></textarea></label><div class="demo-actions"><button type="button" id="selectByEmails" class="secondary-button">Seleccionar coincidencias</button><label class="file-button">Cargar CSV/TXT<input id="assignmentFile" type="file" accept=".csv,.txt" hidden></label><button type="button" id="downloadAssignmentTemplate" class="secondary-button">Plantilla</button></div></div><div class="bulk-action-footer"><button id="bulkAssignBtn" class="primary-button" '+(!selectedSet.size?'disabled':'')+'>Asignar a '+selectedSet.size+' persona(s)</button></div></section>' +
      '<section class="panel-card"><div class="section-title-row"><div><span class="eyebrow">Matrículas</span><h3>Asignaciones actuales</h3></div><span class="plain-chip">'+courseAssignments.length+'</span></div><div class="assignment-list">'+(courseAssignments.length?courseAssignments.map(function(a){var u=A.user(a.user_id),course=A.course(a.course_id);return '<article class="assignment-card"><div><b>'+A.escape(course?course.title:'Capacitación')+'</b><span>'+A.escape(u?u.full_name:'Usuario')+'</span><small>'+(a.due_at?'Vence '+A.escape(a.due_at):'Sin vencimiento')+(a.assignment_source==='training_engine'?' · Ruta automática':' · Manual')+'</small></div><button class="danger-button delete-assignment" data-id="'+a.id+'">Cancelar matrícula</button></article>';}).join(''):'<div class="demo-empty-mini">No hay asignaciones para esta capacitación.</div>')+'</div></section></div>';
  }

  function usersPanel() {
    A.ui.userSearch=A.ui.userSearch||'';
    A.ui.userRoleFilter=A.ui.userRoleFilter||'all';
    A.ui.userStateFilter=A.ui.userStateFilter||'all';
    A.ui.selectedUsers=A.ui.selectedUsers||[];

    var selected=new Set(A.ui.selectedUsers);
    var q=A.ui.userSearch.toLowerCase();
    var actorRole=A.profile.role;
    var actorRank=actorRole==='super_admin'?50:40;
    var rank={colaborador:10,creador_contenido:20,revisor:30,admin:40,super_admin:50};
    var filtered=A.state.users.filter(function(u){
      var r=A.ui.userRoleFilter==='all'||u.role===A.ui.userRoleFilter;
      var st=A.ui.userStateFilter==='all'||(A.ui.userStateFilter==='active'?u.is_active:!u.is_active);
      var t=(u.full_name+' '+u.email).toLowerCase();
      return r&&st&&(!q||t.indexOf(q)>=0);
    });
    var allowed=actorRole==='super_admin'?['colaborador','creador_contenido','revisor','admin','super_admin']:['colaborador','creador_contenido','revisor'];
    var allRoles=['colaborador','creador_contenido','revisor','admin','super_admin'];
    var detail=A.ui.userDetail?A.user(A.ui.userDetail):null;
    var credential=A.ui.tempCredential||null;

    function canManage(u){
      if(!u||u.id===A.currentUid()) return false;
      if(actorRole==='super_admin') return true;
      return actorRole==='admin' && (rank[u.role]||10)<40;
    }

    var credentialCard=credential?'<section class="panel-card credential-reveal-card"><div class="credential-reveal-icon">'+A.icon('shield',22)+'</div><div><span class="eyebrow">Credencial temporal</span><h3>'+A.escape(credential.email||'Usuario creado')+'</h3><p>Esta contraseña se muestra únicamente en esta sesión administrativa. Entrégala por un canal seguro.</p><code>'+A.escape(credential.password)+'</code></div><div class="credential-reveal-actions"><button type="button" id="copyCredential" class="primary-button">'+A.icon('filecheck',16)+' Copiar contraseña</button><button type="button" id="dismissCredential" class="secondary-button">Ocultar</button></div></section>':'';

    return '<div class="users-manager-pro users-center">'+credentialCard+
      '<section class="panel-card users-command-center"><div class="section-title-row"><div><span class="eyebrow">Usuarios y roles</span><h2>Control de acceso del Aula.</h2><p>'+A.state.users.filter(function(u){return u.is_active;}).length+' activas de '+A.state.users.length+' membresías · Tu rol: '+A.escape(roleLabel(actorRole))+'.</p></div><button id="exportUsers" class="secondary-button">'+A.icon('filecheck',16)+' Exportar CSV</button></div>'+
      '<div class="user-admin-notice">'+A.icon('shield',18)+'<div><strong>Jerarquía protegida</strong><span>Admin administra roles inferiores. Super Admin controla administradores, contraseñas y eliminación Auth segura.</span></div></div>'+
      '<div class="manager-toolbar three"><div class="search-field"><span>'+A.icon('search',17)+'</span><input id="userSearch" placeholder="Buscar usuario…" value="'+A.escape(A.ui.userSearch)+'"></div><select id="userRoleFilter"><option value="all">Todos los roles</option>'+allRoles.map(function(r){return '<option value="'+r+'" '+(A.ui.userRoleFilter===r?'selected':'')+'>'+roleLabel(r)+'</option>';}).join('')+'</select><select id="userStateFilter"><option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></div>'+
      '<div class="bulk-buttons"><button id="selectFilteredMembers" class="secondary-button">Seleccionar filtrados</button><button id="clearMemberSelection" class="secondary-button">Limpiar</button><button id="bulkReactivate" class="secondary-button" '+(!selected.size?'disabled':'')+'>Reactivar</button><button id="bulkDeactivate" class="danger-button" '+(!selected.size?'disabled':'')+'>Desactivar</button><span>'+selected.size+' seleccionados</span></div>'+
      '<div class="demo-table-wrap"><table class="demo-table"><thead><tr><th></th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Administración</th></tr></thead><tbody>'+filtered.map(function(u){
        var self=u.id===A.currentUid(),manageable=canManage(u),options=actorRole==='super_admin'?allRoles:allowed;
        return '<tr><td><input class="member-check" type="checkbox" value="'+u.id+'" '+(selected.has(u.id)?'checked':'')+' '+(!manageable?'disabled':'')+'></td>'+
          '<td><button class="user-detail-link" data-user-detail="'+u.id+'"><b>'+A.escape(u.full_name)+'</b><small>'+A.escape(u.email)+'</small></button></td>'+
          '<td><select class="role-change" data-id="'+u.id+'" '+(manageable?'':'disabled')+'>'+options.map(function(r){return '<option value="'+r+'" '+(r===u.role?'selected':'')+'>'+roleLabel(r)+'</option>';}).join('')+'</select></td>'+
          '<td><span class="demo-chip '+(u.is_active?'success':'warning')+'">'+(u.is_active?'Activo':'Inactivo')+'</span></td>'+
          '<td>'+(manageable?'<div class="user-row-actions"><button class="secondary-button compact user-detail-action" data-user-detail="'+u.id+'">Gestionar</button><button class="'+(u.is_active?'danger-button':'secondary-button')+' toggle-user compact" data-id="'+u.id+'">'+(u.is_active?'Desactivar':'Reactivar')+'</button></div>':self?'<small>Tu cuenta</small>':'<small>Protegido por jerarquía</small>')+'</td></tr>';
      }).join('')+'</tbody></table></div></section>' +

      '<section class="panel-card create-user-card"><div class="section-title-row"><div><span class="eyebrow">Alta institucional</span><h3>Crear o vincular usuario</h3><p>Si la cuenta ya existe en Auth se vincula al Aula; de lo contrario se crea con credencial temporal segura.</p></div><span class="permission-chip">'+A.icon('shield',14)+' '+A.escape(roleLabel(actorRole))+'</span></div><form id="newUserForm" class="demo-inline-form"><label>Nombre completo<input name="name" required></label><label>Correo institucional<input name="email" type="email" placeholder="usuario@sanpedro-valle.gov.co" required></label><label>Rol inicial<select name="role">'+allowed.map(function(r){return '<option value="'+r+'">'+roleLabel(r)+'</option>';}).join('')+'</select></label><div><button class="primary-button" id="createUserBtn">'+A.icon('briefcase',16)+' Vincular / crear</button></div></form></section>' +

      (detail?(function(){
        var manageable=canManage(detail),self=detail.id===A.currentUid(),isSuper=actorRole==='super_admin';
        var detailRoles=actorRole==='super_admin'?allRoles:allowed;
        return '<section class="panel-card user-detail-panel admin-user-console"><div class="section-title-row"><div><span class="eyebrow">Consola de usuario</span><h3>'+A.escape(detail.full_name)+'</h3><p>'+A.escape(detail.email)+'</p></div><button id="closeUserDetail" class="secondary-button compact">Cerrar</button></div>'+
          '<div class="user-detail-metrics"><article><span>Matrículas</span><strong>'+A.state.assignments.filter(function(a){return a.user_id===detail.id;}).length+'</strong></article><article><span>Certificados</span><strong>'+A.state.certificates.filter(function(x){return x.user_id===detail.id;}).length+'</strong></article><article><span>Rol</span><strong>'+A.escape(roleLabel(detail.role))+'</strong></article><article><span>Cuenta</span><strong>'+(detail.is_active?'Activa':'Inactiva')+'</strong></article></div>'+
          (manageable?'<div class="user-security-console">'+
            '<form id="editUserProfileForm" class="user-admin-block"><div><span class="eyebrow">Identidad</span><h4>Perfil y permisos</h4></div><label>Nombre completo<input name="full_name" value="'+A.escape(detail.full_name)+'" required></label><label>Rol<select name="role">'+detailRoles.map(function(r){return '<option value="'+r+'" '+(detail.role===r?'selected':'')+'>'+roleLabel(r)+'</option>';}).join('')+'</select></label><button class="primary-button">Guardar cambios</button></form>'+
            '<div class="user-admin-block"><div><span class="eyebrow">Acceso al Aula</span><h4>'+(detail.is_active?'Cuenta activa':'Cuenta desactivada')+'</h4><p>La desactivación conserva historial, certificados y la identidad compartida de Supabase.</p></div><button id="detailToggleUser" class="'+(detail.is_active?'danger-button':'secondary-button')+'" data-id="'+detail.id+'">'+(detail.is_active?'Desactivar en Aula':'Reactivar en Aula')+'</button></div>'+
            (isSuper?'<div class="user-admin-block sensitive"><div><span class="eyebrow">Seguridad · Super Admin</span><h4>Contraseña temporal</h4><p>Solo aplica a cuentas con proveedor de correo. Las cuentas Google administran su contraseña en Workspace.</p></div><button id="resetUserPassword" class="secondary-button" data-id="'+detail.id+'">'+A.icon('refresh',16)+' Restablecer contraseña</button></div>'+
            '<div class="user-admin-block destructive"><div><span class="eyebrow">Zona crítica</span><h4>Eliminar identidad Auth</h4><p>Solo se permite para cuentas creadas exclusivamente por Aula y sin referencias en otros sistemas municipales.</p></div><button id="deleteUserAuth" class="danger-button" data-id="'+detail.id+'" data-email="'+A.escape(detail.email)+'">Eliminar cuenta definitivamente</button></div>':'')+
          '</div>':'<div class="user-protected-card">'+A.icon('shield',20)+'<div><strong>'+(self?'Esta es tu cuenta':'Usuario protegido por jerarquía')+'</strong><span>'+(self?'Los cambios sensibles sobre tu propia cuenta se realizan fuera de esta consola.':'No tienes nivel suficiente para modificar este usuario.')+'</span></div></div>')+
          '<div class="user-learning-history"><span class="eyebrow">Formación asignada</span><div class="assignment-list">'+(A.state.assignments.filter(function(a){return a.user_id===detail.id;}).slice(0,8).map(function(a){var co=A.course(a.course_id);return '<article class="assignment-card"><div><b>'+A.escape(co?co.title:'Capacitación')+'</b><span>'+A.percent(detail.id,co||{id:a.course_id,phases:[]})+'% completado</span></div></article>';}).join('')||'<div class="demo-empty-mini">Sin capacitaciones asignadas.</div>')+'</div></div></section>';
      })():'')+'</div>';
  }

  function complianceStateLabel(state) {
    return { compliant:'Al día', expiring:'Por vencer', overdue:'Vencida', expired:'Evidencia vencida', in_progress:'En progreso', assigned:'Asignada', not_assigned:'Sin matrícula' }[state] || state;
  }

  function compliancePanel() {
    var d=A.trainingAdmin;
    if(!d) return '<section class="compliance-loading"><div class="experience-loading-mark">A</div><h2>Preparando Motor de Formación…</h2><p>Cargando cargos, competencias, rutas y cumplimiento.</p></section>';
    A.ui.complianceSection=A.ui.complianceSection||'overview';
    var section=A.ui.complianceSection, positions=d.positions||[], competencies=d.competencies||[], paths=d.paths||[], members=d.members||[], rows=d.compliance||[], snap=d.snapshot||{};
    A.ui.selectedPosition=A.ui.selectedPosition||((positions[0]||{}).id||'');
    A.ui.selectedPath=A.ui.selectedPath||((paths[0]||{}).id||'');
    var pos=positions.find(function(x){return x.id===A.ui.selectedPosition;})||positions[0]||null;
    var path=paths.find(function(x){return x.id===A.ui.selectedPath;})||paths[0]||null;
    var nav=[['overview','Resumen'],['positions','Cargos y personas'],['competencies','Competencias'],['paths','Rutas'],['automation','Automatizaciones'],['matrix','Cumplimiento']];
    var top='<section class="compliance-hero"><div><span class="eyebrow-light">Motor de formación y cumplimiento</span><h2>Del cargo a la evidencia, con trazabilidad completa.</h2><p>Cargos → competencias → rutas → capacitaciones → vencimientos → certificados → recertificación → analítica.</p></div><div class="compliance-hero-score"><strong>'+Number(snap.compliance_percent||0)+'%</strong><span>cumplimiento</span></div></section><div class="compliance-tabs">'+nav.map(function(n){return '<button data-compliance-section="'+n[0]+'" class="'+(section===n[0]?'active':'')+'">'+n[1]+'</button>';}).join('')+'</div>';

    var body='';
    if(section==='overview'){
      body='<div class="compliance-overview"><div class="compliance-metrics"><article><span>Cargos</span><strong>'+Number(snap.positions||0)+'</strong></article><article><span>Competencias</span><strong>'+Number(snap.competencies||0)+'</strong></article><article><span>Rutas</span><strong>'+Number(snap.paths||0)+'</strong></article><article><span>Personas con cargo</span><strong>'+Number(snap.users_with_position||0)+'</strong></article><article><span>Obligaciones</span><strong>'+Number(snap.requirements||0)+'</strong></article><article><span>Vencidas</span><strong>'+Number(snap.overdue||0)+'</strong></article></div><div class="compliance-overview-grid"><section class="panel-card compliance-flow-card"><span class="eyebrow">Flujo automático</span><h3>La asignación ya no depende de trabajo manual</h3><div class="compliance-flow"><span>Cargo</span><b>→</b><span>Competencias</span><b>→</b><span>Ruta</span><b>→</b><span>Curso</span><b>→</b><span>Evidencia</span></div><div class="compliance-flow-actions"><button id="syncTrainingEngine" class="primary-button">Sincronizar ahora</button></div></section><section class="panel-card compliance-alert-card"><span class="eyebrow">Atención</span><h3>'+Number(snap.without_position||0)+' personas sin cargo formativo</h3><p>'+Number(snap.due_soon||0)+' obligaciones están próximas a vencer y '+Number(snap.overdue||0)+' requieren gestión.</p></section></div></div>';
    } else if(section==='positions'){
      body='<div class="compliance-two-column"><section class="panel-card compliance-catalog-panel"><div class="section-title-row"><div><span class="eyebrow">Catálogo</span><h3>Cargos y categorías</h3></div></div><div class="compliance-position-list">'+positions.map(function(x){return '<button class="'+(pos&&x.id===pos.id?'active':'')+'" data-position-id="'+x.id+'"><span class="compliance-position-icon">◎</span><div><strong>'+A.escape(x.name)+'</strong><small>'+A.escape(x.department||'Sin dependencia')+'</small></div></button>';}).join('')+'</div><form id="newPositionForm" class="compliance-create-box"><h4>Nuevo cargo</h4><input name="name" placeholder="Nombre del cargo" required><input name="department" placeholder="Dependencia"><button class="primary-button compact">Crear</button></form></section><section class="panel-card compliance-position-detail">'+(pos?'<span class="eyebrow">Configuración del cargo</span><h2>'+A.escape(pos.name)+'</h2><p>'+A.escape(pos.description||'Configura rutas y personas asociadas.')+'</p><h4>Rutas obligatorias</h4><div class="compliance-path-toggle-grid">'+paths.map(function(p){var linked=(d.position_paths||[]).some(function(v){return v.position_id===pos.id&&v.path_id===p.id;});return '<label class="route-toggle"><input class="position-path-toggle" type="checkbox" data-position="'+pos.id+'" data-path="'+p.id+'" '+(linked?'checked':'')+'><span><strong>'+A.escape(p.name)+'</strong><small>'+A.escape(p.description||'Ruta formativa')+'</small></span></label>';}).join('')+'</div><h4>Personas</h4><div class="compliance-people-list">'+members.filter(function(m){return m.is_active;}).map(function(m){return '<div class="compliance-person-row"><div class="compliance-person-avatar">'+A.escape(String(m.full_name||'U').split(/\s+/).slice(0,2).map(function(x){return x[0];}).join('').toUpperCase())+'</div><div><strong>'+A.escape(m.full_name)+'</strong><small>'+A.escape(m.email)+'</small></div><select class="person-position" data-user="'+m.id+'"><option value="">Sin cargo</option>'+positions.filter(function(p){return p.is_active;}).map(function(p){return '<option value="'+p.id+'" '+(m.job_position_id===p.id?'selected':'')+'>'+A.escape(p.name)+'</option>';}).join('')+'</select></div>';}).join('')+'</div>':'<div class="compliance-empty-compact">Crea un cargo para comenzar.</div>')+'</section></div>';
    } else if(section==='competencies'){
      body='<div class="compliance-competency-layout"><section class="panel-card"><div class="section-title-row"><div><span class="eyebrow">Matriz</span><h3>Competencias por cargo</h3></div><select id="competencyPositionSelect">'+positions.map(function(p){return '<option value="'+p.id+'" '+(pos&&p.id===pos.id?'selected':'')+'>'+A.escape(p.name)+'</option>';}).join('')+'</select></div><div class="compliance-competency-grid">'+competencies.map(function(x){var map=(d.position_competencies||[]).find(function(v){return pos&&v.position_id===pos.id&&v.competency_id===x.id;});return '<label class="competency-toggle"><input class="position-competency-toggle" type="checkbox" data-position="'+(pos?pos.id:'')+'" data-competency="'+x.id+'" '+(map?'checked':'')+'><div><strong>'+A.escape(x.name)+'</strong><small>'+A.escape(x.category)+'</small></div><span>N'+(map?map.required_level:1)+'</span></label>';}).join('')+'</div></section><section class="panel-card compliance-create-competency"><span class="eyebrow">Nueva competencia</span><h3>Ampliar catálogo</h3><form id="newCompetencyForm" class="stack-form"><input name="name" placeholder="Nombre" required><select name="category"><option>institucional</option><option>cumplimiento</option><option>digital</option><option>gestion</option><option>servicio</option></select><textarea name="description" placeholder="Descripción"></textarea><button class="primary-button">Crear competencia</button></form></section></div>';
    } else if(section==='paths'){
      body='<div class="compliance-path-layout"><section class="panel-card compliance-path-sidebar"><span class="eyebrow">Rutas</span><div class="compliance-path-list">'+paths.map(function(p){return '<button class="'+(path&&p.id===path.id?'active':'')+'" data-path-id="'+p.id+'"><strong>'+A.escape(p.name)+'</strong><small>v'+p.version+'</small></button>';}).join('')+'</div><form id="newPathForm" class="compliance-create-box"><h4>Nueva ruta</h4><input name="name" placeholder="Nombre de la ruta" required><textarea name="description" placeholder="Descripción"></textarea><button class="primary-button compact">Crear</button></form></section><section class="panel-card compliance-path-builder">'+(path?'<span class="eyebrow">Constructor de ruta</span><h2>'+A.escape(path.name)+'</h2><p>'+A.escape(path.description||'Vincula capacitaciones publicadas y define vigencias.')+'</p><div class="compliance-course-pool-grid">'+A.state.courses.filter(function(c){return c.status==='published';}).map(function(course){var map=(d.path_courses||[]).find(function(v){return v.path_id===path.id&&v.course_id===course.id;});return '<label class="path-course-card"><input class="path-course-toggle" type="checkbox" data-path="'+path.id+'" data-course="'+A.escape(course.id)+'" '+(map?'checked':'')+'><div><strong>'+A.escape(course.title)+'</strong><small>'+(map?'Vence en '+(map.due_days||30)+' días · recertifica '+(map.recertification_months||'sin vigencia'):'No vinculada')+'</small></div></label>';}).join('')+'</div>':'<div class="compliance-empty-path">Crea o selecciona una ruta.</div>')+'</section></div>';
    } else if(section==='automation'){
      body='<div class="compliance-automation"><section class="panel-card compliance-automation-intro"><span class="eyebrow">Automatizaciones</span><h2>Reglas que trabajan por la entidad</h2><p>La arquitectura ya permite asignar rutas por cargo, preparar alertas de vencimiento y gestionar recertificación.</p><button id="syncTrainingEngine" class="primary-button">Sincronizar motor</button></section><div class="compliance-rule-grid">'+(d.rules||[]).map(function(r){return '<article><div class="automation-rule-icon">⚡</div><div class="automation-rule-copy"><strong>'+A.escape(r.name)+'</strong><p>'+A.escape(r.description||'')+'</p></div><div class="automation-rule-footer"><span class="demo-chip '+(r.is_active?'success':'warning')+'">'+(r.is_active?'Activa':'Preparada')+'</span><label class="switch-control"><input class="rule-toggle" data-rule="'+r.id+'" type="checkbox" '+(r.is_active?'checked':'')+'><span></span></label></div></article>';}).join('')+'</div></div>';
    } else {
      A.ui.complianceQuery=A.ui.complianceQuery||''; var q=A.ui.complianceQuery.toLowerCase();
      var filtered=rows.filter(function(r){return !q||(r.full_name+' '+r.position_name+' '+r.path_name+' '+r.course_title).toLowerCase().indexOf(q)>=0;});
      body='<section class="panel-card compliance-matrix"><div class="compliance-matrix-head"><div><span class="eyebrow">Matriz viva</span><h2>Cumplimiento formativo</h2><p>Estado consolidado por persona, cargo, ruta y capacitación.</p></div><div class="compliance-matrix-summary"><span>'+rows.length+' obligaciones</span><span class="warning">'+Number(snap.due_soon||0)+' por vencer</span><span class="danger">'+Number(snap.overdue||0)+' vencidas</span></div></div><div class="search-field compliance-matrix-search"><span>⌕</span><input id="complianceSearch" placeholder="Buscar persona, cargo, ruta o curso…" value="'+A.escape(A.ui.complianceQuery)+'"></div><div class="compliance-table-wrap"><table class="compliance-table"><thead><tr><th>Persona</th><th>Cargo / Ruta</th><th>Capacitación</th><th>Progreso</th><th>Vencimiento</th><th>Estado</th></tr></thead><tbody>'+filtered.map(function(r){return '<tr><td><strong>'+A.escape(r.full_name)+'</strong><small>'+A.escape(r.email)+'</small></td><td><strong>'+A.escape(r.position_name)+'</strong><small>'+A.escape(r.path_name)+'</small></td><td>'+A.escape(r.course_title)+'</td><td><div class="mini-progress"><span style="width:'+Number(r.progress_percent||0)+'%"></span></div><small>'+Number(r.progress_percent||0)+'%</small></td><td>'+(r.due_at?A.escape(r.due_at):'—')+'</td><td><span class="compliance-state '+A.escape(r.compliance_state)+'">'+A.escape(complianceStateLabel(r.compliance_state))+'</span></td></tr>';}).join('')+'</tbody></table></div></section>';
    }
    return '<div class="compliance-center">'+top+body+'</div>';
  }

  function certificatesPanel() {
    A.ui.certSearch=A.ui.certSearch||'';
    A.ui.certCourse=A.ui.certCourse||'all';
    A.ui.certScore=A.ui.certScore||'all';
    A.ui.certSort=A.ui.certSort||'rank';
    var q=A.ui.certSearch.toLowerCase();
    var rows=A.state.certificates.slice().filter(function(x){
      var u=A.user(x.user_id),co=A.course(x.course_id);
      var text=((u&&u.full_name)||'')+' '+((u&&u.email)||'')+' '+((co&&co.title)||'')+' '+x.code;
      var courseOk=A.ui.certCourse==='all'||x.course_id===A.ui.certCourse;
      var scoreOk=A.ui.certScore==='all'||(A.ui.certScore==='90plus'?x.score>=90:x.score<90);
      return courseOk&&scoreOk&&(!q||text.toLowerCase().indexOf(q)>=0);
    });
    if(A.ui.certSort==='recent') rows.sort(function(a,b){return new Date(b.issued_at)-new Date(a.issued_at);});
    else if(A.ui.certSort==='old') rows.sort(function(a,b){return new Date(a.issued_at)-new Date(b.issued_at);});
    else if(A.ui.certSort==='scoreHigh'||A.ui.certSort==='rank') rows.sort(function(a,b){return Number(b.score)-Number(a.score);});
    else if(A.ui.certSort==='scoreLow') rows.sort(function(a,b){return Number(a.score)-Number(b.score);});
    else if(A.ui.certSort==='person') rows.sort(function(a,b){return String((A.user(a.user_id)||{}).full_name||'').localeCompare(String((A.user(b.user_id)||{}).full_name||''),'es');});
    else if(A.ui.certSort==='course') rows.sort(function(a,b){return String((A.course(a.course_id)||{}).title||'').localeCompare(String((A.course(b.course_id)||{}).title||''),'es');});
    var detail=A.ui.certDetail?A.state.certificates.find(function(x){return x.code===A.ui.certDetail;}):null;

    return '<div class="certificates-manager-pro certificates-center"><section class="panel-card"><div class="section-title-row"><div><span class="eyebrow">Ranking y certificados</span><h2>Consulta y controla la certificación desde un solo lugar.</h2></div><div class="demo-actions"><button id="refreshCertificates" class="secondary-button">Actualizar</button><button id="exportCertificates" class="secondary-button">Exportar CSV</button></div></div><div class="manager-toolbar four"><div class="search-field"><span>⌕</span><input id="certSearch" placeholder="Persona, curso o código…" value="'+A.escape(A.ui.certSearch)+'"></div><select id="certCourse"><option value="all">Todas las capacitaciones</option>'+A.state.courses.map(function(co){return '<option value="'+A.escape(co.id)+'" '+(A.ui.certCourse===co.id?'selected':'')+'>'+A.escape(co.title)+'</option>';}).join('')+'</select><select id="certScore"><option value="all">Todos los puntajes</option><option value="90plus">90% o más</option><option value="under90">Menos de 90%</option></select><select id="certSort"><option value="rank">Ranking original</option><option value="recent">Más recientes</option><option value="old">Más antiguos</option><option value="scoreHigh">Mayor puntaje</option><option value="scoreLow">Menor puntaje</option><option value="person">Persona A-Z</option><option value="course">Capacitación A-Z</option></select></div><div class="certificate-list">'+(rows.length?rows.map(function(x,i){var u=A.user(x.user_id),co=A.course(x.course_id);return '<article class="certificate-row-card"><div class="certificate-rank">#'+(i+1)+'</div><div class="certificate-main"><b>'+A.escape(u?u.full_name:'Usuario')+'</b><span>'+A.escape(co?co.title:'Capacitación')+'</span><small>'+x.score+'% · '+new Date(x.issued_at).toLocaleDateString('es-CO')+' · '+A.escape(x.code)+'</small></div><div class="certificate-actions"><button class="secondary-button compact cert-detail" data-code="'+A.escape(x.code)+'">Detalle</button><a class="primary-button compact" href="#/certificate/'+encodeURIComponent(x.code)+'">Abrir</a></div></article>';}).join(''):'<div class="demo-empty-mini">No hay certificados con estos filtros.</div>')+'</div></section>' +
      '<section class="panel-card"><span class="eyebrow">Emisión administrativa</span><h3>Regularización autorizada</h3><form id="manualCertForm" class="demo-inline-form"><label>Usuario<select name="user">'+A.state.users.filter(function(u){return u.is_active;}).map(function(u){return '<option value="'+u.id+'">'+A.escape(u.full_name)+'</option>';}).join('')+'</select></label><label>Capacitación<select name="course">'+A.state.courses.map(function(co){return '<option value="'+A.escape(co.id)+'">'+A.escape(co.title)+'</option>';}).join('')+'</select></label><label>Puntaje<input name="score" type="number" min="0" max="100" value="95"></label><button class="primary-button">Emitir certificado</button></form></section>' +
      (detail?'<section class="panel-card certificate-detail-panel"><div class="section-title-row"><div><span class="eyebrow">Detalle del certificado</span><h3>'+A.escape(detail.code)+'</h3></div><button id="closeCertDetail" class="secondary-button compact">Cerrar</button></div><div class="user-detail-metrics"><article><span>Persona</span><strong>'+A.escape((A.user(detail.user_id)||{}).full_name||'Usuario')+'</strong></article><article><span>Capacitación</span><strong>'+A.escape((A.course(detail.course_id)||{}).title||'Capacitación')+'</strong></article><article><span>Puntaje</span><strong>'+detail.score+'%</strong></article><article><span>Emisión</span><strong>'+new Date(detail.issued_at).toLocaleDateString('es-CO')+'</strong></article></div><a class="primary-button" href="#/certificate/'+encodeURIComponent(detail.code)+'">Abrir certificado oficial</a></section>':'')+'</div>';
  }

  function bind() {
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { A.ui.tab = b.getAttribute('data-tab'); A.ui.selectedCourse = null; A.studio(); }; });
    document.querySelectorAll('.edit-course').forEach(function (b) { b.onclick = function () { A.ui.selectedCourse = b.getAttribute('data-id'); A.studio(); }; });
    var back = document.getElementById('backCourses'); if (back) back.onclick = function () { A.ui.selectedCourse = null; A.studio(); };

    var courseSearch=document.getElementById('courseSearch'); if(courseSearch)courseSearch.oninput=function(){A.ui.courseSearch=courseSearch.value;A.studio();};
    var courseStatus=document.getElementById('courseStatusFilter'); if(courseStatus){courseStatus.value=A.ui.courseStatus;courseStatus.onchange=function(){A.ui.courseStatus=courseStatus.value;A.studio();};}

    var nf = document.getElementById('newCourseForm'); if (nf) nf.onsubmit = async function (e) {
      e.preventDefault(); var f = new FormData(nf);
      var id='course-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
      var course={id:id,title:String(f.get('title')),description:String(f.get('description')),status:'draft',passing_score:Number(f.get('passing'))||80,category:String(f.get('category')||'General'),estimated_minutes:Number(f.get('minutes'))||30,cover_url:'',phases:[],questions:[]};
      try{await persistCourse(course,'Capacitación creada: '+course.title);A.state.courses.unshift(course);A.ui.selectedCourse=course.id;A.toast('Capacitación creada como borrador.');A.studio();}catch(err){A.toast(A.errorText(err));}
    };

    var ef=document.getElementById('editCourseForm'); if(ef)ef.onsubmit=async function(e){
      e.preventDefault();var course=A.course(A.ui.selectedCourse),f=new FormData(ef),backup=JSON.parse(JSON.stringify(course));
      course.title=String(f.get('title'));course.description=String(f.get('description'));course.passing_score=Math.max(1,Math.min(100,Number(f.get('passing'))||80));course.category=String(f.get('category')||'General');course.estimated_minutes=Math.max(1,Math.min(1440,Number(f.get('minutes'))||30));course.cover_url=String(f.get('cover_url')||'').trim();course.status=String(f.get('status'));
      try{await persistCourse(course);A.toast('Capacitación actualizada.');A.studio();}catch(err){Object.assign(course,backup);A.toast(A.errorText(err));}
    };

    var coverFile=document.getElementById('coverFile'); if(coverFile)coverFile.onchange=async function(){
      var file=coverFile.files&&coverFile.files[0];if(!file)return;
      if(file.size>5242880){A.toast('La portada supera 5 MB.');return;}
      var course=A.course(A.ui.selectedCourse),ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
      var path='covers/'+course.id+'-'+Date.now()+'.'+ext;
      A.toast('Subiendo portada…');
      try{
        var up=await A.sb.storage.from('aula-course-assets').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
        if(up.error)throw up.error;
        var pub=A.sb.storage.from('aula-course-assets').getPublicUrl(path);
        course.cover_url=pub.data.publicUrl;
        await persistCourse(course,'Portada actualizada: '+course.title);
        A.toast('Portada guardada.');A.studio();
      }catch(err){A.toast(A.errorText(err,'No fue posible subir la portada.'));}
    };

    var pf=document.getElementById('addPhaseForm'); if(pf)pf.onsubmit=async function(e){
      e.preventDefault();var course=A.course(A.ui.selectedCourse),form=new FormData(pf),phase={id:A.uid('phase'),title:String(form.get('title')),blocks:[]};course.phases.push(phase);
      try{await persistCourse(course,'Fase agregada a '+course.title);A.studio();}catch(err){course.phases.pop();A.toast(A.errorText(err));}
    };
    document.querySelectorAll('.move-phase').forEach(function(b){b.onclick=async function(){var course=A.course(A.ui.selectedCourse),backup=JSON.parse(JSON.stringify(course.phases));if(!moveItem(course.phases,Number(b.getAttribute('data-index')),Number(b.getAttribute('data-delta'))))return;try{await persistCourse(course);A.studio();}catch(err){course.phases=backup;A.toast(A.errorText(err));}};});
    document.querySelectorAll('.delete-phase').forEach(function(b){b.onclick=async function(){if(!confirm('¿Eliminar esta fase y todos sus contenidos?'))return;var course=A.course(A.ui.selectedCourse),backup=JSON.parse(JSON.stringify(course.phases)),idx=Number(b.getAttribute('data-index'));course.phases.splice(idx,1);try{await persistCourse(course,'Fase eliminada de '+course.title);A.studio();}catch(err){course.phases=backup;A.toast(A.errorText(err));}};});

    var ab=document.getElementById('addBlockForm'); if(ab)ab.onsubmit=async function(e){
      e.preventDefault();var course=A.course(A.ui.selectedCourse),form=new FormData(ab),pi=Number(form.get('phase'));if(!course.phases[pi])return;
      var block={id:A.uid('block'),title:String(form.get('title')),type:String(form.get('type')),required:form.get('required')==='on',body:String(form.get('body')||''),url:String(form.get('url')||'')};
      course.phases[pi].blocks=course.phases[pi].blocks||[];course.phases[pi].blocks.push(block);
      try{await persistCourse(course,'Contenido agregado a '+course.title);A.toast('Contenido agregado.');A.studio();}catch(err){course.phases[pi].blocks.pop();A.toast(A.errorText(err));}
    };
    document.querySelectorAll('.move-block').forEach(function(b){b.onclick=async function(){var course=A.course(A.ui.selectedCourse),pi=Number(b.getAttribute('data-phase')),bi=Number(b.getAttribute('data-block')),backup=JSON.parse(JSON.stringify(course.phases));if(!moveItem(course.phases[pi].blocks,bi,Number(b.getAttribute('data-delta'))))return;try{await persistCourse(course);A.studio();}catch(err){course.phases=backup;A.toast(A.errorText(err));}};});
    document.querySelectorAll('.delete-block').forEach(function(b){b.onclick=async function(){if(!confirm('¿Eliminar este contenido?'))return;var course=A.course(A.ui.selectedCourse),backup=JSON.parse(JSON.stringify(course.phases)),id=b.getAttribute('data-id');course.phases.forEach(function(p){p.blocks=(p.blocks||[]).filter(function(x){return x.id!==id;});});try{await persistCourse(course,'Contenido eliminado de '+course.title);A.studio();}catch(err){course.phases=backup;A.toast(A.errorText(err));}};});

    var qf=document.getElementById('addQuestionForm'); if(qf)qf.onsubmit=async function(e){
      e.preventDefault();var course=A.course(A.ui.selectedCourse);if(course.questions.length>=10){A.toast('El examen ya tiene 10 preguntas.');return;}var form=new FormData(qf);var q={id:A.uid('q'),prompt:String(form.get('prompt')),options:[String(form.get('a')),String(form.get('b')),String(form.get('c')),String(form.get('d'))],correct:Number(form.get('correct'))};course.questions.push(q);try{await persistCourse(course,'Pregunta agregada a '+course.title);A.studio();}catch(err){course.questions.pop();A.toast(A.errorText(err));}
    };
    document.querySelectorAll('.delete-question').forEach(function(b){b.onclick=async function(){var course=A.course(A.ui.selectedCourse),backup=course.questions.slice();course.questions.splice(Number(b.getAttribute('data-index')),1);try{await persistCourse(course);A.studio();}catch(err){course.questions=backup;A.toast(A.errorText(err));}};});
    document.querySelectorAll('.move-question').forEach(function(b){b.onclick=async function(){var course=A.course(A.ui.selectedCourse),backup=course.questions.slice();if(!moveItem(course.questions,Number(b.getAttribute('data-index')),Number(b.getAttribute('data-delta'))))return;try{await persistCourse(course);A.studio();}catch(err){course.questions=backup;A.toast(A.errorText(err));}};});

    var importQuestions=document.getElementById('importQuestions');if(importQuestions)importQuestions.onclick=async function(){
      var course=A.course(A.ui.selectedCourse),area=document.getElementById('questionImportText'),lines=String(area.value||'').split(/\r?\n/).map(function(x){return x.trim();}).filter(Boolean),parsed=[];
      lines.forEach(function(line){var p=line.split(';').map(function(x){return x.trim();});if(p.length<6)return;var raw=String(p[5]).toUpperCase(),correct=/^[1-4]$/.test(raw)?Number(raw)-1:['A','B','C','D'].indexOf(raw);if(correct<0)return;parsed.push({id:A.uid('q'),prompt:p[0],options:p.slice(1,5),correct:correct});});
      if(!parsed.length){A.toast('No se encontraron preguntas válidas.');return;}if(course.questions.length+parsed.length>10){A.toast('La importación supera el máximo de 10 preguntas.');return;}
      var backup=course.questions.slice();course.questions=course.questions.concat(parsed);try{await persistCourse(course,'Preguntas importadas a '+course.title);A.toast(parsed.length+' preguntas importadas.');A.studio();}catch(err){course.questions=backup;A.toast(A.errorText(err));}
    };
    var qTemplate=document.getElementById('downloadQuestionTemplate');if(qTemplate)qTemplate.onclick=function(){downloadText('plantilla-preguntas-aula.csv','Pregunta;Opción A;Opción B;Opción C;Opción D;Correcta\\n; ; ; ; ;A','text/csv;charset=utf-8');};
    var qExport=document.getElementById('exportQuestions');if(qExport)qExport.onclick=function(){var course=A.course(A.ui.selectedCourse);var rows=['Pregunta;Opción A;Opción B;Opción C;Opción D;Correcta'].concat(course.questions.map(function(q){return [q.prompt].concat(q.options||[]).concat([['A','B','C','D'][Number(q.correct)]||'A']).join(';');}));downloadText('preguntas-'+course.id+'.csv',rows.join('\\n'),'text/csv;charset=utf-8');};

    var assignmentCourse=document.getElementById('assignmentCourse');if(assignmentCourse)assignmentCourse.onchange=function(){A.ui.assignmentCourse=assignmentCourse.value;A.ui.selectedAssignmentUsers=[];A.studio();};
    var assignmentSearch=document.getElementById('assignmentSearch');if(assignmentSearch)assignmentSearch.oninput=function(){A.ui.assignmentSearch=assignmentSearch.value;A.studio();};
    var assignmentRole=document.getElementById('assignmentRole');if(assignmentRole)assignmentRole.onchange=function(){A.ui.assignmentRole=assignmentRole.value;A.studio();};
    var assignmentState=document.getElementById('assignmentState');if(assignmentState){assignmentState.value=A.ui.assignmentState;assignmentState.onchange=function(){A.ui.assignmentState=assignmentState.value;A.studio();};}
    document.querySelectorAll('.assignment-user-check').forEach(function(x){x.onchange=function(){var set=new Set(A.ui.selectedAssignmentUsers||[]);if(x.checked)set.add(x.value);else set.delete(x.value);A.ui.selectedAssignmentUsers=Array.from(set);A.studio();};});
    var selectFiltered=document.getElementById('selectFilteredUsers');if(selectFiltered)selectFiltered.onclick=function(){var set=new Set(A.ui.selectedAssignmentUsers||[]);document.querySelectorAll('.assignment-user-check').forEach(function(x){set.add(x.value);});A.ui.selectedAssignmentUsers=Array.from(set);A.studio();};
    var clearAssign=document.getElementById('clearAssignmentSelection');if(clearAssign)clearAssign.onclick=function(){A.ui.selectedAssignmentUsers=[];A.studio();};
    function selectEmails(text){var emails=String(text||'').toLowerCase().split(/[\s,;]+/).filter(function(x){return x.indexOf('@')>0;});var set=new Set(A.ui.selectedAssignmentUsers||[]);A.state.users.forEach(function(u){if(emails.indexOf(String(u.email).toLowerCase())>=0)set.add(u.id);});A.ui.selectedAssignmentUsers=Array.from(set);A.studio();}
    var selectBy=document.getElementById('selectByEmails');if(selectBy)selectBy.onclick=function(){selectEmails(document.getElementById('assignmentEmails').value);};
    var assignmentFile=document.getElementById('assignmentFile');if(assignmentFile)assignmentFile.onchange=function(){var file=assignmentFile.files&&assignmentFile.files[0];if(!file)return;var reader=new FileReader();reader.onload=function(){selectEmails(reader.result);};reader.readAsText(file);};
    var assignmentTpl=document.getElementById('downloadAssignmentTemplate');if(assignmentTpl)assignmentTpl.onclick=function(){downloadText('plantilla-asignacion-aula.csv','correo\\nusuario@sanpedro-valle.gov.co','text/csv;charset=utf-8');};
    var bulkAssign=document.getElementById('bulkAssignBtn');if(bulkAssign)bulkAssign.onclick=async function(){var ids=A.ui.selectedAssignmentUsers||[],course=A.ui.assignmentCourse||document.getElementById('assignmentCourse').value,due=document.getElementById('bulkDueDate').value||null;bulkAssign.disabled=true;try{var r=await A.rpc('aula_bulk_assign_course',{p_user_ids:ids,p_course_id:course,p_due_at:due});await A.refresh();A.ui.selectedAssignmentUsers=[];A.toast((r.count||0)+' asignaciones procesadas.');A.studio();}catch(err){A.toast(A.errorText(err));bulkAssign.disabled=false;}};
    document.querySelectorAll('.delete-assignment').forEach(function(b){b.onclick=async function(){var id=b.getAttribute('data-id');try{await A.rpc('aula_unassign_course',{p_assignment_id:id});A.state.assignments=A.state.assignments.filter(function(a){return a.id!==id;});A.toast('Matrícula cancelada; progreso histórico conservado.');A.studio();}catch(err){A.toast(A.errorText(err));}};});

    var userSearch=document.getElementById('userSearch');if(userSearch)userSearch.oninput=function(){A.ui.userSearch=userSearch.value;A.studio();};
    var userRole=document.getElementById('userRoleFilter');if(userRole)userRole.onchange=function(){A.ui.userRoleFilter=userRole.value;A.studio();};
    var userState=document.getElementById('userStateFilter');if(userState){userState.value=A.ui.userStateFilter;userState.onchange=function(){A.ui.userStateFilter=userState.value;A.studio();};}
    document.querySelectorAll('.member-check').forEach(function(x){x.onchange=function(){var set=new Set(A.ui.selectedUsers||[]);if(x.checked)set.add(x.value);else set.delete(x.value);A.ui.selectedUsers=Array.from(set);A.studio();};});
    var selectMembers=document.getElementById('selectFilteredMembers');if(selectMembers)selectMembers.onclick=function(){var set=new Set(A.ui.selectedUsers||[]);document.querySelectorAll('.member-check:not(:disabled)').forEach(function(x){set.add(x.value);});A.ui.selectedUsers=Array.from(set);A.studio();};
    var clearMembers=document.getElementById('clearMemberSelection');if(clearMembers)clearMembers.onclick=function(){A.ui.selectedUsers=[];A.studio();};
    async function bulkMemberState(active){try{var r=await A.rpc('aula_bulk_set_member_active',{p_user_ids:A.ui.selectedUsers||[],p_active:active});await A.refresh();A.ui.selectedUsers=[];A.toast((r.count||0)+' cuentas actualizadas.');A.studio();}catch(err){A.toast(A.errorText(err));}}
    var bulkRe=document.getElementById('bulkReactivate');if(bulkRe)bulkRe.onclick=function(){bulkMemberState(true);};
    var bulkDe=document.getElementById('bulkDeactivate');if(bulkDe)bulkDe.onclick=function(){if(confirm('¿Desactivar las membresías seleccionadas solo dentro del Aula?'))bulkMemberState(false);};
    var exportUsers=document.getElementById('exportUsers');if(exportUsers)exportUsers.onclick=function(){var rows=['Nombre,Correo,Rol,Estado'].concat(A.state.users.map(function(u){return [csvCell(u.full_name),csvCell(u.email),csvCell(roleLabel(u.role)),csvCell(u.is_active?'Activo':'Inactivo')].join(',');}));downloadText('usuarios-aula-san-pedro.csv',rows.join('\\n'),'text/csv;charset=utf-8');};
    document.querySelectorAll('[data-user-detail]').forEach(function(b){b.onclick=function(){A.ui.userDetail=b.getAttribute('data-user-detail');A.studio();};});
    var closeUser=document.getElementById('closeUserDetail');if(closeUser)closeUser.onclick=function(){A.ui.userDetail=null;A.studio();};

    var copyCredential=document.getElementById('copyCredential');if(copyCredential)copyCredential.onclick=async function(){var c=A.ui.tempCredential;if(!c)return;try{await navigator.clipboard.writeText(c.password);A.toast('Contraseña copiada.');}catch(_){A.toast('No fue posible copiar automáticamente.');}};
    var dismissCredential=document.getElementById('dismissCredential');if(dismissCredential)dismissCredential.onclick=function(){A.ui.tempCredential=null;A.studio();};

    var uf=document.getElementById('newUserForm');if(uf)uf.onsubmit=async function(e){
      e.preventDefault();
      var f=new FormData(uf),name=String(f.get('name')).trim(),email=String(f.get('email')).trim().toLowerCase(),role=String(f.get('role')),btn=document.getElementById('createUserBtn');
      btn.disabled=true;btn.textContent='Procesando…';
      try{
        var linked=await A.rpc('aula_add_existing_user',{p_email:email,p_full_name:name,p_role:role});
        var user;
        if(linked&&linked.found){
          user={id:linked.user_id,full_name:name,email:email,role:role,is_active:true,must_change_password:false};
          A.toast('Cuenta Auth existente vinculada al Aula.');
        }else{
          var created=await A.invoke('aula-admin-users',{action:'create_user',email:email,full_name:name,role:role});
          user={id:created.user.id,full_name:name,email:email,role:role,is_active:true,must_change_password:true};
          A.ui.tempCredential={user_id:user.id,email:email,password:created.temporary_password};
          A.toast('Usuario creado con contraseña temporal.');
        }
        var pos=A.state.users.findIndex(function(u){return u.id===user.id;});if(pos>=0)A.state.users[pos]=user;else A.state.users.push(user);
        A.ui.userDetail=user.id;
        A.studio();
      }catch(err){A.toast(A.errorText(err));}
      finally{btn.disabled=false;btn.innerHTML=A.icon('briefcase',16)+' Vincular / crear';}
    };

    document.querySelectorAll('.role-change').forEach(function(s){s.onchange=async function(){
      var u=A.user(s.getAttribute('data-id')),old=u.role,next=s.value;
      try{
        await A.invoke('aula-admin-users',{action:'update_role',user_id:u.id,role:next});
        u.role=next;A.toast('Rol actualizado.');A.studio();
      }catch(err){s.value=old;A.toast(A.errorText(err));}
    };});

    async function setSingleUserActive(id,active){
      var u=A.user(id);if(!u)return;
      try{
        await A.invoke('aula-admin-users',{action:'set_active',user_id:id,active:active});
        u.is_active=active;
        A.toast(active?'Usuario reactivado en Aula.':'Usuario desactivado en Aula; Auth compartido conservado.');
        A.studio();
      }catch(err){A.toast(A.errorText(err));}
    }
    document.querySelectorAll('.toggle-user').forEach(function(b){b.onclick=function(){var u=A.user(b.getAttribute('data-id'));if(u)setSingleUserActive(u.id,!u.is_active);};});
    var detailToggle=document.getElementById('detailToggleUser');if(detailToggle)detailToggle.onclick=function(){var u=A.user(detailToggle.getAttribute('data-id'));if(u)setSingleUserActive(u.id,!u.is_active);};

    var profileForm=document.getElementById('editUserProfileForm');if(profileForm)profileForm.onsubmit=async function(e){
      e.preventDefault();var detail=A.user(A.ui.userDetail),f=new FormData(profileForm),name=String(f.get('full_name')).trim(),role=String(f.get('role'));
      var btn=profileForm.querySelector('button[type=submit]');btn.disabled=true;
      try{
        if(name!==detail.full_name){
          await A.invoke('aula-admin-users',{action:'update_profile',user_id:detail.id,full_name:name});
          detail.full_name=name;
        }
        if(role!==detail.role){
          await A.invoke('aula-admin-users',{action:'update_role',user_id:detail.id,role:role});
          detail.role=role;
        }
        A.toast('Perfil y permisos actualizados.');A.studio();
      }catch(err){A.toast(A.errorText(err));btn.disabled=false;}
    };

    var resetPassword=document.getElementById('resetUserPassword');if(resetPassword)resetPassword.onclick=async function(){
      var u=A.user(resetPassword.getAttribute('data-id'));if(!u)return;
      if(!confirm('Se generará una contraseña temporal nueva para '+u.email+'. ¿Continuar?'))return;
      resetPassword.disabled=true;
      try{
        var r=await A.invoke('aula-admin-users',{action:'reset_password',user_id:u.id});
        A.ui.tempCredential={user_id:u.id,email:u.email,password:r.temporary_password};
        u.must_change_password=true;
        A.toast('Contraseña temporal generada.');A.studio();
      }catch(err){A.toast(A.errorText(err));resetPassword.disabled=false;}
    };

    var deleteAuth=document.getElementById('deleteUserAuth');if(deleteAuth)deleteAuth.onclick=async function(){
      var u=A.user(deleteAuth.getAttribute('data-id'));if(!u)return;
      var email=deleteAuth.getAttribute('data-email')||u.email;
      var typed=prompt('ELIMINACIÓN DEFINITIVA DE AUTH.\n\nEsta operación solo funcionará si la cuenta fue creada exclusivamente por Aula y no tiene referencias en otros sistemas.\n\nEscribe exactamente el correo para confirmar:\n'+email);
      if(typed===null)return;
      if(String(typed).trim().toLowerCase()!==String(email).toLowerCase()){A.toast('El correo de confirmación no coincide.');return;}
      deleteAuth.disabled=true;
      try{
        await A.invoke('aula-admin-users',{action:'delete_auth_user',user_id:u.id,confirm_email:typed});
        A.state.users=A.state.users.filter(function(x){return x.id!==u.id;});
        A.ui.userDetail=null;A.ui.tempCredential=null;
        await A.refresh();
        A.toast('Cuenta Auth eliminada definitivamente.');A.studio();
      }catch(err){A.toast(A.errorText(err));deleteAuth.disabled=false;}
    };

    document.querySelectorAll('[data-compliance-section]').forEach(function(b){b.onclick=function(){A.ui.complianceSection=b.getAttribute('data-compliance-section');A.studio();};});
    document.querySelectorAll('[data-position-id]').forEach(function(b){b.onclick=function(){A.ui.selectedPosition=b.getAttribute('data-position-id');A.studio();};});
    document.querySelectorAll('[data-path-id]').forEach(function(b){b.onclick=function(){A.ui.selectedPath=b.getAttribute('data-path-id');A.studio();};});
    var np=document.getElementById('newPositionForm');if(np)np.onsubmit=async function(e){e.preventDefault();var x=new FormData(np);try{await A.rpc('aula_training_save_position',{p_item:{name:String(x.get('name')),department:String(x.get('department')||''),position_type:'cargo'}});await A.loadTrainingAdmin(true);A.toast('Cargo creado.');A.studio();}catch(err){A.toast(A.errorText(err));}};
    var nc=document.getElementById('newCompetencyForm');if(nc)nc.onsubmit=async function(e){e.preventDefault();var x=new FormData(nc);try{await A.rpc('aula_training_save_competency',{p_item:{name:String(x.get('name')),category:String(x.get('category')),description:String(x.get('description')||'')}});await A.loadTrainingAdmin(true);A.toast('Competencia creada.');A.studio();}catch(err){A.toast(A.errorText(err));}};
    var npath=document.getElementById('newPathForm');if(npath)npath.onsubmit=async function(e){e.preventDefault();var x=new FormData(npath);try{var r=await A.rpc('aula_training_save_path',{p_item:{name:String(x.get('name')),description:String(x.get('description')||''),version:1}});A.ui.selectedPath=r.id;await A.loadTrainingAdmin(true);A.toast('Ruta creada.');A.studio();}catch(err){A.toast(A.errorText(err));}};
    document.querySelectorAll('.person-position').forEach(function(s){s.onchange=async function(){try{await A.rpc('aula_training_set_user_position',{p_user_id:s.getAttribute('data-user'),p_position_id:s.value||null,p_reason:'Actualización desde Gestión Aula'});await A.loadTrainingAdmin(true);await A.refresh();A.toast('Cargo y rutas actualizados.');A.studio();}catch(err){A.toast(A.errorText(err));}};});
    document.querySelectorAll('.position-path-toggle').forEach(function(x){x.onchange=async function(){try{await A.rpc('aula_training_set_position_path',{p_position_id:x.getAttribute('data-position'),p_path_id:x.getAttribute('data-path'),p_enabled:x.checked,p_due_days:30,p_recertification_months:null});await A.loadTrainingAdmin(true);await A.refresh();A.toast('Ruta del cargo actualizada.');A.studio();}catch(err){x.checked=!x.checked;A.toast(A.errorText(err));}};});
    document.querySelectorAll('.position-competency-toggle').forEach(function(x){x.onchange=async function(){try{await A.rpc('aula_training_set_position_competency',{p_position_id:x.getAttribute('data-position'),p_competency_id:x.getAttribute('data-competency'),p_enabled:x.checked,p_required_level:1,p_weight:1});await A.loadTrainingAdmin(true);A.toast('Matriz de competencias actualizada.');A.studio();}catch(err){x.checked=!x.checked;A.toast(A.errorText(err));}};});
    document.querySelectorAll('.path-course-toggle').forEach(function(x){x.onchange=async function(){try{await A.rpc('aula_training_set_path_course',{p_path_id:x.getAttribute('data-path'),p_course_id:x.getAttribute('data-course'),p_enabled:x.checked,p_sort_order:100,p_due_days:30,p_recertification_months:12});await A.loadTrainingAdmin(true);await A.refresh();A.toast('Contenido de la ruta actualizado.');A.studio();}catch(err){x.checked=!x.checked;A.toast(A.errorText(err));}};});
    document.querySelectorAll('.rule-toggle').forEach(function(x){x.onchange=async function(){try{await A.rpc('aula_training_set_rule_active',{p_rule_id:x.getAttribute('data-rule'),p_active:x.checked});await A.loadTrainingAdmin(true);A.toast('Automatización actualizada.');A.studio();}catch(err){x.checked=!x.checked;A.toast(A.errorText(err));}};});
    var sync=document.getElementById('syncTrainingEngine');if(sync)sync.onclick=async function(){sync.disabled=true;try{await A.rpc('aula_training_sync_all');await A.loadTrainingAdmin(true);await A.refresh();A.toast('Motor sincronizado.');A.studio();}catch(err){A.toast(A.errorText(err));sync.disabled=false;}};
    var cps=document.getElementById('competencyPositionSelect');if(cps)cps.onchange=function(){A.ui.selectedPosition=cps.value;A.studio();};
    var cs=document.getElementById('complianceSearch');if(cs)cs.oninput=function(){A.ui.complianceQuery=cs.value;A.studio();};

    var certSearch=document.getElementById('certSearch');if(certSearch)certSearch.oninput=function(){A.ui.certSearch=certSearch.value;A.studio();};
    var certCourse=document.getElementById('certCourse');if(certCourse)certCourse.onchange=function(){A.ui.certCourse=certCourse.value;A.studio();};
    var certScore=document.getElementById('certScore');if(certScore){certScore.value=A.ui.certScore;certScore.onchange=function(){A.ui.certScore=certScore.value;A.studio();};}
    var certSort=document.getElementById('certSort');if(certSort){certSort.value=A.ui.certSort;certSort.onchange=function(){A.ui.certSort=certSort.value;A.studio();};}
    var refreshCert=document.getElementById('refreshCertificates');if(refreshCert)refreshCert.onclick=async function(){await A.refresh();A.toast('Certificados actualizados.');A.studio();};
    var exportCert=document.getElementById('exportCertificates');if(exportCert)exportCert.onclick=function(){var rows=['Persona,Correo,Capacitación,Puntaje,Fecha,Código'].concat(A.state.certificates.map(function(x){var u=A.user(x.user_id),co=A.course(x.course_id);return [csvCell(u?u.full_name:''),csvCell(u?u.email:''),csvCell(co?co.title:''),x.score,csvCell(new Date(x.issued_at).toLocaleDateString('es-CO')),csvCell(x.code)].join(',');}));downloadText('certificados-aula-san-pedro.csv',rows.join('\\n'),'text/csv;charset=utf-8');};
    document.querySelectorAll('.cert-detail').forEach(function(b){b.onclick=function(){A.ui.certDetail=b.getAttribute('data-code');A.studio();};});
    var closeCert=document.getElementById('closeCertDetail');if(closeCert)closeCert.onclick=function(){A.ui.certDetail=null;A.studio();};
    var cf=document.getElementById('manualCertForm');if(cf)cf.onsubmit=async function(e){e.preventDefault();var f=new FormData(cf),uid=String(f.get('user')),cid=String(f.get('course')),score=Math.max(0,Math.min(100,Number(f.get('score'))||0));try{var r=await A.rpc('aula_issue_certificate',{p_user_id:uid,p_course_id:cid,p_score:score});var existing=A.cert(uid,cid);if(!existing)A.state.certificates.push({id:A.uid('cert'),code:r.code,user_id:uid,course_id:cid,score:score,issued_at:new Date().toISOString()});A.toast('Certificado emitido.');A.studio();}catch(err){A.toast(A.errorText(err));}};
  }

  A.studio = function () {
    if (!A.canManage()) { location.hash = '#/'; return; }
    if (!A.canManageUsers() && A.ui.tab !== 'courses') A.ui.tab = 'courses';

    var body = A.ui.tab === 'courses' ? coursePanel() : A.ui.tab === 'assignments' ? assignmentsPanel() : A.ui.tab === 'users' ? usersPanel() : A.ui.tab === 'compliance' ? compliancePanel() : certificatesPanel();
    var published=A.state.courses.filter(function(x){return x.status==='published';}).length;
    var activeUsers=A.state.users.filter(function(x){return x.is_active;}).length;
    var activeAssignments=A.state.assignments.length;
    var certificates=A.state.certificates.length;

    var html =
      '<main class="page admin-page studio-single-page integrated-studio">' +
        '<section class="admin-hero integrated-admin-hero studio-executive-hero">' +
          '<div class="studio-hero-motion" aria-hidden="true"><i></i><i></i><i></i></div>' +
          '<div class="studio-hero-copy"><span class="eyebrow-light">' + A.icon('shield',16) + ' Gestión Aula · San Pedro</span><h1>Administra formación, cumplimiento y evidencia.</h1><p>Diseña capacitaciones, asigna rutas, administra usuarios y convierte el progreso institucional en información verificable.</p></div>' +
          '<div class="admin-role"><span class="admin-role-icon">' + A.icon('shield',22) + '</span><strong>' + A.escape(roleLabel(A.profile.role)) + '</strong><small>Rol activo</small></div>' +
        '</section>' +

        '<section class="studio-kpi-strip">' +
          '<article><span>' + A.icon('book',20) + '</span><div><small>Publicadas</small><strong>' + published + '</strong></div></article>' +
          '<article><span>' + A.icon('briefcase',20) + '</span><div><small>Usuarios activos</small><strong>' + activeUsers + '</strong></div></article>' +
          '<article><span>' + A.icon('target',20) + '</span><div><small>Asignaciones</small><strong>' + activeAssignments + '</strong></div></article>' +
          '<article><span>' + A.icon('trophy',20) + '</span><div><small>Certificados</small><strong>' + certificates + '</strong></div></article>' +
        '</section>' +

        '<div class="studio-control-row">' + tabs() + '<button type="button" id="studioRefresh" class="secondary-button compact studio-refresh">' + A.icon('refresh',16) + ' Actualizar</button></div>' +
        '<div class="studio-tab-stage">' + body + '</div>' +
      '</main>';

    document.getElementById('root').innerHTML = A.shell(html);
    A.bindShell();
    bind();

    var refresh=document.getElementById('studioRefresh');
    if(refresh)refresh.onclick=async function(){
      refresh.disabled=true;
      refresh.classList.add('is-syncing');
      try{
        await A.refresh();
        if(A.ui.tab==='compliance') await A.loadTrainingAdmin(true);
        A.toast('Gestión Aula actualizada.');
        A.studio();
      }catch(err){
        A.toast(A.errorText(err));
        refresh.disabled=false;
        refresh.classList.remove('is-syncing');
      }
    };

    if (A.ui.tab === 'compliance' && !A.trainingAdmin && !A.ui.trainingAdminLoading) {
      A.ui.trainingAdminLoading = true;
      A.loadTrainingAdmin().then(function(){ A.ui.trainingAdminLoading=false; if(A.ui.tab==='compliance')A.studio(); }).catch(function(err){ A.ui.trainingAdminLoading=false; A.toast(A.errorText(err)); });
    }
  };
})(window);
