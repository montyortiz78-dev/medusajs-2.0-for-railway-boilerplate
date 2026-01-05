import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IAuthModuleService, ICustomerModuleService } from "@medusajs/framework/types"

// Helper types
type AuthenticatedRequest = MedusaRequest & {
  auth_context?: { auth_identity_id: string }
}

// We need this custom type to tell TypeScript that provider_metadata exists
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
    // FIX: Cast the result to our custom type so TS knows about provider_metadata
    const identity = await authService.retrieveAuthIdentity(authIdentityId) as unknown as GoogleAuthIdentity
    
    // --- IMPROVED DEBUGGING ---
    console.log("🔍 FULL IDENTITY OBJECT:", JSON.stringify(identity, null, 2)) 
    // --------------------------

    // Try to find email in standard location, or fallback to top level if it exists there
    // We cast to 'any' for the fallbacks just in case the structure is very different
    const safeIdentity = identity as any
    const email = identity.provider_metadata?.email || safeIdentity.email || safeIdentity.user_metadata?.email
    
    // 1. FATAL ERROR: No Email
    if (!email) {
        console.error(`❌ Identity ${authIdentityId} has NO EMAIL. Deleting identity.`)
        await authService.deleteAuthIdentities([authIdentityId])
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
    // Use optional chaining for app_metadata just in case
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