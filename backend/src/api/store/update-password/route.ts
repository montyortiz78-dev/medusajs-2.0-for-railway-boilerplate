import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as any
  const email = body.email?.toLowerCase()
  const { token, password } = body

  console.log(`[ResetPassword] Processing reset for: ${email}`)

  if (!email || !token || !password) {
    return res.status(400).json({ success: false, message: "Missing data" })
  }

  const customerService = req.scope.resolve(Modules.CUSTOMER)
  const authService = req.scope.resolve(Modules.AUTH)

  // 1. Verify Customer & Token
  const customers = await customerService.listCustomers({ email }, { take: 1 })
  
  if (!customers.length) {
    // Return error if customer not found
    return res.status(400).json({ success: false, message: "Invalid request" })
  }
  
  const customer = customers[0]
  const storedToken = customer.metadata?.reset_token
  const storedExpiry = customer.metadata?.reset_token_expiry as number

  // Validate token match and expiry
  if (!storedToken || storedToken !== token || (storedExpiry && Date.now() > storedExpiry)) {
    console.warn(`[ResetPassword] Invalid/Expired token for ${email}`)
    return res.status(400).json({ success: false, message: "Invalid or expired token" })
  }

  // 2. Update the Password via the Auth Provider
  // Instead of deleting the identity, we update the credentials on the existing one.
  try {
    await authService.updateProvider("emailpass", {
      entity_id: email,
      password: password,
    })
    console.log(`[ResetPassword] Password updated for ${email}`)
  } catch (error) {
    console.error(`[ResetPassword] Failed to update auth provider:`, error)
    return res.status(400).json({ success: false, message: "Failed to update password" })
  }

  // 3. Clear Token from Customer Metadata
  await customerService.updateCustomers(customer.id, {
    metadata: {
      ...customer.metadata,
      reset_token: null,
      reset_token_expiry: null
    }
  })

  res.status(200).json({ success: true, message: "Password updated successfully" })
}