import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as any;
  // Ensure consistent casing
  const email = body.email?.toLowerCase(); 
  const { token, password } = body;

  console.log(`[ResetPassword] Processing reset for: ${email}`);

  if (!email || !token || !password) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  const customerService = req.scope.resolve(Modules.CUSTOMER);
  const authService = req.scope.resolve(Modules.AUTH);

  // 1. Verify Customer & Token
  const customers = await customerService.listCustomers({ email }, { take: 1 });
  if (!customers.length) {
    return res.status(400).json({ success: false, message: "Invalid request" });
  }
  
  const customer = customers[0];
  const storedToken = customer.metadata?.reset_token;
  const storedExpiry = customer.metadata?.reset_token_expiry as number;

  // Validate Token (Check existence, match, and expiry)
  if (!storedToken || storedToken !== token || (storedExpiry && Date.now() > storedExpiry)) {
    console.warn(`[ResetPassword] Token invalid for ${email}`);
    return res.status(400).json({ success: false, message: "Invalid or expired token" });
  }

  // 2. Clear Token (Prevent Re-use)
  await customerService.updateCustomers(customer.id, {
    metadata: {
      ...customer.metadata,
      reset_token: null,
      reset_token_expiry: null
    }
  });

  // 3. Find OR Create Auth Identity
  const authServiceAny = authService as any;
  
  // Try to find the user's login credentials
  const providerIdentities = await authServiceAny.listProviderIdentities({
    entity_id: email,
    provider: "emailpass"
  });

  if (providerIdentities.length > 0) {
    // SCENARIO A: Identity found -> Update the password
    console.log(`[ResetPassword] Identity found. Updating password.`);
    const authIdentityId = providerIdentities[0].auth_identity_id;

    await authService.updateAuthIdentities([{
      id: authIdentityId,
      provider_metadata: {
        password: password 
      }
    }] as any);

  } else {
    // SCENARIO B: Identity NOT found (Orphaned) -> Create a new one
    // This fixes the "User identity not found" error by restoring access.
    console.log(`[ResetPassword] Identity missing. Creating new identity...`);
    
    await authService.createAuthIdentities([{
      entity_id: email,
      provider: "emailpass",
      provider_metadata: {
        password: password 
      },
      app_metadata: {
        customer_id: customer.id 
      }
    }] as any);
  }

  console.log(`[ResetPassword] Success.`);
  res.status(200).json({ success: true });
}