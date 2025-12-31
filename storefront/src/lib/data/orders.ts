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

  // --- REAL DEBUGGING ---
  const pubKey = headers["x-publishable-api-key"]
  const hasToken = !!headers.authorization

  if (hasToken && pubKey && pubKey.startsWith("pk_")) {
    console.log(`✅ listOrders: Valid Headers. Token: Yes, Key: ${pubKey.substring(0, 5)}...`)
  } else {
    console.error("⚠️ listOrders: BAD HEADERS", { 
        hasToken, 
        pubKey: pubKey || "MISSING/EMPTY" 
    })
  }
  // ----------------------

  return sdk.store.order
    .list(
      { limit, offset, fields: "+payment_collections.payments" },
      { next: { tags: ["order"] }, ...headers } as any
    )
    .then(({ orders }) => orders)
    .catch((err) => {
      console.error("❌ listOrders Error:", err.message)
      return null 
    })
})