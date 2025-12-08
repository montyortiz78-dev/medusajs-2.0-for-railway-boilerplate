'use server'

import { sdk } from "@lib/config"
import { getMedusaHeaders } from "@lib/data/cookies"
import { HttpTypes } from "@medusajs/types"

export async function getCustomKandiProduct(handle: string, regionId?: string) {
  try {
    const { products } = await sdk.store.product.list(
      { 
        handle, 
        fields: "*variants.calculated_price,+options,+variants",
        region_id: regionId
      },
      { next: { tags: ['products'] }, ...getMedusaHeaders(['products']) }
    )
    
    return products[0] || null
  } catch (error) {
    console.error("Failed to fetch custom kandi product:", error)
    return null
  }
}