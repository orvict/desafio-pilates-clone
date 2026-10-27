const app = document.querySelector("#app");
const back = document.querySelector("#back");
const brand = document.querySelector("#brand");

let config;
let stepIndex = 0;
let renderToken = 0;
let timerHandle;
const answers = {};

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

function md(value = "") {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replaceAll("\n", "<br>");
}

function plain(value = "") {
  const holder = document.createElement("div");
  holder.innerHTML = String(value);
  return holder.textContent || "";
}

const iconFor = name => ({
  activity: "⚡", lifestyle: "🌿", target: "◎", goal: "🏁", place: "⌂",
  clock: "◷", calendar: "▦", spark: "✦", scale: "⚖", home: "⌂",
  food: "🥗", chat: "◉"
}[name] || "✓");

function current() { return config.steps[stepIndex]; }

function shell(content, classes = "") {
  clearInterval(timerHandle);
  app.innerHTML = `<section class="screen ${classes}">${content}</section>`;
  const step = current();
  const showBack = stepIndex > 0 && !["sp-processing", "sp-welcome", "sp-offer"].includes(step.type);
  back.classList.toggle("hidden", !showBack);
  brand.textContent = step.section || config.brand.logoText;
  document.querySelector(".topbar").classList.toggle("offer-header", step.type === "sp-offer");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function progress() {
  const step = current();
  if (!step.spPhase) return "";
  const phaseSteps = config.steps.filter(item => item.spPhase === step.spPhase);
  const at = phaseSteps.findIndex(item => item.id === step.id) + 1;
  return `<div class="progress"><i style="width:${Math.round(at / phaseSteps.length * 100)}%"></i></div>`;
}

function header(step, extra = "") {
  return `${progress()}<h1 class="question">${md(step.title || "")}</h1>${step.subtitle ? `<p class="subtitle">${md(step.subtitle)}</p>` : ""}${extra}`;
}

function next() {
  if (stepIndex < config.steps.length - 1) {
    stepIndex++;
    render();
  }
}

back.addEventListener("click", () => {
  if (stepIndex > 0) { stepIndex--; render(); }
});

function bindAdvance(selector = "#advance") {
  document.querySelector(selector)?.addEventListener("click", next);
}

function optionMarkup(option, selected) {
  const media = option.photo || option.icon;
  return `<button class="option ${media ? "with-media" : ""} ${selected ? "selected" : ""}" data-option="${escapeHtml(option.id)}">
    ${media ? `<img src="${escapeHtml(media)}" alt="">` : ""}
    <span>${md(option.label)}</span><i class="check">✓</i>
  </button>`;
}

function renderLanding(step) {
  shell(`${header(step)}<div class="age-grid">${step.options.map(option => `
    <button class="age-card" data-option="${escapeHtml(option.id)}">
      <img src="${escapeHtml(option.image)}" alt="${escapeHtml(option.label)}">
      <span>${md(option.label)}<i>›</i></span>
    </button>`).join("")}</div>`, "wide landing");
  document.querySelectorAll("[data-option]").forEach(button => button.addEventListener("click", () => {
    answers[step.id] = button.dataset.option;
    next();
  }));
}

function renderSingle(step) {
  const selected = answers[step.id];
  shell(`${header(step)}<div class="options">${step.options.map(option => optionMarkup(option, selected === option.id)).join("")}</div>
    ${step.bottomImage ? `<img class="bottom-image" src="${escapeHtml(step.bottomImage)}" alt="">` : ""}
    ${selected && step.callout ? `<div class="callout"><strong>${md(step.callout.emoji + " " + step.callout.title)}</strong><p>${md(step.callout.body)}</p></div>` : ""}
    <button class="primary" id="advance" ${selected ? "" : "disabled"}>${step.ctaLabel || "Avançar"}</button>`);
  document.querySelectorAll("[data-option]").forEach(button => button.addEventListener("click", () => {
    answers[step.id] = button.dataset.option;
    render();
  }));
  bindAdvance();
}

function renderMulti(step) {
  const selected = answers[step.id] || [];
  shell(`${header(step)}<div class="options">${step.options.map(option => optionMarkup(option, selected.includes(option.id))).join("")}</div>
    <button class="primary sticky-next" id="advance" ${selected.length ? "" : "disabled"}>Avançar</button>`);
  document.querySelectorAll("[data-option]").forEach(button => button.addEventListener("click", () => {
    const option = step.options.find(item => item.id === button.dataset.option);
    let values = [...selected];
    if (option.exclusive) values = values.includes(option.id) ? [] : [option.id];
    else {
      values = values.filter(id => !step.options.find(item => item.id === id)?.exclusive);
      values = values.includes(option.id) ? values.filter(id => id !== option.id) : [...values, option.id];
    }
    answers[step.id] = values;
    render();
  }));
  bindAdvance();
}

function renderImageGrid(step) {
  const selected = answers[step.id];
  shell(`${header(step)}<div class="image-grid">${step.options.map(option => `
    <button class="image-card ${selected === option.id ? "selected" : ""}" data-option="${escapeHtml(option.id)}">
      <img src="${escapeHtml(option.photo || option.image || option.icon)}" alt="${escapeHtml(option.label)}"><span>${md(option.label)}</span>
    </button>`).join("")}</div>
    ${selected && step.callout ? `<div class="callout"><strong>${md(step.callout.emoji + " " + step.callout.title)}</strong><p>${md(step.callout.body)}</p></div>` : ""}
    <button class="primary" id="advance" ${selected ? "" : "disabled"}>Avançar</button>`, "wide");
  document.querySelectorAll("[data-option]").forEach(button => button.addEventListener("click", () => {
    answers[step.id] = button.dataset.option;
    render();
  }));
  bindAdvance();
}

function renderInfo(step) {
  shell(`${progress()}${step.image ? `<img class="hero-image" src="${escapeHtml(step.image)}" alt="">` : ""}
    <h1 class="question">${md(step.title)}</h1>
    <div class="copy">${(step.paragraphs || []).map(item => `<p>${md(item)}</p>`).join("")}</div>
    <button class="primary" id="advance">${step.ctaLabel || "Entendi"}</button>`, "info-screen");
  bindAdvance();
}

function renderStatement(step) {
  const selected = answers[step.id];
  shell(`${header(step)}<img class="hero-image compact" src="${escapeHtml(step.image)}" alt=""><div class="statement">“${md(step.statement)}”</div>
    <div class="statement-actions">${["Sim", "Às vezes", "Não"].map(value => `<button class="choice-pill ${selected === value ? "selected" : ""}" data-value="${value}">${value}</button>`).join("")}</div>`);
  document.querySelectorAll("[data-value]").forEach(button => button.addEventListener("click", () => { answers[step.id] = button.dataset.value; next(); }));
}

function renderChartInfo(step) {
  shell(`${header(step)}${step.chartImage ? `<img class="chart-image" src="${escapeHtml(step.chartImage)}" alt="">` : ""}
    ${step.infoCard ? `<div class="callout"><strong>${md(step.infoCard.bold)}</strong><p>${md(step.infoCard.text)}</p></div>` : ""}
    <button class="primary" id="advance">${step.ctaLabel || "Continuar"}</button>`);
  bindAdvance();
}

function renderMeasure(step) {
  const previous = answers[step.id] || "";
  const unit = step.units?.[0] || "";
  shell(`${header(step)}<div class="measure"><input id="measure" inputmode="decimal" type="number" min="1" value="${escapeHtml(previous)}" placeholder="0"><span>${escapeHtml(unit)}</span></div>
    ${step.bmiCard ? `<div class="mini-card">Usaremos sua altura e seu peso para estimar um ponto de partida saudável.</div>` : ""}
    ${step.consentHtml ? `<label class="consent"><input id="consent" type="checkbox" ${answers[`${step.id}-consent`] ? "checked" : ""}><span>${escapeHtml(plain(step.consentHtml))}</span></label>` : ""}
    <button class="primary" id="advance" ${previous && (!step.consentHtml || answers[`${step.id}-consent`]) ? "" : "disabled"}>Avançar</button>`);
  const input = document.querySelector("#measure");
  const consent = document.querySelector("#consent");
  const sync = () => {
    answers[step.id] = input.value;
    if (consent) answers[`${step.id}-consent`] = consent.checked;
    document.querySelector("#advance").disabled = !input.value || (consent && !consent.checked);
  };
  input.addEventListener("input", sync);
  consent?.addEventListener("change", sync);
  bindAdvance();
}

function renderProcessing(step) {
  const token = ++renderToken;
  shell(`<div class="processing">${step.image ? `<img src="${escapeHtml(step.image)}" alt="">` : `<div class="spinner"></div>`}
    <h1>${md(step.title || step.label || "Preparando seu plano...")}</h1>${step.text ? `<p>${md(step.text)}</p>` : ""}
    ${step.review ? `<div class="review-card"><strong>${md(step.review.title)}</strong><p>${md(step.review.body)}</p><small>${escapeHtml(step.review.author)}</small></div>` : ""}
    <div class="loading"><i></i></div><strong class="percent">100%</strong>${step.bottomLabel ? `<p>${md(step.bottomLabel)}</p>` : ""}</div>`, "processing-screen");
  setTimeout(() => { if (token === renderToken && current().id === step.id) next(); }, Math.min(step.durationMs || 3000, 4200));
}

function renderCheckpoint(step) {
  shell(`${header(step)}<div class="checkpoint">
    <div><span class="bmi">${step.fallbackBmi}</span><strong>${md(step.bmiNote.title)}</strong><p>${md(step.bmiNote.body)}</p></div>
    <img src="${escapeHtml(step.image)}" alt=""></div>
    <div class="facts">${step.facts.map(fact => `<div><i>${iconFor(fact.icon)}</i><span>${md(fact.label)}<strong>${md(fact.value)}</strong></span></div>`).join("")}</div>
    <button class="primary" id="advance">${step.ctaLabel}</button>`, "wide");
  bindAdvance();
}

function renderRating(step) {
  shell(`${header(step)}<img class="exercise" src="${escapeHtml(step.image)}" alt="${escapeHtml(step.exerciseLabel)}"><h2 class="exercise-label">${md(step.exerciseLabel)}</h2>
    <div class="rating-grid">${step.labels.map((label, index) => `<button data-rate="${index}"><img src="${escapeHtml(step.icons[index])}" alt=""><span>${md(label)}</span></button>`).join("")}</div>`);
  document.querySelectorAll("[data-rate]").forEach(button => button.addEventListener("click", () => { answers[step.id] = Number(button.dataset.rate); next(); }));
}

function renderPlanDetails(step) {
  shell(`${header(step)}<img class="chart-image" src="${escapeHtml(step.headerImage)}" alt="">
    <div class="plan-panel"><span>${md(step.difficulty.label)}</span><strong>${md(step.difficulty.active)}</strong><p>${md(step.difficulty.note)}</p><img src="${escapeHtml(step.difficulty.image)}" alt=""></div>
    <h2>${md(step.personalizedTitle)}</h2><div class="facts">${step.personalized.map(item => `<div><i>${iconFor(item.icon)}</i><span>${md(item.label)}<strong>${md(item.value)}</strong></span></div>`).join("")}</div>
    <button class="primary" id="advance">${step.ctaLabel}</button>`);
  bindAdvance();
}

function renderBlockers(step) {
  shell(`${header(step)}<div class="blocker-card"><h2>${md(step.cardTitle)}</h2>${step.bars.map(bar => `<div class="bar-row"><span>${bar.emoji} ${md(bar.label)}</span><b>${bar.percent}%</b><div><i style="width:${bar.percent}%;background:${bar.color}"></i></div></div>`).join("")}<p>${md(step.cardFooter)}</p></div>
    <div class="callout"><strong>${step.detail.emoji} ${md(step.detail.title)}</strong><p>${md(step.detail.body)}</p></div>
    <button class="primary" id="advance">${step.ctaLabel}</button>`);
  bindAdvance();
}

function renderEmail(step) {
  const value = answers.email || "";
  shell(`<span class="pill">${md(step.pillLabel)}</span>${header(step)}<label class="field-label">${md(step.inputLabel)}</label><input class="text-input" id="email" type="email" value="${escapeHtml(value)}" placeholder="seuemail@exemplo.com">
    <button class="primary" id="advance" ${/^\S+@\S+\.\S+$/.test(value) ? "" : "disabled"}>${step.ctaLabel}</button>
    <div class="map-stat"><img src="${escapeHtml(step.mapImage)}" alt=""><strong>${md(step.mapStat.number)}</strong><span>${md(step.mapStat.caption)}</span></div>
    <div class="legal-copy">${step.disclaimers.map(item => `<p>${escapeHtml(plain(item))}</p>`).join("")}</div>`);
  const input = document.querySelector("#email");
  input.addEventListener("input", () => { answers.email = input.value.trim(); document.querySelector("#advance").disabled = !/^\S+@\S+\.\S+$/.test(answers.email); });
  bindAdvance();
}

function renderBeforeAfter(step) {
  shell(`${progress()}<h1 class="question">${md(step.titleLine1)}<br><span class="accent">${md(step.titleAccent)}</span> ${md(step.titleRest)}</h1>
    <img class="hero-image" src="${escapeHtml(step.image)}" alt=""><div class="before-after"><div><b>${md(step.nowLabel)}</b><b>${md(step.goalLabel)}</b></div>
    ${step.rows.map(row => `<div><span>${md(row.label)}</span><strong>${md(row.now)}</strong><strong>${md(row.goal)}</strong></div>`).join("")}</div>
    <div class="callout"><p>${md(step.footnote)}</p></div><button class="primary" id="advance">${step.ctaLabel}</button>`);
  bindAdvance();
}

function renderName(step) {
  const value = answers.name || "";
  shell(`${header(step)}<input class="text-input" id="name" value="${escapeHtml(value)}" placeholder="Seu primeiro nome" maxlength="40">
    <button class="primary" id="advance" ${value ? "" : "disabled"}>${step.ctaLabel}</button>`);
  const input = document.querySelector("#name");
  input.addEventListener("input", () => { answers.name = input.value.trim(); document.querySelector("#advance").disabled = !answers.name; });
  bindAdvance();
}

function renderProjection(step) {
  const name = answers.name || "Você";
  const target = answers["target-weight"] ? `${answers["target-weight"]} kg` : "seu peso ideal";
  shell(`<h1 class="question"><span class="accent">${escapeHtml(name)}</span>${md(step.titleAfterName)}<br>${escapeHtml(target)}</h1><p class="subtitle">${md(step.subtitle)}</p>
    <div class="benefits">${step.bullets.map(item => `<div><i>${iconFor(item.icon)}</i><p class="${item.bold ? "bold" : ""}">${md(item.text)}</p></div>`).join("")}</div>
    <button class="primary" id="advance">${step.ctaLabel}</button>`);
  bindAdvance();
}

function renderWelcome(step) {
  const token = ++renderToken;
  const date = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(new Date(Date.now() + 3 * 864e5));
  shell(`<div class="welcome"><div class="spinner"></div><h1 id="welcome-copy"></h1></div>`, "welcome-screen");
  let at = 0;
  const show = () => {
    if (token !== renderToken) return;
    const copy = step.screens[at].replaceAll("{{NAME}}", answers.name || "você").replaceAll("{{DATE_PLUS_3}}", date);
    document.querySelector("#welcome-copy").innerHTML = md(copy);
    at++;
    if (at < step.screens.length) setTimeout(show, Math.min(step.screenDurationMs, 1600));
    else setTimeout(() => { if (token === renderToken) next(); }, Math.min(step.screenDurationMs, 1600));
  };
  show();
}

function renderOffer(step) {
  const name = answers.name || "Você";
  shell(`<div class="offer">
    <div class="discount-reveal"><span>OFERTA PERSONALIZADA PARA ${escapeHtml(name.toUpperCase())}</span><strong>${md(step.scratchPopup.revealTitle)}</strong><p>${md(step.scratchPopup.revealSubtitle)}</p><small>✓ ${md(step.scratchPopup.appliedNote)}</small></div>
    <h1>${escapeHtml(name)}, ${md(step.offerTitle)} <span>${md(step.offerTitleAccent)}</span></h1>
    <div class="timer-pill">${md(step.timerPillLabel)} <strong id="timer">10:00</strong></div>
    <article class="price-card"><span>${md(step.singlePlan.recommendedLabel)}</span><h2>${md(step.singlePlan.title)}</h2><em>${md(step.singlePlan.badge)}</em><del>${md(step.singlePlan.oldPrice)}</del><strong>${md(step.singlePlan.newPrice)}</strong><p>${md(step.singlePlan.perDay)} por dia</p>
      <a class="primary checkout" href="${escapeHtml(config.checkoutUrl)}" target="_blank" rel="noopener noreferrer">${md(step.ctaLabel)}</a><small>🔒 ${md(step.paymentTitle)}</small></article>
    <p class="offer-disclaimer">${md(step.disclaimer)}</p>
    <div class="social-proof"><h2>${md(step.social.title)}</h2><p>${md(step.social.caption)}</p><strong>★★★★★ ${md(step.social.rating)}</strong><p>${md(step.social.reviewsLine)}</p></div>
    <h2>${md(step.comparison.title)}</h2><div class="comparison">${[[step.comparison.leftTitle,step.comparison.leftImage,step.comparison.leftBullets,"bad"],[step.comparison.rightTitle,step.comparison.rightImage,step.comparison.rightBullets,"good"]].map(([title,image,items,kind]) => `<div class="${kind}"><h3>${md(title)}</h3><img src="${escapeHtml(image)}" alt="">${items.map(item => `<p>${kind === "good" ? "✓" : "×"} ${md(item)}</p>`).join("")}</div>`).join("")}</div>
    <h2>${md(step.reviews.title)}</h2><div class="reviews">${step.reviews.items.map(review => `<article><img src="${escapeHtml(review.image)}" alt=""><strong>${md(review.result)}</strong><h3>${md(review.name)}</h3><p>${md(review.text)}</p></article>`).join("")}</div>
    <h2>${md(step.resultsTitle)}</h2><div class="checklist">${step.checklist.map(item => `<p>✓ ${escapeHtml(plain(item))}</p>`).join("")}</div>
    <div class="guarantee"><img src="${escapeHtml(step.guarantee.image)}" alt=""><div><h2>${md(step.guarantee.title)}</h2><p>${md(step.guarantee.body)}</p></div></div>
    <a class="primary checkout final-cta" href="${escapeHtml(config.checkoutUrl)}" target="_blank" rel="noopener noreferrer">${md(step.ctaLabel)}</a>
    <div class="payment-icons">${step.paymentIcons.map(icon => `<img src="${escapeHtml(icon)}" alt="">`).join("")}</div>
  </div><div class="sticky-offer"><span>${md(step.stickyBarLabel)} <b id="sticky-timer">10:00</b></span><a class="checkout" href="${escapeHtml(config.checkoutUrl)}" target="_blank" rel="noopener noreferrer">${md(step.stickyCtaLabel)}</a></div>`, "offer-screen wide");
  let seconds = step.countdownSeconds || 600;
  const tick = () => {
    const label = `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(seconds % 60).padStart(2,"0")}`;
    document.querySelector("#timer").textContent = label;
    document.querySelector("#sticky-timer").textContent = label;
    if (seconds > 0) seconds--;
  };
  tick(); timerHandle = setInterval(tick, 1000);
  document.querySelectorAll(".checkout").forEach(link => link.addEventListener("click", () => {
    if (typeof window.fbq === "function") window.fbq("track", "InitiateCheckout");
  }));
}

function render() {
  renderToken++;
  const step = current();
  const renderer = {
    "sp-landing": renderLanding, "sp-single": renderSingle, "sp-info": renderInfo,
    "sp-multi": renderMulti, "sp-image-grid": renderImageGrid, "sp-statement": renderStatement,
    "sp-chart-info": renderChartInfo, "sp-measure": renderMeasure, "sp-processing": renderProcessing,
    "sp-checkpoint": renderCheckpoint, "sp-exercise-rating": renderRating, "sp-plan-details": renderPlanDetails,
    "sp-blockers": renderBlockers, "sp-email": renderEmail, "sp-before-after": renderBeforeAfter,
    "sp-name": renderName, "sp-plan-projection": renderProjection, "sp-welcome": renderWelcome,
    "sp-offer": renderOffer
  }[step.type];
  if (!renderer) throw new Error(`Unsupported step type: ${step.type}`);
  renderer(step);
}

fetch("quiz-config.json")
  .then(response => {
    if (!response.ok) throw new Error("Não foi possível carregar o questionário");
    return response.json();
  })
  .then(data => { config = data; render(); })
  .catch(error => { app.innerHTML = `<section class="screen"><h1>Não foi possível abrir o quiz</h1><p>${escapeHtml(error.message)}</p></section>`; });
