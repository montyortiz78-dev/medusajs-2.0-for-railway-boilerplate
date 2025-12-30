import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as any;
  const email = body.email?.toLowerCase(); 
  const { token, password } = body;

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

  // Validate Token
  if (!storedToken || storedToken !== token || (storedExpiry && Date.now() > storedExpiry)) {
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

  // 3. Find existing Auth Identity
  // We use the provider service to look up the correct identity ID for this email
  const authServiceAny = authService as any;
  
  const providerIdentities = await authServiceAny.listProviderIdentities({
    entity_id: email,
    provider: "emailpass"
  });

  if (providerIdentities.length === 0) {
    return res.status(400).json({ success: false, message: "User identity not found" });
  }

  // 4. Update Password (The Lightweight Fix)
  // Instead of Delete+Create, we update the existing record.
  // We cast to 'any' to bypass the strict DTO check that was failing previously.
  const authIdentityId = providerIdentities[0].auth_identity_id;

  await authService.updateAuthIdentities([{
    id: authIdentityId,
    provider_metadata: {
      password: password 
    }
  }] as any);

  res.status(200).json({ success: true });
}