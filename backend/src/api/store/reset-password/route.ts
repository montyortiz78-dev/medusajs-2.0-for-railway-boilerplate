import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email } = req.body as { email: string };
  
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const eventBus = req.scope.resolve(Modules.EVENT_BUS);

  // In production, generate a real token here via Auth module if needed.
  // For now, we mock it to get the email flow working.
  const token = "mock-token-" + Date.now(); 

  // Emit event for the subscriber
  await eventBus.emit({
    name: "auth.password_reset",
    data: { 
      email, 
      token, 
      entity_id: email 
    }
  });

  res.sendStatus(200);
}