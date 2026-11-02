import type { UserLoginEvent, UserSignupEvent, UserValidateEvent } from "@netlify/functions"
import { getEntitlement } from "../shared/entitlements.ts"

async function hasActivePurchase(email?: string | null) {
  const entitlement = await getEntitlement(email)
  return entitlement?.active === true
}

export default {
  async userValidate(event: UserValidateEvent) {
    if (!(await hasActivePurchase(event.user.email))) return event.deny()
  },

  async userSignup(event: UserSignupEvent) {
    if (!(await hasActivePurchase(event.user.email))) return event.deny()
    return {
      user: {
        ...event.user,
        appMetadata: {
          ...event.user.appMetadata,
          roles: ["member"],
        },
      },
    }
  },

  async userLogin(event: UserLoginEvent) {
    if (!(await hasActivePurchase(event.user.email))) return event.deny()
  },
}
