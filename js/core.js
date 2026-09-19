(function(w){
var A=w.AulaDemo=w.AulaDemo||{};
A.KEY='aula_demo_state_v2';A.SESSION='aula_demo_session_v1';
A.ui={tab:'courses',selectedCourse:null,selectedBlock:{},examCourse:null,lastExam:null};
A.uid=function(prefix){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);};
A.escape=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];});};
A.load=function(){try{var raw=localStorage.getItem(A.KEY);if(!raw)throw 0;var parsed=JSON.parse(raw);if(!parsed||!parsed.courses)throw 0;return parsed;}catch(e){var fresh=w.AulaDemoDefaults();localStorage.setItem(A.KEY,JSON.stringify(fresh));return fresh;}};
A.state=A.load();
A.save=function(){localStorage.setItem(A.KEY,JSON.stringify(A.state));};
A.reset=function(){A.state=w.AulaDemoDefaults();A.save();A.ui={tab:'courses',selectedCourse:null,selectedBlock:{},examCourse:null,lastExam:null};};
A.log=function(text){A.state.activity.unshift({id:A.uid('ev'),at:new Date().toISOString(),text:text});A.state.activity=A.state.activity.slice(0,30);A.save();};
A.toast=function(message){var old=document.querySelector('.demo-toast');if(old)old.remove();var el=document.createElement('div');el.className='demo-toast';el.textContent=message;document.body.appendChild(el);setTimeout(function(){el.remove();},2400);};
A.route=function(){return (location.hash||'#/').replace(/^#/,'').split('?')[0].split('/').filter(Boolean);};
A.logged=function(){return sessionStorage.getItem(A.SESSION)==='1';};
A.login=function(){sessionStorage.setItem(A.SESSION,'1');};
A.logout=function(){sessionStorage.removeItem(A.SESSION);};
A.user=function(id){return A.state.users.find(function(u){return u.id===(id||'u-admin');});};
A.course=function(id){return A.state.courses.find(function(c){return c.id===id;});};
A.flatten=function(c){var out=[];(c.phases||[]).forEach(function(p){(p.blocks||[]).forEach(function(b){out.push({phase:p,block:b});});});return out;};
A.progress=function(uid,cid){A.state.progress[uid]=A.state.progress[uid]||{};A.state.progress[uid][cid]=A.state.progress[uid][cid]||[];return A.state.progress[uid][cid];};
A.percent=function(uid,c){var req=A.flatten(c).filter(function(x){return x.block.required;});if(!req.length)return 0;var done=A.progress(uid,c.id);return Math.round(req.filter(function(x){return done.indexOf(x.block.id)>=0;}).length/req.length*100);};
A.cert=function(uid,cid){return A.state.certificates.find(function(c){return c.user_id===uid&&c.course_id===cid;});};
A.assigned=function(uid){return A.state.assignments.filter(function(a){return a.user_id===uid;}).map(function(a){return{assignment:a,course:A.course(a.course_id)};}).filter(function(x){return x.course&&x.course.status==='published';});};
A.nav=function(name){var p=A.route();return (name==='home'&&p.length===0)||(p[0]===name)?'active':'';};
A.shell=function(content){var u=A.user();return '<div class="app-shell"><header class="demo-topbar">'+
'<a href="#/" class="demo-brand-inline" style="text-decoration:none"><span class="demo-brand-mark">A</span><span>Aula de Formación<small style="display:block;font-weight:600;color:#718096">DEMO</small></span></a>'+
'<nav class="demo-nav"><a class="'+A.nav('home')+'" href="#/">Inicio</a><a class="'+A.nav('catalog')+'" href="#/catalog">Mis capacitaciones</a><a class="'+A.nav('games')+'" href="#/games">Juegos</a><a class="'+A.nav('studio')+'" href="#/studio">Gestión</a><button id="logoutBtn">Cerrar sesión</button></nav>'+
'<div><strong>'+A.escape(u.full_name)+'</strong><small style="display:block;color:#718096">'+A.escape(u.role)+'</small></div></header><main class="demo-main">'+content+'</main></div>';};
A.bindShell=function(){var b=document.getElementById('logoutBtn');if(b)b.onclick=function(){A.logout();w.AulaRender();};};
A.loginView=function(){
 var keyUser=['ad','min'].join(''), keyPass=['admin','1234'].join('');
 document.getElementById('root').innerHTML='<main class="auth-page"><section class="auth-hero"><div class="demo-brand-mark">A</div><span class="eyebrow-light">Aula corporativa · versión demostrativa</span><h1>Crea, asigna y certifica capacitaciones desde una sola experiencia.</h1><p>Rutas secuenciales, contenidos, juegos, evaluación, progreso, certificados y gestión administrativa sin base de datos.</p><div class="auth-feature-grid"><div><strong>Rutas secuenciales</strong><span>El usuario avanza al completar contenidos obligatorios.</span></div><div><strong>Demo editable</strong><span>Los cambios se guardan solo en este navegador.</span></div></div></section>'+
 '<section class="auth-panel"><form class="auth-form" id="loginForm"><div><span class="eyebrow">Acceso a la plataforma</span><h2>Iniciar sesión</h2><p>Utiliza las credenciales de demostración.</p></div><label>Usuario<input id="loginUser" autocomplete="username" required></label><label>Contraseña<input id="loginPass" type="password" autocomplete="current-password" required></label><button class="primary-button">Ingresar</button><div class="demo-login-hint"><strong>Acceso demo</strong><br>Usuario: <b>'+keyUser+'</b><br>Contraseña: <b>'+keyPass+'</b></div><p id="loginMessage" class="warning-message" style="display:none"></p></form></section></main>';
 document.getElementById('loginForm').onsubmit=function(e){e.preventDefault();var ok=document.getElementById('loginUser').value.trim()===keyUser&&document.getElementById('loginPass').value===keyPass;if(ok){A.login();location.hash='#/';w.AulaRender();}else{var m=document.getElementById('loginMessage');m.style.display='block';m.textContent='Credenciales incorrectas. Usa el acceso demo mostrado arriba.';}};
};
})(window);