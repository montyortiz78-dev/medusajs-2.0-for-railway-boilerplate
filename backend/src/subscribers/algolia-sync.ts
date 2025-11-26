import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { IProductModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"
import algoliasearch from "algoliasearch"

export default async function algoliaSync({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const productId = event.data.id
  const logger = container.resolve("logger")
  const productService: IProductModuleService = container.resolve(Modules.PRODUCT)

  // 1. Retrieve Keys from Env (Backend)
  const appId = process.env.ALGOLIA_APP_ID
  const adminKey = process.env.ALGOLIA_ADMIN_API_KEY

  if (!appId || !adminKey) {
    logger.warn("⚠️ Algolia credentials missing. Skipping sync.")
    return
  }

  try {
    // 2. Fetch the Product
    const product = await productService.retrieveProduct(productId)
    
    // 3. Connect to Algolia
    const client = algoliasearch(appId, adminKey)
    const index = client.initIndex("products")

    // 4. Construct the Record
    // We map Medusa fields to Algolia fields here
    const algoliaRecord = {
        objectID: product.id, // Unique ID for Algolia
        id: product.id,
        title: product.title,
        handle: product.handle,
        description: product.description,
        thumbnail: product.thumbnail,
        // Add variants or other metadata if needed for search
        variant_sku: product.variants?.map(v => v.sku).filter(Boolean),
    }

    // 5. Save to Index
    await index.saveObject(algoliaRecord)
    logger.info(`🇩🇿 Algolia: Synced product "${product.title}" (${product.id})`)

  } catch (error) {
    logger.error(`❌ Algolia Sync Failed: ${error}`)
  }
}

// Subscribe to relevant events
export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}