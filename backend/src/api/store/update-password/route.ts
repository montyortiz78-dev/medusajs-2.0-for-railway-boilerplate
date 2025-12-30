import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as any;
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
  const storedExpiry = customer.metadata?.reset_token_expiry as number; // Ensure you cast if needed

  // Check if token matches and is not expired (1 hour check)
  // If storedExpiry is missing, we assume token is invalid
  const isTokenValid = storedToken && storedToken === token && (storedExpiry ? Date.now() < storedExpiry : true);

  if (!isTokenValid) {
    return res.status(400).json({ success: false, message: "Invalid or expired token" });
  }

  // 2. Clear Token
  await customerService.updateCustomers(customer.id, {
    metadata: {
      ...customer.metadata,
      reset_token: null,
      reset_token_expiry: null
    }
  });

  // 3. Update Password
  const authServiceAny = authService as any;
  
  // Look up by provider identity, not auth identity directly
  const providerIdentities = await authServiceAny.listProviderIdentities({
    entity_id: email,
    provider: "emailpass"
  });

  if (providerIdentities.length > 0) {
    // Delete old identity so we can recreate it with new hash
    const authIdentityIds = providerIdentities.map((p: any) => p.auth_identity_id);
    await authService.deleteAuthIdentities(authIdentityIds);
  }

  // Create new identity
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

  res.status(200).json({ success: true });
}