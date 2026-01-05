import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IAuthModuleService, ICustomerModuleService } from "@medusajs/framework/types"

// Helper types
type AuthenticatedRequest = MedusaRequest & {
  auth_context?: { auth_identity_id: string }
}

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
    [key: string]: any
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const authIdentityId = (req as AuthenticatedRequest).auth_context?.auth_identity_id

  if (!authIdentityId) {
    return res.status(401).json({ message: "No valid token provided" })
  }

  const authService: IAuthModuleService = req.scope.resolve(Modules.AUTH)
  const customerService: ICustomerModuleService = req.scope.resolve(Modules.CUSTOMER)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const identity = await authService.retrieveAuthIdentity(authIdentityId) as unknown as GoogleAuthIdentity
    
    // DEBUG LOG: Print what we actually got from Google
    console.log("🔍 Google Identity Data:", JSON.stringify(identity.provider_metadata, null, 2))

    const email = identity.provider_metadata?.email
    
    // 1. FATAL ERROR: No Email
    if (!email) {
        console.error(`❌ Identity ${authIdentityId} has NO EMAIL. Deleting identity.`)
        await authService.deleteAuthIdentities([authIdentityId])
        // Return 200 with "deleted" status so frontend can restart
        return res.status(200).json({ status: "deleted", action: "reauth" })
    }

    // 2. Check if Customer Exists (by Email)
    const { data: existingCustomers } = await query.graph({
      entity: "customer",
      fields: ["id"],
      filters: { email },
    })

    let customerId = existingCustomers[0]?.id

    // 3. Create Customer if needed
    if (!customerId) {
        console.log(`✨ Creating new customer for ${email}`)
        const newCustomer = await customerService.createCustomers({
            email,
            first_name: identity.provider_metadata?.given_name || "Google",
            last_name: identity.provider_metadata?.family_name || "User",
            has_account: true,
            metadata: { avatar: identity.provider_metadata?.picture }
        })
        customerId = newCustomer.id
    }

    // 4. Link Identity
    if (identity.app_metadata?.actor_id !== customerId) {
        console.log(`🔗 Linking Identity to Customer ${customerId}`)
        await authService.updateAuthIdentities([{
            id: authIdentityId,
            app_metadata: {
                actor_id: customerId,
                actor_type: "customer"
            }
        }])
    }

    return res.status(200).json({ status: "success", customer_id: customerId })

  } catch (error) {
    console.error("Onboarding Error:", error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}