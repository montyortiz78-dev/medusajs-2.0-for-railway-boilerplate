import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { IOrderModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export default async function handleNftMinting({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService: IOrderModuleService = container.resolve(Modules.ORDER)

  // 1. Retrieve Order with Items
  const order = await orderService.retrieveOrder(data.id, {
    relations: ["items"],
  })

  // 2. Process Items
  for (const item of order.items) {
      const metadata = (item.metadata || {}) as Record<string, any>
      
      // Only proceed if we have a custom image
      if (metadata.image_url && metadata.kandi_name) {
          console.log(`[NFT Minting] Found Kandi Item: ${item.id}`)
          
          try {
              // A. Upload to Cloudinary (Folder: kandi-orders)
              const uploadRes = await cloudinary.uploader.upload(metadata.image_url, {
                  folder: "kandi-orders", 
                  public_id: `order_${order.display_id}_item_${item.id}`,
                  overwrite: true
              })

              console.log(`[NFT Minting] Snapshot saved: ${uploadRes.secure_url}`)

              // B. Mint NFT via Crossmint
              const apiKey = process.env.CROSSMINT_API_KEY
              const collectionId = process.env.CROSSMINT_COLLECTION_ID
              const chain = process.env.CROSSMINT_CHAIN || "base"

              if (!apiKey || !collectionId) {
                  console.error("[NFT Minting] Skipped: Missing Crossmint API Keys")
                  continue
              }

              const response = await fetch(`https://www.crossmint.com/api/2022-06-09/collections/${collectionId}/nfts`, {
                  method: "POST",
                  headers: {
                      "X-API-KEY": apiKey,
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                      recipient: `email:${order.email}:${chain}`, 
                      metadata: {
                          name: metadata.kandi_name,
                          image: uploadRes.secure_url,
                          description: metadata.kandi_vibe || "Custom Kandi Bracelet",
                          attributes: [
                              { trait_type: "Vibe", value: metadata.kandi_vibe || "Original" },
                              { trait_type: "Order ID", value: String(order.display_id) }
                          ]
                      }
                  })
              })

              const result = await response.json()

              if (response.ok) {
                  console.log(`[NFT Minting] Success! ID: ${result.id}`)
              } else {
                  console.error(`[NFT Minting] Crossmint Error:`, result)
              }

          } catch (e) {
              console.error(`[NFT Minting] Failed for item ${item.id}:`, e)
          }
      }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}