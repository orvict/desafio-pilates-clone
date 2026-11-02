import {
  getUser,
  handleAuthCallback,
  login,
  logout,
  requestPasswordRecovery,
  signup,
  updateUser,
} from "https://cdn.jsdelivr.net/npm/@netlify/identity@2.0.0/+esm"

const forms = [...document.querySelectorAll(".form")]
const tabs = [...document.querySelectorAll("[data-tab]")]
const notice = document.querySelector("#notice")
const params = new URLSearchParams(location.search)
let recoveryMode = false

function safeReturnTo() {
  const value = params.get("returnTo") || "/members-area/"
  return value.startsWith("/members-area/") ? value : "/members-area/"
}

function showPanel(name) {
  forms.forEach(form => {
    const active = form.dataset.panel === name
    form.classList.toggle("active", active)
    form.hidden = !active
  })
  tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.tab === name))
}

function showNotice(message, error = false) {
  notice.textContent = message
  notice.classList.toggle("error", error)
  notice.hidden = false
}

function friendlyError(error) {
  const message = String(error?.message || "").toLowerCase()
  if (message.includes("invalid login") || message.includes("invalid credentials")) return "E-mail ou senha incorretos."
  if (message.includes("already registered")) return "Este e-mail já possui cadastro. Use a opção de entrar ou recupere sua senha."
  if (message.includes("not allowed") || message.includes("unauthorized") || message.includes("401")) return "Não encontramos uma compra ativa para esse e-mail. Confira se digitou o mesmo e-mail usado na PerfectPay."
  return "Não foi possível concluir agora. Confira os dados e tente novamente."
}

async function submitWithState(form, action) {
  const button = form.querySelector("button[type='submit']")
  const original = button.textContent
  button.disabled = true
  button.textContent = "Aguarde…"
  notice.hidden = true
  try {
    await action(new FormData(form))
  } catch (error) {
    showNotice(friendlyError(error), true)
  } finally {
    button.disabled = false
    button.textContent = original
  }
}

tabs.forEach(tab => tab.addEventListener("click", () => showPanel(tab.dataset.tab)))
document.querySelector("[data-forgot]").addEventListener("click", () => showPanel("recovery"))
document.querySelector("[data-back]").addEventListener("click", () => showPanel("login"))

document.querySelector("#login-form").addEventListener("submit", event => {
  event.preventDefault()
  submitWithState(event.currentTarget, async data => {
    await login(String(data.get("email")), String(data.get("password")))
    location.assign(safeReturnTo())
  })
})

document.querySelector("#signup-form").addEventListener("submit", event => {
  event.preventDefault()
  submitWithState(event.currentTarget, async data => {
    await signup(String(data.get("email")), String(data.get("password")), { full_name: String(data.get("name")) })
    event.currentTarget.reset()
    showPanel("login")
    showNotice("Cadastro recebido. Abra o e-mail de confirmação e clique no link para liberar seu acesso.")
  })
})

document.querySelector("#recovery-form").addEventListener("submit", event => {
  event.preventDefault()
  submitWithState(event.currentTarget, async data => {
    await requestPasswordRecovery(String(data.get("email")))
    event.currentTarget.reset()
    showPanel("login")
    showNotice("Se o e-mail estiver cadastrado, você receberá o link para criar uma nova senha.")
  })
})

document.querySelector("#password-form").addEventListener("submit", event => {
  event.preventDefault()
  submitWithState(event.currentTarget, async data => {
    if (!recoveryMode) throw new Error("Recovery session missing")
    await updateUser({ password: String(data.get("password")) })
    location.assign("/members-area/")
  })
})

async function initialize() {
  if (params.get("logout") === "1") {
    await logout().catch(() => {})
    history.replaceState({}, "", "/login/")
    showNotice("Você saiu da sua conta com segurança.")
    return
  }

  if (params.get("reason") === "access") {
    await logout().catch(() => {})
    showNotice("Este acesso não está ativo. Se você acredita que houve um engano, fale com o suporte.", true)
    return
  }

  const callback = await handleAuthCallback().catch(error => {
    showNotice(friendlyError(error), true)
    return null
  })

  if (callback?.type === "confirmation" || callback?.type === "invite" || callback?.type === "oauth") {
    location.assign(safeReturnTo())
    return
  }

  if (callback?.type === "recovery") {
    recoveryMode = true
    showPanel("password")
    showNotice("E-mail confirmado. Agora escolha sua nova senha.")
    return
  }

  const user = await getUser().catch(() => null)
  if (user) location.assign(safeReturnTo())
}

initialize()
