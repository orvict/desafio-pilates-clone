import { getStore } from "@netlify/blobs"

export const ENTITLEMENTS_STORE = "perfectpay-entitlements"

export type Entitlement = {
  active: boolean
  email: string
  status: string
  saleCode?: string
  productCode?: string
  planCode?: string
  updatedAt: string
}

export function normalizeEmail(email: unknown) {
  return String(email ?? "").trim().toLowerCase()
}

export async function entitlementKey(email: unknown) {
  const normalized = normalizeEmail(email)
  const bytes = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")
}

export async function getEntitlement(email: unknown) {
  const normalized = normalizeEmail(email)
  if (!normalized || !normalized.includes("@")) return null

  const store = getStore({ name: ENTITLEMENTS_STORE, consistency: "strong" })
  return store.get(await entitlementKey(normalized), {
    consistency: "strong",
    type: "json",
  }) as Promise<Entitlement | null>
}

export async function saveEntitlement(entitlement: Entitlement) {
  const store = getStore({ name: ENTITLEMENTS_STORE, consistency: "strong" })
  await store.setJSON(await entitlementKey(entitlement.email), entitlement)
}
