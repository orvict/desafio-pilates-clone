const A = "assets/";

const state = {
  step: 0,
  age: "",
  practiced: "",
  goals: [],
  body: "",
  dream: "",
  focus: [],
};

const screens = [renderAge, renderExperience, renderIntro, renderGoals, renderBody, renderDream, renderFocus, renderResult];
const app = document.querySelector("#app");
const back = document.querySelector("#back");
const brand = document.querySelector("#brand");

const ageOptions = [
  ["18-29", "0cb6667e46abcfc0.webp"],
  ["30-39", "a8617c64e71a9aa0.webp"],
  ["40-49", "5b79244a8033a15f.webp"],
  ["50+", "b707bf217deae907.webp"],
];
const goalOptions = [
  ["Perder peso", "d5c3b2331cd5be75.png"],
  ["Definir o corpo e manter o peso", "9d0cd358aa620b4c.png"],
  ["Melhorar minha postura", "e434a87513a6eb5b.png"],
  ["Reduzir o estresse", "0999d07a1e2adbc9.png"],
  ["Melhorar minha flexibilidade", "5488480a2513c3d7.png"],
  ["Aumentar minha energia", "b6218d9dfe5f468a.png"],
  ["Não tenho certeza", "8a5411bc6dc7dc89.png"],
];
const bodyOptions = [
  ["Magro", "6a943f6fef2cc21a.webp"],
  ["Médio", "ef5b386664f4d85b.webp"],
  ["Cheinho", "401bec9378692425.webp"],
  ["Plus size", "1d77b5ec779bd7a3.webp"],
];

