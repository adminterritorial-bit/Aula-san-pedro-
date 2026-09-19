(function(w){
w.AulaRender=function(){
  var A=w.AulaDemo;
  if(!A.logged()){A.loginView();return;}
  var p=A.route();
  if(p.length===0)A.dashboard();
  else if(p[0]==='catalog')A.catalog();
  else if(p[0]==='course'&&p[1])A.courseView(decodeURIComponent(p[1]));
  else if(p[0]==='games')A.games();
  else if(p[0]==='studio')A.studio();
  else if(p[0]==='certificate'&&p[1])A.certificateView(decodeURIComponent(p[1]));
  else A.dashboard();
};
w.addEventListener('hashchange',w.AulaRender);
document.addEventListener('DOMContentLoaded',w.AulaRender);
})(window);