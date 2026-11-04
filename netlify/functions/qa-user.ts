import { admin } from "@netlify/identity"
import type { Config } from "@netlify/functions"

function safeEqual(left: string, right: string) {
  if (!left || !right || left.length !== right.length) return false
  let result = 0
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return result === 0
}

export default async (request: Request) => {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 })

  const expectedSecret = Netlify.env.get("PERFECTPAY_WEBHOOK_SECRET") ?? ""
  const receivedSecret = request.headers.get("x-admin-secret") ?? ""
  if (!safeEqual(receivedSecret, expectedSecret)) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as { action?: string; email?: string; password?: string; userId?: string }
  const email = String(body.email ?? "").trim().toLowerCase()
  if (!email.endsWith("@example.com")) return Response.json({ error: "Only disposable QA users are allowed" }, { status: 403 })

  if (body.action === "create") {
    const user = await admin.createUser({
      email,
      password: String(body.password ?? ""),
      data: { role: "member", app_metadata: { roles: ["member"] }, user_metadata: { full_name: "Teste de acesso" } },
    })
    return Response.json({ ok: true, userId: user.id, confirmed: Boolean(user.confirmedAt) })
  }

  if (body.action === "delete") {
    const user = await admin.getUser(String(body.userId ?? ""))
    if (user.email?.toLowerCase() !== email) return Response.json({ error: "QA user mismatch" }, { status: 409 })
    await admin.deleteUser(user.id)
    return Response.json({ ok: true })
  }

  return Response.json({ error: "Invalid action" }, { status: 400 })
}

export const config: Config = { path: "/api/internal/qa-user" }