function shell(content, wide = false) {
  app.innerHTML = `<section class="screen${wide ? " wide" : ""}">${content}</section>`;
  back.classList.toggle("hidden", state.step === 0);
  brand.textContent = state.step >= 3 && state.step < 7 ? "MEU PERFIL" : "PILATES NA PAREDE";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function go(step) {
  state.step = Math.max(0, Math.min(step, screens.length - 1));
  screens[state.step]();
}

function next() { go(state.step + 1); }
back.addEventListener("click", () => go(state.step - 1));

function renderAge() {
  shell(`
    <h1>Desafio de 21 dias de Pilates na Parede</h1>
    <p class="eyebrow">COM BASE NA SUA IDADE</p>
    <div class="age-grid">
      ${ageOptions.map(([label, image]) => `
        <button class="age-card" data-age="${label}">
          <img src="${A + image}" alt="Faixa etária ${label}">
          <span class="age-label">Idade: ${label}<i class="arrow-dot">&#8250;</i></span>
        </button>`).join("")}
    </div>`, true);
  document.querySelectorAll("[data-age]").forEach(btn => btn.addEventListener("click", () => {
    state.age = btn.dataset.age;
    next();
  }));
}

function renderExperience() {
  shell(`
    <h2>Você já praticou pilates contra a parede?</h2>
    <div class="options">
      ${["Sim", "Não"].map(value => `<button class="option" data-value="${value}">${value}</button>`).join("")}
    </div>`);
  document.querySelectorAll("[data-value]").forEach(btn => btn.addEventListener("click", () => {
    state.practiced = btn.dataset.value;
    next();
  }));
}

function renderIntro() {
  shell(`
    <h2>Você vai arrasar!</h2>
    <img class="feature-img" src="${A}a455fbf9dea7e2a7.webp" alt="Mulher praticando pilates">
    <p>Nosso programa de pilates contra a parede é uma opção de exercício fácil e eficaz para pessoas de todos os níveis.</p>
    <div class="info-card"><strong>Seu treino, do seu jeito</strong><p>Nós ajudaremos você a ficar em forma exercitando-se em casa e sem equipamentos!</p></div>
    <button class="primary" id="continue">Entendi</button>`);
  document.querySelector("#continue").addEventListener("click", next);
}

function renderMulti(title, hint, options, selected, key, withIcons = false) {
  shell(`
    <h2>${title}</h2>
    <p class="hint">${hint}</p>
    <div class="options">
      ${options.map(item => {
        const value = Array.isArray(item) ? item[0] : item;
        const image = Array.isArray(item) ? item[1] : null;
        return `<button class="option${withIcons ? " with-icon" : ""}${selected.includes(value) ? " selected" : ""}" data-choice="${value}">
          ${image ? `<img src="${A + image}" alt="">` : ""}<span>${value}</span><i class="check">&#10003;</i>
        </button>`;
      }).join("")}
    </div>
    <button class="primary" id="advance" ${selected.length ? "" : "disabled"}>Avançar</button>`);
  document.querySelectorAll("[data-choice]").forEach(btn => btn.addEventListener("click", () => {
    const value = btn.dataset.choice;
    const list = state[key];
    const at = list.indexOf(value);
    if (at >= 0) list.splice(at, 1); else list.push(value);
    renderMulti(title, hint, options, list, key, withIcons);
  }));
  document.querySelector("#advance").addEventListener("click", next);
}

function renderGoals() { renderMulti("Primeiro, diga-nos em que você gostaria de se concentrar:", "Escolha todas que se aplicam", goalOptions, state.goals, "goals", true); }

function renderBody() {
  shell(`
    <h2>Como você descreve o seu corpo?</h2>
    <div class="body-grid">
      ${bodyOptions.map(([label, image]) => `<button class="body-card${state.body === label ? " selected" : ""}" data-body="${label}"><img src="${A + image}" alt="Tipo físico ${label}"><span>${label}</span></button>`).join("")}
    </div>
    <button class="primary" id="advance" ${state.body ? "" : "disabled"}>Avançar</button>`, true);
  document.querySelectorAll("[data-body]").forEach(btn => btn.addEventListener("click", () => { state.body = btn.dataset.body; renderBody(); }));
  document.querySelector("#advance").addEventListener("click", next);
}

function renderDream() {
  const values = ["Magro", "Definido", "Com curvas", "Algumas medidas a menos"];
  shell(`
    <h2>Qual é o seu “corpo dos sonhos”?</h2>
    <div class="options">${values.map(value => `<button class="option${state.dream === value ? " selected" : ""}" data-dream="${value}">${value}</button>`).join("")}</div>
    ${state.dream ? `<div class="info-card"><strong>🤙 Conte conosco para chegar lá</strong><p>O pilates contra a parede é o caminho para conquistar o corpo que você sempre quis: mais força, mais leveza e muito mais autoconfiança.</p></div><button class="primary" id="advance">Avançar</button>` : ""}`);
  document.querySelectorAll("[data-dream]").forEach(btn => btn.addEventListener("click", () => { state.dream = btn.dataset.dream; renderDream(); }));
  document.querySelector("#advance")?.addEventListener("click", next);
}

function renderFocus() { renderMulti("Em que áreas você mais quer se concentrar?", "Escolha todas que se aplicam", ["Barriga", "Glúteos", "Pernas", "Braços", "Todo o corpo"], state.focus, "focus"); }

function renderResult() {
  shell(`
    <div class="result">
      <span class="result-badge">✓ Perfil concluído</span>
      <h2>Seu desafio personalizado está pronto!</h2>
      <img class="feature-img" src="${A}755df0e46ab7ef14.webp" alt="Exercício de pilates na parede">
      <div class="summary">
        <div><span>Faixa etária</span><strong>${state.age}</strong></div>
        <div><span>Objetivo</span><strong>${state.goals[0] || "Bem-estar"}</strong></div>
        <div><span>Foco</span><strong>${state.focus.join(", ")}</strong></div>
      </div>
      <a class="primary checkout" href="https://go.perfectpay.com.br/PPU38CQH3LB" target="_blank" rel="noopener noreferrer">Quero começar meu desafio</a>
      <button class="restart" id="restart">Refazer o quiz</button>
      <p class="fine">Suas respostas não são enviadas ou armazenadas. A compra é processada com segurança pela PerfectPay.</p>
    </div>`);
  document.querySelector("#restart").addEventListener("click", () => location.reload());
}

renderAge();
