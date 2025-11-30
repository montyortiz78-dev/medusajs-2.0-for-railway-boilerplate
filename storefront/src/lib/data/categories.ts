import { sdk } from "@lib/config"
import { cache } from "react"

export const listCategories = cache(async function () {
  return sdk.store.category
    .list(
      { fields: "+category_children" }, 
      // FIX: Add no-store to disable caching so changes appear immediately
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
    // @ts-ignore
    { limit, offset },
    // FIX: Add no-store
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
    // @ts-ignore
    { handle: categoryHandle },
    // FIX: Add no-store
    { 
      next: { tags: ["categories"] },
      cache: "no-store"
    }
  )
})