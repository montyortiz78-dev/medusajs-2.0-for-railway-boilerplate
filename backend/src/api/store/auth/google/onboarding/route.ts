import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IAuthModuleService, ICustomerModuleService } from "@medusajs/framework/types"

type AuthenticatedRequest = MedusaRequest & {
  auth_context?: { auth_identity_id: string }
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
    // 1. Retrieve the Identity using GRAPH (Bypasses Service DTO issues)
    // We explicitly ask for the fields we need. 
    // Note: The entity name is usually "auth_identity" or "authIdentity". We try the standard graph name.
    const { data: identities } = await query.graph({
        entity: "auth_identity",
        fields: ["id", "provider_metadata", "user_metadata", "app_metadata", "provider_id"],
        filters: { id: authIdentityId }
    })

    const identity = identities?.[0]

    // 2. Safety Check: Did we find it?
    if (!identity) {
        console.error(`❌ CRITICAL: Auth Identity ${authIdentityId} not found in database via Query.`)
        return res.status(404).json({ message: "Identity not found" })
    }
    
    // Debug logging
    console.log("🔍 INSPECTING IDENTITY (GRAPH):", JSON.stringify(identity, null, 2))

    // 3. Extract Email (Robust Check)
    // Query Graph returns snake_case or camelCase depending on config, so we check both to be safe.
    const providerMeta = identity.provider_metadata || identity.providerMetadata || {}
    const userMeta = identity.user_metadata || identity.userMetadata || {}
    
    const email = 
        providerMeta.email || 
        userMeta.email || 
        identity.email

    // 4. FATAL ERROR CHECK & SELF HEALING
    if (!email) {
        console.error(`❌ CRITICAL FAILURE: Identity ${authIdentityId} has NO EMAIL in DB.`)
        console.error(`❌ DUMPING METADATA:`, JSON.stringify(providerMeta))
        
        // --- SELF HEALING ---
        // Delete the broken identity so the user isn't stuck in a loop.
        console.warn(`⚠️ Deleting broken identity ${authIdentityId} to allow retry.`)
        await authService.deleteAuthIdentities([authIdentityId])

        return res.status(400).json({ 
            message: "Login failed to retrieve email. We have reset your session. Please try logging in with Google again.",
            status: "deleted"
        })
    }

    // 5. Check if Customer Exists
    const { data: existingCustomers } = await query.graph({
      entity: "customer",
      fields: ["id"],
      filters: { email },
    })

    let customerId = existingCustomers[0]?.id

    // 6. Create Customer if needed
    if (!customerId) {
        console.log(`✨ Creating new customer for ${email}`)
        const newCustomer = await customerService.createCustomers({
            email,
            first_name: providerMeta.given_name || "Google",
            last_name: providerMeta.family_name || "User",
            has_account: true,
            metadata: { avatar: providerMeta.picture }
        })
        customerId = newCustomer.id
    }

    // 7. Link Identity
    // Check both snake_case and camelCase for app_metadata
    const appMetadata = identity.app_metadata || identity.appMetadata || {}
    
    if (appMetadata.actor_id !== customerId) {
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