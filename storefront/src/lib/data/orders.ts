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

  if (headers.authorization) {
    console.log("✅ listOrders: Auth Token & PK present. Fetching orders...")
  } else {
    console.warn("⚠️ listOrders: No Auth Token found.")
  }

  return sdk.store.order
    .list(
      // Simplify fields slightly to ensure basic list works first
      { limit, offset, fields: "+payment_collections.payments" },
      { next: { tags: ["order"] }, ...headers } as any
    )
    .then(({ orders }) => orders)
    .catch((err) => {
      console.error("❌ listOrders Error:", err.message)
      return null 
    })
})