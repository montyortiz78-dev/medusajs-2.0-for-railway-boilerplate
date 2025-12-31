"use server"

import { sdk } from "@lib/config"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"

export const retrieveOrder = cache(async function (id: string) {
  const headers = getAuthHeaders() // <--- Get the token

  return sdk.store.order
    .retrieve(
      id,
      { fields: "*payment_collections.payments" },
      { next: { tags: ["order"] }, ...headers } as any // <--- Pass the token here
    )
    .then(({ order }) => order)
    .catch((err) => {
      console.error("❌ retrieveOrder Error:", err)
      return null
    })
})

export const listOrders = cache(async function (
  limit: number = 10,
  offset: number = 0
) {
  const headers = getAuthHeaders() // <--- Get the token

  return sdk.store.order
    .list(
      { limit, offset, fields: "*payment_collections.payments" },
      { next: { tags: ["order"] }, ...headers } as any // <--- Pass the token here
    )
    .then(({ orders }) => orders)
    .catch((err) => {
      console.error("❌ listOrders Error:", err)
      return null
    })
})