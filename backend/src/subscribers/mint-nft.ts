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

  // 2. Loop through items to find the custom one
  for (const item of order.items) {
    if (item.metadata && item.metadata.pattern_data) {
      logger.info(`💎 Minting NFT for Item: ${item.id}`)
      
      // 3. Get the image and FIX it if necessary
      let imagePayload = item.metadata.image_url as string || "";
      
      // LOGGING: Let's see the first 30 characters to debug
      logger.info(`📸 Image Data Start: ${imagePayload.substring(0, 30)}...`)

      // CHECK: If it's Base64 but missing the URI prefix, add it.
      // We assume it is a PNG since it is generated from a canvas.
      if (imagePayload && !imagePayload.startsWith("http") && !imagePayload.startsWith("data:")) {
          logger.info("🔧 Fixing Base64 prefix...")
          imagePayload = `data:image/png;base64,${imagePayload}`;
      }
      
      // If image is still empty, skip to prevent API error
      if (!imagePayload) {
          logger.error("❌ Image payload is empty. Skipping mint.")
          continue;
      }

      const nftPayload = {
        recipient: `email:${order.email}:base`, 
        metadata: {
          name: item.metadata.kandi_name as string,
          description: item.metadata.kandi_vibe as string,
          image: imagePayload, 
          attributes: [
            { trait_type: "Vibe", value: item.metadata.kandi_vibe },
            { trait_type: "Bead Count", value: (item.metadata.pattern_data as any[]).length },
            { trait_type: "Pattern Data", value: JSON.stringify(item.metadata.pattern_data) } 
          ]
        },
        reuploadLinkedFiles: true // This tells Crossmint to upload the Data URI to IPFS
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
          logger.info(`✅ NFT Minted! ID: ${data.id}`)
        } else {
          logger.error(`❌ Mint Failed: ${JSON.stringify(data)}`)
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