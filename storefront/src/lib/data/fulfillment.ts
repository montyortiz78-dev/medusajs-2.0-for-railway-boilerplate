"use server"

import { sdk } from "@lib/config"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"

// Shipping actions
export const listCartShippingMethods = cache(async function (cartId: string) {
  const headers = getAuthHeaders()

  return sdk.store.fulfillment
    .listCartOptions(
      { cart_id: cartId }, 
      { next: { tags: ["shipping"] }, ...headers } as any
    )
    .then(({ shipping_options }) => shipping_options)
    .catch(() => {
      return null
    })
})