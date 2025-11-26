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

  // 1. Retrieve the Order
  const order = await orderService.retrieveOrder(id, { relations: ["items"] })

  const apiKey = process.env.CROSSMINT_API_KEY
  const collectionId = process.env.CROSSMINT_COLLECTION_ID

  // Safety Check: Print ID status (don't print the actual key for security)
  if (!apiKey || !collectionId) {
    logger.error("❌ Crossmint Config Missing (API Key or Collection ID)")
    return
  }
  logger.info(`✅ using Collection ID: ${collectionId}`)

  // 2. Loop through items
  for (const item of order.items) {
    if (item.metadata && item.metadata.pattern_data) {
      logger.info(`💎 Minting NFT for Item: ${item.id}`)
      
      // 3. Prepare the Image
      let imagePayload = item.metadata.image_url as string || "";

      // FIX: Ensure it is a valid Data URI
      if (imagePayload && !imagePayload.startsWith("http") && !imagePayload.startsWith("data:")) {
          logger.info("🔧 Formatting Base64 string to Data URI...")
          imagePayload = `data:image/png;base64,${imagePayload}`;
      }

      // If still empty, use a fallback so the mint doesn't fail entirely
      if (!imagePayload) {
          logger.warn("⚠️ No image found in metadata. Using Stock Fallback.")
          imagePayload = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Kandi_bracelets.jpg/800px-Kandi_bracelets.jpg";
      }

      const nftPayload = {
        recipient: `email:${order.email}:base`, 
        metadata: {
          name: item.metadata.kandi_name as string,
          description: item.metadata.kandi_vibe as string,
          image: imagePayload, 
          attributes: [
            { trait_type: "Vibe", value: item.metadata.kandi_vibe },
            { trait_type: "Generated", value: "True" }
          ]
        },
        reuploadLinkedFiles: true // Important for Data URIs
      }

      try {
        // USE PRODUCTION URL explicitly
        const url = `https://www.crossmint.com/api/2022-06-09/collections/${collectionId}/nfts`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
              "X-API-KEY": apiKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(nftPayload)
          }
        )

        // READ RESPONSE SAFELY
        const responseText = await response.text();
        
        if (!response.ok) {
            // This logs the ACTUAL error from Crossmint (e.g., "Image too large")
            logger.error(`❌ Mint Failed (${response.status}): ${responseText}`);
        } else {
            const data = JSON.parse(responseText);
            logger.info(`✅ NFT Minted Successfully! ID: ${data.id}`)
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