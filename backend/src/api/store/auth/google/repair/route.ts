import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IAuthModuleService, ICustomerModuleService } from "@medusajs/framework/types"

// 1. Helper type for Request to include auth_context
type AuthenticatedRequest = MedusaRequest & {
  auth_context?: {
    auth_identity_id: string
  }
}

// 2. Helper type for Identity to include Google metadata
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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // CAST #1: Treat req as AuthenticatedRequest
  const authIdentityId = (req as AuthenticatedRequest).auth_context?.auth_identity_id

  if (!authIdentityId) {
    return res.status(401).json({ message: "Unauthorized: No valid token" })
  }

  const authService: IAuthModuleService = req.scope.resolve(Modules.AUTH)
  const customerService: ICustomerModuleService = req.scope.resolve(Modules.CUSTOMER)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    // CAST #2: Retrieve identity and cast to our helper type
    const identity = await authService.retrieveAuthIdentity(authIdentityId) as unknown as GoogleAuthIdentity
    
    // 3. Check if the linked customer actually exists
    const currentActorId = identity.app_metadata?.actor_id
    let customerExists = false

    if (currentActorId) {
      try {
        await customerService.retrieveCustomer(currentActorId)
        customerExists = true
      } catch (e) {
        console.log(`🧟 Zombie Customer detected: ${currentActorId}`)
      }
    }

    if (customerExists) {
      return res.json({ message: "Customer is healthy", repaired: false })
    }

    // 4. REPAIR: Create a new customer using the Google Metadata
    console.log("🛠️ Repairing Identity linkage...")
    
    const email = identity.provider_metadata?.email
    const firstName = identity.provider_metadata?.given_name || "Google"
    const lastName = identity.provider_metadata?.family_name || "User"
    const picture = identity.provider_metadata?.picture

    if (!email) {
      return res.status(400).json({ message: "No email in provider metadata" })
    }

    // Check if a customer with this email already exists (orphaned)
    const { data: existingCustomers } = await query.graph({
      entity: "customer",
      fields: ["id"],
      filters: { email },
    })

    let newCustomerId = existingCustomers[0]?.id

    // Create if doesn't exist
    if (!newCustomerId) {
      const newCustomer = await customerService.createCustomers({
        email,
        first_name: firstName,
        last_name: lastName,
        has_account: true,
        metadata: { avatar: picture }
      })
      newCustomerId = newCustomer.id
    }

    // 5. Update the Identity to point to the valid Customer
    await authService.updateAuthIdentities([{
      id: authIdentityId,
      app_metadata: {
        actor_id: newCustomerId,
        actor_type: "customer"
      }
    }])

    return res.json({ message: "Identity repaired", repaired: true, customer_id: newCustomerId })

  } catch (error) {
    console.error("Repair failed:", error)
    return res.status(500).json({ message: "Internal Error" })
  }
}