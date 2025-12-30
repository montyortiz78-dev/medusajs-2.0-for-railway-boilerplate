import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email, token, password } = req.body as any;

  if (!email || !token || !password) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  const customerService = req.scope.resolve(Modules.CUSTOMER);
  const authService = req.scope.resolve(Modules.AUTH);

  // 1. Verify Token
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

  // 3. Update Password
  // FIX: Cast to 'any' to avoid strict type error on 'entity_id'
  const identities = await authService.listAuthIdentities({
    entity_id: email,
    provider: "emailpass"
  } as any);

  if (identities.length > 0) {
    await authService.deleteAuthIdentities([identities[0].id]);
  }

  // FIX: Cast to 'any' to allow passing entity_id and provider_metadata
  await authService.createAuthIdentities([{
    entity_id: email,
    provider: "emailpass",
    provider_metadata: {
      password: password 
    }
  }] as any);

  res.status(200).json({ success: true });
}