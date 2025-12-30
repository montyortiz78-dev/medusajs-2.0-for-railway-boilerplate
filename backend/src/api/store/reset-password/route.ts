import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email } = req.body as { email: string };
  if (!email) return res.status(400).json({ message: "Email is required" });

  const customerService = req.scope.resolve(Modules.CUSTOMER);
  const eventBus = req.scope.resolve(Modules.EVENT_BUS);

  // 1. Find Customer
  const customers = await customerService.listCustomers({ email }, { take: 1 });
  if (!customers.length) {
    // Return OK to prevent email enumeration
    return res.status(200).json({ success: true, message: "Reset link sent" });
  }
  const customer = customers[0];

  // 2. Generate & Store Token (Expires in 1 hour)
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiry = Date.now() + 3600000; // 1 hour from now

  await customerService.updateCustomers(customer.id, {
    metadata: {
      ...customer.metadata,
      reset_token: token,
      reset_token_expiry: expiry
    }
  });

  // 3. Emit Event
  await eventBus.emit({
    name: "auth.password_reset",
    data: { email, token, entity_id: email }
  });

  res.status(200).json({ success: true, message: "Reset link sent" });
}