import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { IOrderModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"
import { v2 as cloudinary } from 'cloudinary'

export default async function handleNftMinting({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const orderService: IOrderModuleService = container.resolve(Modules.ORDER)
  const { id } = event.data

  // 1. Configure Cloudinary
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const cloudKey = process.env.CLOUDINARY_API_KEY
  const cloudSecret = process.env.CLOUDINARY_API_SECRET

  if (cloudName && cloudKey && cloudSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: cloudKey,
      api_secret: cloudSecret
    });
  } else {
    logger.error("❌ Cloudinary Config Missing! Cannot host images.")
    return
  }

  // 2. Get the Order
  const order = await orderService.retrieveOrder(id, { relations: ["items"] })

  const apiKey = process.env.CROSSMINT_API_KEY
  const collectionId = process.env.CROSSMINT_COLLECTION_ID

  if (!apiKey || !collectionId) {
    logger.error("❌ Crossmint Config Missing!")
    return
  }

  // 3. Loop through items
  for (const item of order.items) {
    if (item.metadata && item.metadata.pattern_data) {
      logger.info(`💎 Processing Item: ${item.id}`)
      
      try {
        // --- STEP A: HOST THE IMAGE ---
        let imageUrl = "";
        let base64Image = item.metadata.image_url as string;

        if (!base64Image) {
            logger.warn("⚠️ No image data found. Skipping.")
            continue;
        }

        // Ensure Base64 prefix exists
        if (!base64Image.startsWith("data:")) {
            base64Image = `data:image/png;base64,${base64Image}`;
        }

        logger.info("☁️ Uploading image to Cloudinary...");
        
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(base64Image, {
            folder: "kandi-orders",
        });

        imageUrl = uploadResult.secure_url;
        logger.info(`✅ Image Hosted at: ${imageUrl}`);

        // --- STEP B: MINT THE NFT ---
        const nftPayload = {
          recipient: `email:${order.email}:base`, 
          metadata: {
            name: item.metadata.kandi_name as string,
            description: item.metadata.kandi_vibe as string,
            image: imageUrl, // Now we use the real HTTP URL
            attributes: [
              { trait_type: "Vibe", value: item.metadata.kandi_vibe },
              { trait_type: "Generated", value: "True" }
            ]
          },
          reuploadLinkedFiles: true 
        }

        // Use PRODUCTION URL
        const crossmintUrl = `https://www.crossmint.com/api/2022-06-09/collections/${collectionId}/nfts`;
        
        const response = await fetch(crossmintUrl, {
            method: "POST",
            headers: {
              "X-API-KEY": apiKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(nftPayload)
          }
        )

        const responseText = await response.text();
        
        if (!response.ok) {
            logger.error(`❌ Mint Failed (${response.status}): ${responseText}`);
        } else {
            const data = JSON.parse(responseText);
            logger.info(`✅ NFT Minted Successfully! ID: ${data.id}`)
        }

      } catch (error) {
        logger.error(`❌ Error processing NFT: ${error}`)
      }
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}