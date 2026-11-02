import { getUser } from "@netlify/identity"
import { getEntitlement } from "../shared/entitlements.ts"

export default async (request: Request, context: any) => {
  // Deploy the authentication stack safely before switching the existing
  // members area to protected mode in the Netlify environment settings.
  if (Netlify.env.get("MEMBERS_LOGIN_ENABLED") !== "true") return context.next()

  const user = await getUser()
  const url = new URL(request.url)

  if (!user?.email) {
    const login = new URL("/login/", url.origin)
    login.searchParams.set("returnTo", `${url.pathname}${url.search}`)
    return Response.redirect(login, 302)
  }

  const entitlement = await getEntitlement(user.email)
  if (!entitlement?.active) {
    const login = new URL("/login/", url.origin)
    login.searchParams.set("reason", "access")
    return Response.redirect(login, 302)
  }

  return context.next()
}
