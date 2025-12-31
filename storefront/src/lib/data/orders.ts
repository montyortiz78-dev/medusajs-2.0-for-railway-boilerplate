"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"

export const retrieveOrder = cache(async function (id: string) {
  const headers = getAuthHeaders()
  
  // Debug Log
  if (!headers.authorization) console.warn(`⚠️ retrieveOrder: Missing Auth Token for ID ${id}`)

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

  // Debug Log
  if (headers.authorization) {
    console.log("✅ listOrders: Auth Token present. Fetching orders...")
  } else {
    console.warn("⚠️ listOrders: No Auth Token found. This will likely fail or return empty.")
  }

  return sdk.store.order
    .list(
      { limit, offset, fields: "*payment_collections.payments" },
      { next: { tags: ["order"] }, ...headers } as any
    )
    .then(({ orders }) => orders)
    .catch((err) => {
      console.error("❌ listOrders Error:", err.message)
      // Return null instead of throwing so the page doesn't crash
      return null 
    })
})