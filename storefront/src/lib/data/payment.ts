"use server"

import { sdk } from "@lib/config"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"

// Shipping actions
export const listCartPaymentMethods = cache(async function (regionId: string) {
  const headers = getAuthHeaders()

  return sdk.store.payment
    .listPaymentProviders(
      { region_id: regionId },
      { next: { tags: ["payment_providers"] }, ...headers } as any
    )
    .then(({ payment_providers }) => payment_providers)
    .catch(() => {
      return null
    })
})