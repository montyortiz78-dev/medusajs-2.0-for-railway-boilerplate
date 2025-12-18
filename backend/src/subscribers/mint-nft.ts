import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { IOrderModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary (Ensure these ENVs are set in backend/.env)
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

  const order = await orderService.retrieveOrder(data.id, {
    relations: ["items", "items.variant", "items.variant.product"],
  })

  // Loop through ALL items in the order
  for (const item of order.items) {
      const metadata = item.metadata as Record<string, any> || {}
      
      // Check if this item has the necessary data to be an NFT
      // We look for 'image_url' (snapshot) and 'kandi_name'
      // This allows ANY product (Standard or Custom) to trigger minting
      // as long as the frontend passed this metadata.
      if (metadata.image_url && metadata.kandi_name) {
          console.log(`[NFT Minting] Processing item: ${item.id} - ${item.title}`)
          
          try {
              // 1. Upload Snapshot to Cloudinary to get a permanent URL
              const uploadRes = await cloudinary.uploader.upload(metadata.image_url, {
                  folder: "kandi-nfts",
                  public_id: `nft_${item.id}`,
                  overwrite: true
              })

              console.log(`[NFT Minting] Image uploaded: ${uploadRes.secure_url}`)

              // 2. Minting Logic (Placeholder)
              // Here you would call your Crossmint or internal API
              // await mintToWallet(order.email, uploadRes.secure_url, metadata)
              
              // For now, we just log success
              console.log(`[NFT Minting] Success for ${item.title}`)

          } catch (e) {
              console.error(`[NFT Minting] Failed for item ${item.id}:`, e)
          }
      } else {
          console.log(`[NFT Minting] Skipping item ${item.id} (No NFT metadata found)`)
      }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}