import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // 1. Safe parsing of body
  const { email } = req.body as { email: string };
  
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const eventBus = req.scope.resolve(Modules.EVENT_BUS);

  // Mock token for now (In production, integrate with Auth module token generation)
  const token = "mock-token-" + Date.now(); 

  await eventBus.emit({
    name: "auth.password_reset",
    data: { 
      email, 
      token, 
      entity_id: email 
    }
  });

  // FIX: Send JSON response, not just status
  // Previous code: res.sendStatus(200); -> caused "OK" text error
  res.status(200).json({ success: true, message: "Reset link sent" });
}