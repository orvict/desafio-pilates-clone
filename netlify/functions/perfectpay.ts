import type { Config } from "@netlify/functions"
import { normalizeEmail, saveEntitlement } from "../shared/entitlements.ts"

const ACTIVE_STATUSES = new Set(["2", "10", "approved", "completed"])
const INACTIVE_STATUSES = new Set(["6", "7", "9", "cancelled", "refunded", "charged_back", "chargeback"])

function safeEqual(left: string, right: string) {
  if (!left || !right || left.length !== right.length) return false
  let result = 0
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return result === 0
}

function pick(payload: Record<string, any>, ...paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce<any>((current, part) => current?.[part], payload)
    if (value !== undefined && value !== null && value !== "") return value
  }
  return undefined
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } })
}

export default async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const expectedSecret = Netlify.env.get("PERFECTPAY_WEBHOOK_SECRET") ?? ""
  const receivedSecret = new URL(request.url).searchParams.get("secret") ?? ""
  if (!safeEqual(receivedSecret, expectedSecret)) return json({ error: "Unauthorized" }, 401)

  let payload: Record<string, any>
  try {
    payload = await request.json()
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }

  const productCode = String(pick(payload, "product.code", "product_code", "product_code_id") ?? "")
  const planCode = String(pick(payload, "plan.code", "plan_code") ?? "")
  const allowedProduct = Netlify.env.get("PERFECTPAY_PRODUCT_CODE") ?? "PPPBFJET"
  const allowedPlan = Netlify.env.get("PERFECTPAY_PLAN_CODE") ?? "PPLQQQPLV"
  if (productCode !== allowedProduct && planCode !== allowedPlan) {
    return json({ error: "Product not allowed" }, 403)
  }

  const email = normalizeEmail(pick(payload, "customer.email", "buyer.email", "email"))
  if (!email || !email.includes("@")) return json({ error: "Customer email missing" }, 422)

  const rawStatus = String(pick(payload, "sale_status_enum", "sale.status_enum", "status", "sale_status") ?? "").toLowerCase()
  if (!ACTIVE_STATUSES.has(rawStatus) && !INACTIVE_STATUSES.has(rawStatus)) {
    return json({ ok: true, ignored: true, status: rawStatus })
  }

  await saveEntitlement({
    active: ACTIVE_STATUSES.has(rawStatus),
    email,
    status: rawStatus,
    saleCode: String(pick(payload, "code", "sale.code", "sale_code") ?? ""),
    productCode,
    planCode,
    updatedAt: new Date().toISOString(),
  })

  return json({ ok: true })
}

export const config: Config = {
  path: "/api/perfectpay",
}
