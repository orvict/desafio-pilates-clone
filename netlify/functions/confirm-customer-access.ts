import { admin } from "@netlify/identity"
import type { Config } from "@netlify/functions"

const CUSTOMER_USER_ID = "642d4afd-d80e-4c20-94a6-486728a45cb5"

function safeEqual(left: string, right: string) {
  if (!left || !right || left.length !== right.length) return false
  let result = 0
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return result === 0
}

export default async (request: Request) => {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 })

  const expectedSecret = Netlify.env.get("PERFECTPAY_WEBHOOK_SECRET") ?? ""
  const receivedSecret = request.headers.get("x-admin-secret") ?? ""
  if (!safeEqual(receivedSecret, expectedSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await admin.updateUser(CUSTOMER_USER_ID, {
    confirm: true,
    role: "member",
    app_metadata: { roles: ["member"] },
  })

  return Response.json({
    ok: true,
    userId: user.id,
    confirmed: Boolean(user.confirmedAt),
    roles: user.roles ?? user.appMetadata?.roles ?? [],
  })
}

export const config: Config = {
  path: "/api/internal/confirm-customer-access",
}
