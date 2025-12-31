"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"

export const retrieveOrder = cache(async function (id: string) {
  const headers = getAuthHeaders()
  
  return sdk.store.order
    .retrieve(
      id,
      { fields: "*payment_collections.payments" },
      { next: { tags: ["order"] }, ...headers } as any
    )
    .then(({ order }) => order)
    .catch((err) => {
      console.error(`❌ retrieveOrder Error (${id}):`, err.message)
      return null
    })
})

export const listOrders = cache(async function (
  limit: number = 10,
  offset: number = 0
) {
  const headers = getAuthHeaders()

  // --- DEBUGGING: CHECK BOTH TOKEN AND KEY ---
  const hasToken = !!headers.authorization
  const hasKey = !!headers["x-publishable-api-key"]
  
  if (hasToken && hasKey) {
    console.log("✅ listOrders: Auth Token & API Key present. Fetching orders...")
  } else {
    console.error("⚠️ listOrders: MISSING HEADERS. Token:", hasToken, "Key:", hasKey)
  }
  // ------------------------------------------

  return sdk.store.order
    .list(
      // Keep fields simple to avoid permission errors on complex relations
      { limit, offset, fields: "+payment_collections.payments" },
      { next: { tags: ["order"] }, ...headers } as any
    )
    .then(({ orders }) => orders)
    .catch((err) => {
      console.error("❌ listOrders Error:", err.message)
      return null 
    })
})