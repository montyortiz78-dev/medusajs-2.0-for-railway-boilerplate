import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"

export default async function resetPasswordSubscriber({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; email: string }>) {
  const notificationModuleService: INotificationModuleService = container.resolve(
    Modules.NOTIFICATION
  )

  // Determine the frontend URL:
  // 1. Try STORE_URL (Best for production)
  // 2. Try the first entry of STORE_CORS
  // 3. Fallback to localhost
  const frontendUrl = 
    process.env.STORE_URL || 
    process.env.STORE_CORS?.split(",")[0] || 
    "http://localhost:8000"

  const resetLink = `${frontendUrl}/reset-password?token=${data.token}&email=${data.email}`

  await notificationModuleService.createNotifications({
    to: data.email,
    channel: "email",
    template: "forgot-password", // Must match key in templates/index.tsx
    data: {
      username: data.email.split("@")[0],
      resetLink,
      emailOptions: {
        subject: "Reset your password",
      },
    },
  })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}