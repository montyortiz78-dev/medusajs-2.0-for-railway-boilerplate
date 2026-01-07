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

  // Retrieve the order with items
  const order = await orderService.retrieveOrder(data.id, {
    relations: ["items", "items.variant", "items.variant.product"],
  })

  // Loop through items
  for (const item of order.items) {
      const metadata = item.metadata as Record<string, any> || {}
      
      // Check for required metadata (snapshot URL and Name)
      if (metadata.image_url && metadata.kandi_name) {
          console.log(`[NFT Minting] Processing item: ${item.id} - ${item.title}`)

          try {
              // 1. Upload Snapshot to Cloudinary
              const uploadRes = await cloudinary.uploader.upload(metadata.image_url, {
                  folder: "kandi-nfts",
                  public_id: `nft_${item.id}`,
                  overwrite: true
              })

              console.log(`[NFT Minting] Image uploaded: ${uploadRes.secure_url}`)

              // 2. Mint with Crossmint
              const apiKey = process.env.CROSSMINT_API_KEY
              const collectionId = process.env.CROSSMINT_COLLECTION_ID
              // Default to 'base' (Mainnet). Use 'base-sepolia' for Testnet.
              const chain = process.env.CROSSMINT_CHAIN || "base" 

              if (!apiKey || !collectionId) {
                  console.error("[NFT Minting] Missing Crossmint Credentials (API_KEY or COLLECTION_ID)")
                  continue
              }

              // Call Crossmint Minting API
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
                          description: metadata.kandi_vibe || "A custom Kandi bracelet.",
                          attributes: [
                              { trait_type: "Vibe", value: metadata.kandi_vibe || "Original" },
                              { trait_type: "Item ID", value: item.id }
                          ]
                      }
                  })
              })

              const result = await response.json()

              if (response.ok) {
                  console.log(`[NFT Minting] Success! Request ID: ${result.id}`)
              } else {
                  console.error(`[NFT Minting] Crossmint Failed:`, result)
              }

          } catch (e) {
              console.error(`[NFT Minting] Unexpected Error for item ${item.id}:`, e)
          }
      } else {
          console.log(`[NFT Minting] Skipping item ${item.id} (No NFT metadata found)`)
      }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}