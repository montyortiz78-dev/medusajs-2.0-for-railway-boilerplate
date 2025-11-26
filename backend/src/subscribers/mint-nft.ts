import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { IOrderModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"

export default async function handleNftMinting({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const orderService: IOrderModuleService = container.resolve(Modules.ORDER)
  const { id } = event.data

  // 1. Get the Order
  const order = await orderService.retrieveOrder(id, { relations: ["items"] })

  const apiKey = process.env.CROSSMINT_API_KEY
  const collectionId = process.env.CROSSMINT_COLLECTION_ID

  if (!apiKey || !collectionId) {
    logger.error("❌ Crossmint Config Missing!")
    return
  }

  // 2. Loop through items
  for (const item of order.items) {
    if (item.metadata && item.metadata.pattern_data) {
      logger.info(`💎 Minting NFT for Item: ${item.id}`)
      
      // --- DEBUGGING MODE ON ---
      // We are ignoring the real image for one test to prove the connection works.
      
      // A placeholder image (Kandi bracelet example)
      const TEST_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Kandi_bracelets.jpg/800px-Kandi_bracelets.jpg";
      
      logger.info("⚠️ USING HARDCODED TEST IMAGE to debug API connection.");

      const nftPayload = {
        recipient: `email:${order.email}:base`, 
        metadata: {
          name: "TEST MINT - " + (item.metadata.kandi_name as string),
          description: "Debugging Crossmint Connection",
          image: TEST_IMAGE_URL, // <--- Forcing a valid URL here
          attributes: [
            { trait_type: "Vibe", value: "Debugging" }
          ]
        },
        reuploadLinkedFiles: true 
      }

      try {
        const response = await fetch(
          `https://www.crossmint.com/api/2022-06-09/collections/${collectionId}/nfts`,
          {
            method: "POST",
            headers: {
              "X-API-KEY": apiKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(nftPayload)
          }
        )

        const data = await response.json()
        
        if (response.ok) {
          logger.info(`✅ SUCCESS! Test NFT Minted! ID: ${data.id}`)
          logger.info("CONCLUSION: The API works. The issue is your Base64 Image string.");
        } else {
          logger.error(`❌ TEST FAILED: ${JSON.stringify(data)}`)
          logger.info("CONCLUSION: The issue is the API Key, Collection ID, or Payload structure.");
        }
      } catch (error) {
        logger.error(`❌ Network Error: ${error}`)
      }
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}