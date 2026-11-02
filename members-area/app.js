(() => {
  'use strict';
  const workouts = window.WORKOUTS || [];
  const videoBase = './assets/videos/';
  const storageKey = 'pilates21-own-completed-days';
  const completed = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]').map(Number));
  const playerShell = document.querySelector('#player');
  const video = document.querySelector('#lesson-video');
  const videoState = document.querySelector('#video-state');
  let activeWeek = 1, activeDay = null, steps = [], stepIndex = 0;
  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  function saveProgress() { localStorage.setItem(storageKey, JSON.stringify([...completed])); updateProgress(); }
  function updateProgress() {
    $('#progress-label').textContent = `${completed.size} de 21 dias`;
    $('#progress-bar').style.width = `${(completed.size / 21) * 100}%`;
  }
  function renderDays() {
    const start = (activeWeek - 1) * 7 + 1;
    const days = workouts.filter(item => item.day >= start && item.day < start + 7);
    $('#day-grid').innerHTML = days.map(item => `
      <article class="day-card ${completed.has(item.day) ? 'is-done' : ''}">
        <div class="day-number"><span>DIA</span><strong>${String(item.day).padStart(2, '0')}</strong></div>
        <div class="day-copy">
          <small>${escapeHtml(item.focus)} · ${item.duration} min</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.intro)}</p>
          <button class="button primary" type="button" data-open-day="${item.day}">${completed.has(item.day) ? 'Rever treino' : 'Começar treino'}</button>
          <button class="complete-button" type="button" data-complete-day="${item.day}">${completed.has(item.day) ? '✓ Dia concluído' : '○ Marcar como concluído'}</button>
        </div>
      </article>`).join('');
  }
  function setVideoState(state) {
    videoState.className = `video-state ${state === 'ready' ? 'is-hidden' : ''} ${state === 'error' ? 'is-error' : ''}`;
    const title = videoState.querySelector('strong'), help = videoState.querySelector('small'), retry = videoState.querySelector('[data-retry]');
    retry.hidden = state !== 'error';
    if (state === 'loading') { title.textContent = 'Carregando aula…'; help.textContent = 'Aguarde alguns segundos.'; }
    else if (state === 'error') { title.textContent = 'Não foi possível carregar o vídeo'; help.textContent = 'Confira sua internet e toque para tentar novamente.'; }
    else if (state === 'text') { title.textContent = 'Exercício sem vídeo'; help.textContent = 'Siga a orientação abaixo e avance quando terminar.'; }
  }
  function openDay(dayNumber) {
    activeDay = workouts.find(item => item.day === dayNumber); if (!activeDay) return;
    steps = [...activeDay.warmup.map(item => ({...item, stage:'Aquecimento'})), ...activeDay.exercises.map(item => ({...item, stage:'Treino principal'})), ...activeDay.cooldown.map(item => ({...item, stage:'Volta à calma'}))];
    stepIndex = 0; playerShell.hidden = false; document.body.classList.add('no-scroll');
    $('#player-day').textContent = `DIA ${activeDay.day} DE 21 · ${activeDay.duration} MIN`; $('#player-title').textContent = activeDay.title; paintStep();
  }
  function closePlayer() { video.pause(); video.removeAttribute('src'); video.load(); playerShell.hidden = true; document.body.classList.remove('no-scroll'); }
  function paintStep() {
    const item = steps[stepIndex];
    $('#lesson-stage').textContent = item.stage; $('#lesson-name').textContent = item.name; $('#lesson-focus').textContent = item.focus || 'Movimento controlado e confortável.';
    $('#lesson-duration').textContent = item.dur || ''; $('#lesson-reps').textContent = item.reps || ''; $('#step-label').textContent = `${stepIndex + 1} de ${steps.length}`;
    $('#step-bar').style.width = `${((stepIndex + 1) / steps.length) * 100}%`; $('[data-prev]').disabled = stepIndex === 0; $('[data-next]').textContent = stepIndex === steps.length - 1 ? 'Concluir treino' : 'Próximo';
    if (!item.video) { video.hidden = true; video.pause(); video.removeAttribute('src'); setVideoState('text'); return; }
    video.hidden = false; setVideoState('loading'); const source = videoBase + encodeURIComponent(item.video);
    if (video.getAttribute('src') !== source) { video.setAttribute('src', source); video.load(); }
    video.play().catch(() => { if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setVideoState('ready'); });
  }
  function nextStep() {
    if (stepIndex < steps.length - 1) { stepIndex += 1; paintStep(); return; }
    completed.add(activeDay.day); saveProgress(); renderDays(); closePlayer();
    const nextDay = Math.min(activeDay.day + 1, 21); if (nextDay !== activeDay.day) { activeWeek = Math.ceil(nextDay / 7); document.querySelectorAll('[data-week]').forEach(button => button.classList.toggle('active', Number(button.dataset.week) === activeWeek)); renderDays(); }
  }
  document.addEventListener('click', event => {
    const openButton = event.target.closest('[data-open-day]'); if (openButton) openDay(Number(openButton.dataset.openDay));
    const completeButton = event.target.closest('[data-complete-day]'); if (completeButton) { const day = Number(completeButton.dataset.completeDay); completed.has(day) ? completed.delete(day) : completed.add(day); saveProgress(); renderDays(); }
    const weekButton = event.target.closest('[data-week]'); if (weekButton) { activeWeek = Number(weekButton.dataset.week); document.querySelectorAll('[data-week]').forEach(button => button.classList.toggle('active', button === weekButton)); renderDays(); }
  });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closePlayer));
  $('[data-prev]').addEventListener('click', () => { if (stepIndex > 0) { stepIndex -= 1; paintStep(); } }); $('[data-next]').addEventListener('click', nextStep);
  $('[data-start]').addEventListener('click', () => openDay(completed.size ? Math.min(Math.max(...completed) + 1, 21) : 1));
  videoState.querySelector('[data-retry]').addEventListener('click', () => { setVideoState('loading'); video.load(); video.play().catch(() => setVideoState('error')); });
  video.addEventListener('loadstart', () => setVideoState('loading')); video.addEventListener('loadeddata', () => setVideoState('ready')); video.addEventListener('canplay', () => setVideoState('ready')); video.addEventListener('playing', () => setVideoState('ready')); video.addEventListener('error', () => setVideoState('error'));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !playerShell.hidden) closePlayer(); });
  updateProgress(); renderDays();
})();
