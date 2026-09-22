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

  var motionReduced=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionBound=false;

  function bindMotionEngine(){
    if(motionBound)return;
    motionBound=true;

    document.addEventListener('pointerdown',function(ev){
      if(motionReduced)return;
      var el=ev.target&&ev.target.closest&&ev.target.closest('button,a,.pushable,.home-course-card,.catalog-course-card,.games-grid article');
      if(!el||el.hasAttribute('disabled'))return;
      el.classList.add('is-pressing');
      setTimeout(function(){el.classList.remove('is-pressing');},180);
      if(el.matches('button,.pushable,.primary-button,.secondary-button,a.home-yellow-button,a.catalog-original-yellow')){
        var rect=el.getBoundingClientRect(),ripple=document.createElement('i');
        ripple.className='motion-ripple';
        var size=Math.max(rect.width,rect.height)*1.35;
        ripple.style.width=size+'px';ripple.style.height=size+'px';
        ripple.style.left=(ev.clientX-rect.left-size/2)+'px';
        ripple.style.top=(ev.clientY-rect.top-size/2)+'px';
        el.appendChild(ripple);
        setTimeout(function(){ripple.remove();},650);
      }
    },{passive:true});

    var raf=0;
    document.addEventListener('pointermove',function(ev){
      if(motionReduced||w.innerWidth<901)return;
      if(raf)return;
      raf=requestAnimationFrame(function(){
        raf=0;
        document.documentElement.style.setProperty('--pointer-x',(ev.clientX/w.innerWidth-.5).toFixed(3));
        document.documentElement.style.setProperty('--pointer-y',(ev.clientY/w.innerHeight-.5).toFixed(3));
      });
    },{passive:true});
  }

  function activatePageMotion(){
    bindMotionEngine();
    var root=document.querySelector('.learner-route-transition');
    if(root){
      root.classList.remove('route-motion-in');
      void root.offsetWidth;
      root.classList.add('route-motion-in');
    }
    if(motionReduced)return;
    var nodes=document.querySelectorAll('.home-metric-grid article,.home-course-card,.catalog-course-card,.games-grid article,.panel-card,.agenda-card,.analytics-summary-grid article,.analytics-chart-card,.communication-form-card');
    if('IntersectionObserver' in w){
      var observer=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            entry.target.classList.add('motion-visible');
            observer.unobserve(entry.target);
          }
        });
      },{threshold:.08,rootMargin:'40px 0px'});
      nodes.forEach(function(el,i){el.classList.add('motion-reveal');el.style.setProperty('--reveal-delay',Math.min(i%8,7)*45+'ms');observer.observe(el);});
    }else nodes.forEach(function(el){el.classList.add('motion-visible');});
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
    requestAnimationFrame(function(){syncViewport();activatePageMotion();});
  };
  w.addEventListener('hashchange', w.AulaRender);
  document.addEventListener('DOMContentLoaded', async function () {
    try { await w.AulaDemo.init(); w.AulaRender(); }
    catch (err) { w.AulaDemo.loginView(w.AulaDemo.errorText(err, 'No fue posible conectar con Supabase.')); }
  });
})(window);
