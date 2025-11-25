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

  const order = await orderService.retrieveOrder(id, { relations: ["items"] })

  const apiKey = process.env.CROSSMINT_API_KEY
  const collectionId = process.env.CROSSMINT_COLLECTION_ID

  if (!apiKey || !collectionId) {
    logger.error("❌ Crossmint Config Missing!")
    return
  }

  for (const item of order.items) {
    if (item.metadata && item.metadata.pattern_data) {
      logger.info(`💎 Minting NFT for Item: ${item.id}`)
      
      // 1. Get the image data (It might be a URL or a Base64 string)
      // The frontend is sending a Base64 Data URI, which Crossmint DOES support for uploads.
      const imagePayload = item.metadata.image_url as string; 
      
      const nftPayload = {
        recipient: `email:${order.email}:base`, 
        metadata: {
          name: item.metadata.kandi_name as string,
          description: item.metadata.kandi_vibe as string,
          image: imagePayload, // Pass the Base64 string directly!
          attributes: [
            { trait_type: "Vibe", value: item.metadata.kandi_vibe },
            { trait_type: "Bead Count", value: (item.metadata.pattern_data as any[]).length },
            { trait_type: "Pattern Data", value: JSON.stringify(item.metadata.pattern_data) } 
          ]
        },
        reuploadLinkedFiles: true // This tells Crossmint "Take this string and turn it into an IPFS file for me"
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