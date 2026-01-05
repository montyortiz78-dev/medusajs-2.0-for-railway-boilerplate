import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IAuthModuleService, ICustomerModuleService } from "@medusajs/framework/types"

// Types for strict TS
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
    // 1. Get Identity & Metadata
    const identity = await authService.retrieveAuthIdentity(authIdentityId) as unknown as GoogleAuthIdentity
    
    // 2. Check if already linked (Idempotency)
    if (identity.app_metadata?.actor_id) {
        // Double check the customer actually exists
        try {
            await customerService.retrieveCustomer(identity.app_metadata.actor_id)
            return res.status(200).json({ status: "linked", customer_id: identity.app_metadata.actor_id })
        } catch {
            // If linked but customer missing, fall through to re-create (Zombie case)
            console.log("🧟 Zombie link detected, recreating customer...")
        }
    }

    const email = identity.provider_metadata?.email
    const firstName = identity.provider_metadata?.given_name || "Google"
    const lastName = identity.provider_metadata?.family_name || "User"
    const picture = identity.provider_metadata?.picture

    // 3. Handle Corrupted Identity (No Email from Google)
    if (!email) {
        console.log(`⚠️ Identity ${authIdentityId} missing email. Deleting to force fresh auth.`)
        await authService.deleteAuthIdentities([authIdentityId])
        return res.status(200).json({ status: "deleted", action: "reauth" })
    }

    // 4. Check for Existing Customer (by Email) to prevent duplicates
    const { data: existingCustomers } = await query.graph({
      entity: "customer",
      fields: ["id"],
      filters: { email },
    })

    let customerId = existingCustomers[0]?.id

    // 5. Create Customer if needed
    if (!customerId) {
        const newCustomer = await customerService.createCustomers({
            email,
            first_name: firstName,
            last_name: lastName,
            has_account: true,
            metadata: { avatar: picture }
        })
        customerId = newCustomer.id
    }

    // 6. Link Identity to Customer
    await authService.updateAuthIdentities([{
        id: authIdentityId,
        app_metadata: {
            actor_id: customerId,
            actor_type: "customer"
        }
    }])

    return res.status(200).json({ status: "success", customer_id: customerId })

  } catch (error) {
    console.error("Onboarding Error:", error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}