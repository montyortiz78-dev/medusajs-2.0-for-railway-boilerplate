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

  // You might need to construct the URL based on your frontend URL environment variable
  const frontendUrl = process.env.STORE_CORS?.split(",")[0] || "http://localhost:8000"
  const resetLink = `${frontendUrl}/reset-password?token=${data.token}&email=${data.email}`

  await notificationModuleService.createNotifications({
    to: data.email,
    channel: "email",
    template: "forgot-password", // Matches the key in templates/index.tsx
    data: {
      username: data.email.split("@")[0], // Or fetch the customer name if available
      resetLink,
      emailOptions: {
        subject: "Reset your password",
      },
    },
  })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset", // Ensure this matches the event emitted by your auth flow
}