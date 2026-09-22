(function (w) {
  var root=document.documentElement;
  var ua=navigator.userAgent||'';
  var isIOS=/iPad|iPhone|iPod/.test(ua) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  var isAndroid=/Android/.test(ua);
  var isStandalone=(w.matchMedia&&w.matchMedia('(display-mode: standalone)').matches)||!!navigator.standalone;

  root.classList.toggle('is-ios',isIOS);
  root.classList.toggle('is-android',isAndroid);
  root.classList.toggle('is-standalone',isStandalone);
  if((w.matchMedia&&w.matchMedia('(pointer: coarse)').matches)||isIOS||isAndroid) root.classList.add('is-touch-device');

  function syncViewport(){
    var vv=w.visualViewport;
    var height=vv?vv.height:w.innerHeight;
    root.style.setProperty('--app-height',Math.round(height)+'px');
    root.style.setProperty('--app-vh',(height*.01)+'px');
    var keyboardOpen=!!(vv && w.innerHeight-height>140);
    root.classList.toggle('mobile-keyboard-open',keyboardOpen);
  }
  syncViewport();
  w.addEventListener('resize',syncViewport,{passive:true});
  w.addEventListener('orientationchange',function(){setTimeout(syncViewport,120);},{passive:true});
  if(w.visualViewport){
    w.visualViewport.addEventListener('resize',syncViewport,{passive:true});
    w.visualViewport.addEventListener('scroll',syncViewport,{passive:true});
  }

  w.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();
    w.__aulaInstallPrompt=e;
  });
  w.addEventListener('appinstalled',function(){
    w.__aulaInstallPrompt=null;
    root.classList.add('is-standalone');
  });

  if('serviceWorker' in navigator){
    w.addEventListener('load',function(){
      navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(function(err){
        console.warn('Aula: service worker no disponible.',err);
      });
    });
  }

  w.AulaRender = function () {
    var A = w.AulaDemo;
    if (!A.logged()) { A.loginView(); return; }
    if (!A.profile) { A.loadingView('Preparando tu Aula…'); return; }
    if (A.profile.must_change_password) { A.passwordChangeView(); return; }
    var p = A.route();
    if (p.length === 0) A.dashboard();
    else if (p[0] === 'catalog') A.catalog();
    else if (p[0] === 'course' && p[1]) A.courseView(decodeURIComponent(p[1]));
    else if (p[0] === 'games') A.games();
    else if (p[0] === 'studio') A.studio();
    else if (p[0] === 'certificate' && p[1]) A.certificateView(decodeURIComponent(p[1]));
    else { location.hash = '#/'; A.dashboard(); }
    requestAnimationFrame(syncViewport);
  };
  w.addEventListener('hashchange', w.AulaRender);
  document.addEventListener('DOMContentLoaded', async function () {
    try { await w.AulaDemo.init(); w.AulaRender(); }
    catch (err) { w.AulaDemo.loginView(w.AulaDemo.errorText(err, 'No fue posible conectar con Supabase.')); }
  });
})(window);
