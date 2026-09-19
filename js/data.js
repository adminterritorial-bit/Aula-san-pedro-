(function(w){
function futureDate(days){var d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}
function questions(id){var rows=[
['¿Cuál es el primer paso antes de ejecutar una actividad nueva?',['Iniciar sin revisar','Verificar instrucciones, riesgos y recursos','Esperar','Omitir el procedimiento'],1],
['¿Qué debe hacerse ante una condición insegura?',['Ignorarla','Reportarla y controlar el riesgo','Continuar','Ocultarla'],1],
['¿Qué característica tiene un buen procedimiento?',['Es ambiguo','Es trazable y entendible','Depende de memoria','No tiene responsables'],1],
['¿Para qué sirve una evidencia de formación?',['Solo para decorar','Para demostrar participación y aprendizaje','Para reemplazar controles','Para evitar evaluaciones'],1],
['¿Qué práctica mejora la calidad del proceso?',['Improvisar','Documentar, medir y mejorar','Eliminar controles','No usar indicadores'],1],
['¿Qué debe ocurrir antes del examen final?',['Completar contenidos obligatorios','Cerrar sesión','Crear un usuario','Modificar el certificado'],0],
['¿Qué significa trazabilidad?',['Reconstruir qué ocurrió y cuándo','Borrar registros','Trabajar sin fechas','Cambiar resultados'],0],
['¿Cuál es el objetivo de una capacitación corporativa?',['Generar aprendizaje aplicable','Crear archivos sin uso','Evitar responsabilidades','Sustituir controles'],0],
['¿Qué hacer si una instrucción no es clara?',['Adivinar','Solicitar aclaración antes de ejecutar','Omitirla','Cambiarla sin autorización'],1],
['¿Qué promueve la mejora continua?',['Aprender de resultados y ajustar','Repetir errores','No medir','Evitar retroalimentación'],0]
];return rows.map(function(q,i){return{id:id+'-q'+i,prompt:q[0],options:q[1],correct:q[2]};});}
function course(id,title,description,blocks){return{id:id,title:title,description:description,status:'published',passing_score:80,phases:[
{id:id+'-p1',title:'Fase 1 · Contexto y conceptos',blocks:blocks.slice(0,3)},
{id:id+'-p2',title:'Fase 2 · Aplicación práctica',blocks:blocks.slice(3)}
],questions:questions(id)};}
w.AulaDemoDefaults=function(){return{
users:[
{id:'u-admin',full_name:'Administrador Demo',email:'admin@demo.local',role:'super_admin',is_active:true},
{id:'u-ana',full_name:'Ana Torres',email:'ana@empresa.demo',role:'colaborador',is_active:true},
{id:'u-carlos',full_name:'Carlos Ruiz',email:'carlos@empresa.demo',role:'colaborador',is_active:true},
{id:'u-formador',full_name:'Formador Demo',email:'formador@empresa.demo',role:'creador_contenido',is_active:true}
],
courses:[
course('course-induction','Inducción corporativa','Recorrido demostrativo por cultura, responsabilidades, canales y buenas prácticas.',[
{id:'ind-b1',title:'Bienvenida y alcance',type:'video',required:true,body:'Conoce el propósito y la estructura de la ruta de aprendizaje.'},
{id:'ind-b2',title:'Principios y responsabilidades',type:'reading',required:true,body:'Las responsabilidades deben ser claras, trazables y conocidas antes de iniciar una actividad.'},
{id:'ind-b3',title:'Canales y comunicación',type:'presentation',required:true,body:'Revisa canales internos, tiempos de respuesta y reglas de escalamiento.'},
{id:'ind-b4',title:'Caso práctico',type:'game',required:true,body:'Toma decisiones frente a un escenario de inducción.'},
{id:'ind-b5',title:'Cierre de módulo',type:'validation',required:true,body:'Confirma que identificas responsables, canales y evidencias mínimas.'}
]),
course('course-sst','Seguridad y trabajo seguro','Ruta secuencial de ejemplo sobre identificación de peligros y controles.',[
{id:'sst-b1',title:'Identificación de peligros',type:'reading',required:true,body:'Identifica fuentes de peligro, personas expuestas y controles disponibles.'},
{id:'sst-b2',title:'Jerarquía de controles',type:'presentation',required:true,body:'Prioriza eliminación, sustitución, ingeniería, controles administrativos y protección.'},
{id:'sst-b3',title:'Reporte oportuno',type:'video',required:true,body:'Una condición insegura debe reportarse, controlarse y dejar evidencia.'},
{id:'sst-b4',title:'Clasificación de riesgos',type:'game',required:true,body:'Clasifica situaciones de ejemplo según el tipo de riesgo.'},
{id:'sst-b5',title:'Validación previa',type:'validation',required:true,body:'Verifica que puedes reconocer un riesgo y seleccionar un control.'}
]),
course('course-quality','Calidad y mejora continua','Ruta de muestra para procesos, indicadores, hallazgos y acciones de mejora.',[
{id:'qua-b1',title:'Pensamiento basado en procesos',type:'reading',required:true,body:'Comprende entradas, actividades, responsables, salidas y controles.'},
{id:'qua-b2',title:'Indicadores',type:'presentation',required:true,body:'Un indicador requiere propósito, fórmula, fuente, periodicidad, meta y responsable.'},
{id:'qua-b3',title:'Hallazgos y evidencias',type:'video',required:true,body:'Un hallazgo se apoya en evidencia objetiva y una descripción clara.'},
{id:'qua-b4',title:'Ordenar acciones',type:'game',required:true,body:'Organiza: identificar, analizar, actuar, verificar y estandarizar.'},
{id:'qua-b5',title:'Lección aprendida',type:'validation',required:false,body:'Registra qué funcionó, qué debe ajustarse y cómo evitar recurrencias.'}
])
],
assignments:[
{id:'as-1',user_id:'u-admin',course_id:'course-induction',due_at:futureDate(12)},
{id:'as-2',user_id:'u-admin',course_id:'course-sst',due_at:futureDate(20)},
{id:'as-3',user_id:'u-admin',course_id:'course-quality',due_at:futureDate(30)},
{id:'as-4',user_id:'u-ana',course_id:'course-induction',due_at:futureDate(8)},
{id:'as-5',user_id:'u-carlos',course_id:'course-sst',due_at:futureDate(15)}
],
progress:{'u-admin':{'course-induction':['ind-b1'],'course-sst':[],'course-quality':[]}},
certificates:[],
activity:[{id:'ev-1',at:new Date().toISOString(),text:'Demo inicializada con información de ejemplo.'}]
};};
})(window);