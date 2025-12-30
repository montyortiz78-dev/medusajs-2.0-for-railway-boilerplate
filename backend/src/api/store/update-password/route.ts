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
  if (!storedToken || storedToken !== token || Date.now() > storedExpiry) {
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

  // 3. Find Auth Identity using Provider Service
  // We use 'any' casting here because TypeScript definitions might be strict regarding the filter props
  const authServiceAny = authService as any;
  
  const providerIdentities = await authServiceAny.listProviderIdentities({
    entity_id: email,
    provider: "emailpass"
  });

  // 4. Delete Old Identity (if found)
  if (providerIdentities.length > 0) {
    // We map to the Auth Identity ID, not the Provider Identity ID
    const authIdentityIds = providerIdentities.map((p: any) => p.auth_identity_id);
    await authService.deleteAuthIdentities(authIdentityIds);
  }

  // 5. Create New Identity with New Password
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