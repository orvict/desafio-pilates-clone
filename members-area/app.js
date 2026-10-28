const lessonIds=['app-access','challenge-full','schedule','intro-one','exercise-one','exercise-two','intro-two','bonus-pack'];
const storageKey='pilates21-completed';
let completed=new Set(JSON.parse(localStorage.getItem(storageKey)||'[]'));

const updateProgress=()=>{
  const count=lessonIds.filter(id=>completed.has(id)).length;
  document.querySelector('#progress-label').textContent=`${count} de ${lessonIds.length} aulas`;
  document.querySelector('#progress-bar').style.width=`${(count/lessonIds.length)*100}%`;
  document.querySelectorAll('[data-complete]').forEach(button=>{
    const done=completed.has(button.dataset.complete);
    button.classList.toggle('done',done);
    button.textContent=done?'✓ Concluída':button.dataset.complete==='bonus-pack'?'○ Marcar módulo como concluído':'○ Concluir';
  });
};

document.querySelectorAll('.module-tab').forEach(tab=>tab.addEventListener('click',()=>{
  document.querySelectorAll('.module-tab').forEach(item=>item.classList.toggle('active',item===tab));
  document.querySelectorAll('.lesson-panel').forEach(panel=>panel.classList.toggle('active',panel.dataset.panel===tab.dataset.module));
  if(innerWidth<900)document.querySelector('.lesson-panels').scrollIntoView({behavior:'smooth',block:'start'});
}));

document.querySelectorAll('[data-complete]').forEach(button=>button.addEventListener('click',()=>{
  const id=button.dataset.complete;
  completed.has(id)?completed.delete(id):completed.add(id);
  localStorage.setItem(storageKey,JSON.stringify([...completed]));
  updateProgress();
}));

document.querySelector('[data-scroll-lessons]').addEventListener('click',()=>document.querySelector('#conteudo').scrollIntoView({behavior:'smooth'}));
updateProgress();
