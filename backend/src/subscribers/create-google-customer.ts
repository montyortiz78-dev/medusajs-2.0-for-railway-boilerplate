import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IAuthModuleService, ICustomerModuleService } from "@medusajs/framework/types"

// Helper type to tell TypeScript what Google data looks like
type GoogleAuthIdentity = {
  id: string
  provider: string
  provider_metadata?: {
    email?: string
    given_name?: string
    family_name?: string
    picture?: string
    [key: string]: any
  }
  app_metadata?: {
    actor_id?: string
    actor_type?: string
    [key: string]: any
  }
}

export default async function createGoogleCustomer({
  event,
  container,
}: SubscriberArgs<{ auth_identity_id: string }>) {
  const authService: IAuthModuleService = container.resolve(Modules.AUTH)
  const customerService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)
  
  // 1. Retrieve and Cast to our custom type to fix TS errors
  const authIdentity = await authService.retrieveAuthIdentity(
    event.data.auth_identity_id
  ) as unknown as GoogleAuthIdentity

  // 2. Only run for Google logins that haven't been linked yet
  if (authIdentity.provider !== "google" || authIdentity.app_metadata?.actor_id) {
    return
  }

  // 3. Extract Real Data from Google
  const email = authIdentity.provider_metadata?.email
  const firstName = authIdentity.provider_metadata?.given_name || "Google"
  const lastName = authIdentity.provider_metadata?.family_name || "User"
  const picture = authIdentity.provider_metadata?.picture

  if (!email) {
    console.log("⚠️ [Google Auth] No email found in provider metadata.")
    return
  }

  // 4. Check if customer already exists (by email)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: existingCustomers } = await query.graph({
    entity: "customer",
    fields: ["id"],
    filters: { email },
  })

  let customerId = existingCustomers[0]?.id

  // 5. If no customer, create one with the REAL email
  if (!customerId) {
    try {
        const newCustomer = await customerService.createCustomers({
            email,
            first_name: firstName,
            last_name: lastName,
            has_account: true,
            metadata: { avatar: picture }
        })
        customerId = newCustomer.id
        console.log(`✅ [Google Auth] Created new customer: ${email}`)
    } catch (e) {
        console.error("❌ [Google Auth] Failed to create customer:", e)
        return
    }
  } else {
    console.log(`ℹ️ [Google Auth] Linking to existing customer: ${email}`)
  }

  // 6. Link the Google Login to the Customer
  await authService.updateAuthIdentities([{
    id: authIdentity.id,
    app_metadata: {
      actor_id: customerId,
      actor_type: "customer"
    }
  }])
}

export const config: SubscriberConfig = {
  event: "auth_identity.created",
}