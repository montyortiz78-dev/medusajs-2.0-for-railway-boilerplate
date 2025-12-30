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
  const storedExpiry = customer.metadata?.reset_token_expiry as number;

  if (!storedToken || storedToken !== token || (storedExpiry && Date.now() > storedExpiry)) {
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

  // 3. Find Old Identity
  const authServiceAny = authService as any;
  const providerIdentities = await authServiceAny.listProviderIdentities({
    entity_id: email,
    provider: "emailpass"
  });

  // 4. Delete Old Identity & Wait
  if (providerIdentities.length > 0) {
    const ids = providerIdentities.map((p: any) => p.auth_identity_id);
    console.log(`[ResetPassword] Deleting identities: ${ids}`);
    await authService.deleteAuthIdentities(ids);
    
    // --- KEY FIX: Add 1s delay to prevent Redis Race Condition ---
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 5. Create New Identity (Ensures Password Hashing)
  console.log(`[ResetPassword] Creating new identity...`);
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

  console.log(`[ResetPassword] Success.`);
  res.status(200).json({ success: true });
}