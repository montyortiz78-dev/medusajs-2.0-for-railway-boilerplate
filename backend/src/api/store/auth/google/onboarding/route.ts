import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IAuthModuleService, ICustomerModuleService } from "@medusajs/framework/types"

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
    // 1. Retrieve the Identity
    const identity = await authService.retrieveAuthIdentity(authIdentityId, {
      select: ["id", "provider_metadata", "app_metadata", "provider"]
    }) as unknown as GoogleAuthIdentity
    
    console.log("🔍 INSPECTING IDENTITY:", JSON.stringify(identity, null, 2))

    // 2. Extract Email (Try multiple locations)
    const safeIdentity = identity as any
    const metadata = identity.provider_metadata || {}
    const email = metadata.email || safeIdentity.email || safeIdentity.user_metadata?.email
    
    // 3. FATAL ERROR CHECK
    if (!email) {
        console.error(`❌ CRITICAL FAILURE: Identity ${authIdentityId} created but has NO EMAIL.`)
        console.error(`❌ DUMPING METADATA:`, JSON.stringify(metadata))
        
        // --- CHANGE IS HERE ---
        // DO NOT DELETE THE IDENTITY. 
        // DO NOT RETURN 'reauth'.
        // We want the process to STOP so we can inspect the database/logs.
        return res.status(400).json({ 
            message: "Google Login succeeded, but we could not read your email address. Please contact support.",
            debug_id: authIdentityId
        })
    }

    // 4. Check if Customer Exists
    const { data: existingCustomers } = await query.graph({
      entity: "customer",
      fields: ["id"],
      filters: { email },
    })

    let customerId = existingCustomers[0]?.id

    // 5. Create Customer if needed
    if (!customerId) {
        console.log(`✨ Creating new customer for ${email}`)
        const newCustomer = await customerService.createCustomers({
            email,
            first_name: metadata.given_name || "Google",
            last_name: metadata.family_name || "User",
            has_account: true,
            metadata: { avatar: metadata.picture }
        })
        customerId = newCustomer.id
    }

    // 6. Link Identity
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