import { sdk } from "@lib/config"
import { cache } from "react"

export const listCategories = cache(async function () {
  return sdk.store.category
    .list(
      // Cast to 'any' to allow the custom '_t' timestamp param
      { 
        fields: "+category_children",
        _t: Date.now() 
      } as any,
      { 
        next: { tags: ["categories"] },
        cache: "no-store"
      }
    )
    .then(({ product_categories }) => product_categories)
})

export const getCategoriesList = cache(async function (
  offset: number = 0,
  limit: number = 100
) {
  return sdk.store.category.list(
    // Cast to 'any'
    { 
      limit, 
      offset,
      _t: Date.now()
    } as any,
    { 
      next: { tags: ["categories"] },
      cache: "no-store"
    }
  )
})

export const getCategoryByHandle = cache(async function (
  categoryHandle: string[]
) {
  return sdk.store.category.list(
    // Cast to 'any'
    { 
      handle: categoryHandle,
      _t: Date.now()
    } as any,
    { 
      next: { tags: ["categories"] },
      cache: "no-store"
    }
  )
})