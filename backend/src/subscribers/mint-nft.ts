import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { IOrderModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"

export default async function handleNftMinting({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  // 1. Get the Logger (to print messages to your Railway console)
  const logger = container.resolve("logger")
  const orderService: IOrderModuleService = container.resolve(Modules.ORDER)

  const { id } = event.data

  logger.info(`🎨 PHYGITAL LISTENER: New Order Placed! ID: ${id}`)

  // 2. Fetch the full order details to see the items
  const order = await orderService.retrieveOrder(id, {
    relations: ["items"],
  })

  // 3. Loop through items to find Custom Kandi
  for (const item of order.items) {
    // We look for the 'metadata' we saved from the frontend
    if (item.metadata && item.metadata.pattern_data) {
      logger.info(`------------------------------------------------`)
      logger.info(`💎 FOUND CUSTOM KANDI! Ready to Mint NFT.`)
      logger.info(`Item ID: ${item.id}`)
      logger.info(`Kandi Name: ${item.metadata.kandi_name}`)
      logger.info(`Vibe Story: ${item.metadata.kandi_vibe}`)
      
      // This is where we will plug in the Crossmint/Thirdweb API later
      logger.info(`Pattern Data: ${JSON.stringify(item.metadata.pattern_data)}`)
      logger.info(`------------------------------------------------`)
    }
  }
}

// 4. Tell Medusa which event to listen for
export const config: SubscriberConfig = {
  event: "order.placed",
}