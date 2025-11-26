import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { Modules } from "@medusajs/utils"
import { algoliasearch } from "algoliasearch" // FIX 1: Named import for v5

export default async function algoliaSync({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const productId = event.data.id
  const logger = container.resolve("logger")
  
  // FIX 2: Use 'any' to bypass strict type mismatch error during build
  const productService: any = container.resolve(Modules.PRODUCT)

  // 1. Retrieve Keys
  const appId = process.env.ALGOLIA_APP_ID
  const adminKey = process.env.ALGOLIA_ADMIN_API_KEY

  if (!appId || !adminKey) {
    logger.warn("⚠️ Algolia credentials missing. Skipping sync.")
    return
  }

  try {
    // 2. Fetch the Product
    const product = await productService.retrieveProduct(productId)
    
    // 3. Connect to Algolia (v5 Syntax)
    const client = algoliasearch(appId, adminKey)

    // 4. Construct the Record
    const algoliaRecord = {
        objectID: product.id, 
        id: product.id,
        title: product.title,
        handle: product.handle,
        description: product.description,
        thumbnail: product.thumbnail,
        variant_sku: product.variants?.map((v: any) => v.sku).filter(Boolean),
    }

    // 5. Save to Index (v5 Syntax - no initIndex)
    await client.saveObject({
        indexName: "products",
        body: algoliaRecord
    })
    
    logger.info(`🇩🇿 Algolia: Synced product "${product.title}" (${product.id})`)

  } catch (error) {
    logger.error(`❌ Algolia Sync Failed: ${error}`)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}