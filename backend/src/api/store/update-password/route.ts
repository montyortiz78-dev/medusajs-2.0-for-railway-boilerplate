import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email, token, password } = req.body as any;

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

  if (!storedToken || storedToken !== token || Date.now() > storedExpiry) {
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

  // 3. Find the Auth Identity via Provider Identity
  // We cast to 'any' to access listProviderIdentities which might not be in the high-level interface types yet
  const authServiceAny = authService as any;
  
  const providerIdentities = await authServiceAny.listProviderIdentities({
    entity_id: email,
    provider: "emailpass"
  });

  // 4. Delete Old Identity (if exists)
  if (providerIdentities.length > 0) {
    await authService.deleteAuthIdentities([providerIdentities[0].auth_identity_id]);
  }

  // 5. Create New Identity with New Password
  // We link it back to the customer using app_metadata
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