import { cache } from "react"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

/**
 * Helper to fetch categories with strict cache control
 */
const fetchCategories = async (queryParams: Record<string, any>) => {
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_MEDUSA_BACKEND_URL is not defined")
  }

  const url = new URL(`${BACKEND_URL}/store/product-categories`)
  
  // Map parameters to URL search params
  Object.entries(queryParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // Handle arrays (like 'handle' filters)
      value.forEach(v => url.searchParams.append(`${key}[]`, v.toString()))
    } else {
      url.searchParams.append(key, value.toString())
    }
  })

  // Native fetch allows guaranteed cache control
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_KEY || "",
    },
    // ⚡️ FORCE NO CACHE: This ensures deleted categories disappear immediately
    cache: "no-store", 
    next: { tags: ["categories"] },
  })

  const data = await res.json()

  if (!res.ok) {
    // Gracefully handle errors or return empty list
    console.error("Error fetching categories:", data)
    throw new Error(data.message || "Failed to fetch categories")
  }

  return data.product_categories
}

export const listCategories = cache(async function () {
  return fetchCategories({ fields: "+category_children" })
})

export const getCategoriesList = cache(async function (
  offset: number = 0,
  limit: number = 100
) {
  return fetchCategories({ offset, limit })
})

export const getCategoryByHandle = cache(async function (
  categoryHandle: string[]
) {
  return fetchCategories({ handle: categoryHandle })
})