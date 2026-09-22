(function (w) {
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
  };
  w.addEventListener('hashchange', w.AulaRender);
  document.addEventListener('DOMContentLoaded', async function () {
    try { await w.AulaDemo.init(); w.AulaRender(); }
    catch (err) { w.AulaDemo.loginView(w.AulaDemo.errorText(err, 'No fue posible conectar con Supabase.')); }
  });
})(window);
