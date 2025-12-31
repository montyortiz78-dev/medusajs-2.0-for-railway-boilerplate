"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { getCartId, getMedusaHeaders, removeCartId, setCartId } from "./cookies"
import { revalidateTag } from "next/cache"
import { HttpTypes } from "@medusajs/types"
import { redirect } from "next/navigation"
import { listRegions } from "./regions"

// --- HELPERS ---

function getCartIdOrThrow() {
  const cartId = getCartId()
  if (!cartId) {
    throw new Error("No cart found")
  }
  return cartId
}

async function createCart(variantId: string, quantity: number, countryCode: string) {
  try {
    let regionId: string | undefined

    try {
      const regions = await listRegions()
      const region = regions?.find((r: HttpTypes.StoreRegion) => 
        r.countries?.some((c: HttpTypes.StoreRegionCountry) => c.iso_2 === countryCode)
      )
      
      if (region) {
        regionId = region.id
      } else if (regions && regions.length > 0) {
        regionId = regions[0].id
      }
    } catch (e) {
      console.error("Failed to fetch regions for cart creation:", e)
    }

    if (!regionId) {
       throw new Error("Could not determine a valid region for cart creation.")
    }

    const { cart } = await sdk.store.cart.create(
      {
        items: [{ variant_id: variantId, quantity }],
        region_id: regionId, 
      },
      {},
      getMedusaHeaders(["cart"])
    )

    setCartId(cart.id)
    revalidateTag("cart")
    return cart
  } catch (e) {
    console.error("Error creating cart:", e)
    throw e
  }
}

// --- EXPORTED FUNCTIONS ---

export async function retrieveCart() {
  const cartId = getCartId()

  if (!cartId) {
    return null
  }

  const headers = {
    ...getMedusaHeaders(["cart"]),
  }

  try {
    const { cart } = await sdk.store.cart.retrieve(
      cartId,
      {
        fields: "+items.variant.product.title,+items.variant.product.thumbnail,+items.variant.product.handle,+region.currency_code,+region.symbol,+region.name",
      },
      headers
    )
    return cart
  } catch (e: any) {
    if (e.message?.includes("Not Found") || e.status === 404) {
      removeCartId()
    }
    return null
  }
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
  metadata,
}: {
  variantId: string
  quantity: number
  countryCode: string
  metadata?: Record<string, any>
}) {
  const cartId = getCartId()

  if (!cartId) {
    try {
      const cart = await createCart(variantId, quantity, countryCode)
      
      if (cart && metadata && cart.items?.[0]) {
        await sdk.store.cart.updateLineItem(
            cart.id, 
            cart.items[0].id, 
            {
              metadata,
              quantity: cart.items[0].quantity,
            }, 
            {}, 
            getMedusaHeaders(["cart"])
        )
      }
      return
    } catch (e) {
      return medusaError(e)
    }
  }

  try {
    await sdk.store.cart.createLineItem(
      cartId,
      {
        variant_id: variantId,
        quantity,
        metadata,
      },
      {},
      getMedusaHeaders(["cart"])
    )
    revalidateTag("cart")
  } catch (e: any) {
    console.error("Error adding to cart:", e)

   if (e.message?.includes("Not Found") || e.status === 404) {
      removeCartId()
      try {
        const cart = await createCart(variantId, quantity, countryCode)
         if (cart && metadata && cart.items?.[0]) {
            await sdk.store.cart.updateLineItem(
                cart.id, 
                cart.items[0].id, 
                {
                  metadata,
                  quantity: cart.items[0].quantity,
                }, 
                {}, 
                getMedusaHeaders(["cart"])
            )
        }
      } catch (createErr) {
        return medusaError(createErr)
      }
      return
    }
    return medusaError(e)
  }
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  try {
    const cartId = getCartIdOrThrow()
    await sdk.store.cart.updateLineItem(
      cartId,
      lineId,
      { quantity },
      {},
      getMedusaHeaders(["cart"])
    )
    revalidateTag("cart")
  } catch (e) {
    return medusaError(e)
  }
}

export async function deleteLineItem(lineId: string) {
  try {
    const cartId = getCartIdOrThrow()
    await sdk.store.cart.deleteLineItem(
      cartId,
      lineId,
      {}, 
      getMedusaHeaders(["cart"])
    )
    revalidateTag("cart")
    return null
  } catch (e) {
    return medusaError(e)
  }
}

export async function setAddresses(currentState: unknown, formData: FormData) {
  let redirectUrl: string | null = null
  try {
    const cartId = getCartIdOrThrow()
    const data = Object.fromEntries(formData.entries()) as Record<string, string>

    const address = {
      first_name: data["shipping_address.first_name"],
      last_name: data["shipping_address.last_name"],
      address_1: data["shipping_address.address_1"],
      address_2: data["shipping_address.address_2"],
      company: data["shipping_address.company"],
      postal_code: data["shipping_address.postal_code"],
      city: data["shipping_address.city"],
      country_code: data["shipping_address.country_code"],
      phone: data["shipping_address.phone"],
    }

    const payload: any = {
      shipping_address: address,
      email: data.email,
    }

    if (data.same_as_billing === "on") {
      payload.billing_address = address
    } else {
      payload.billing_address = {
        first_name: data["billing_address.first_name"],
        last_name: data["billing_address.last_name"],
        address_1: data["billing_address.address_1"],
        address_2: data["billing_address.address_2"],
        company: data["billing_address.company"],
        postal_code: data["billing_address.postal_code"],
        city: data["billing_address.city"],
        country_code: data["billing_address.country_code"],
        phone: data["billing_address.phone"],
      }
    }

    await sdk.store.cart.update(cartId, payload, {}, getMedusaHeaders(["cart"]))
    revalidateTag("cart")
    redirectUrl = `/${data["shipping_address.country_code"]}/checkout?step=delivery`
  
  } catch (e: any) {
    return medusaError(e)
  }
  
  if (redirectUrl) {
    redirect(redirectUrl)
  }
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  try {
    await sdk.store.cart.addShippingMethod(
      cartId,
      { option_id: shippingMethodId },
      {},
      getMedusaHeaders(["cart"])
    )
    revalidateTag("cart")
  } catch (e: any) {
    return medusaError(e)
  }
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: { provider_id: string }
) {
  try {
    await sdk.store.payment.initiatePaymentSession(
      cart,
      {
        provider_id: data.provider_id,
      },
      {},
      getMedusaHeaders(["cart"])
    )
    revalidateTag("cart")
  } catch (e: any) {
    return medusaError(e)
  }
}

export async function placeOrder() {
  let redirectUrl: string | null = null
  try {
    const cartId = getCartIdOrThrow()
    
    const result = await sdk.store.cart.complete(
      cartId,
      {},
      getMedusaHeaders(["cart"])
    )

    if (result.type === "order" && result.order) {
      revalidateTag("cart")
      removeCartId()
      const countryCode = result.order.shipping_address?.country_code?.toLowerCase()
      redirectUrl = `/${countryCode}/order/confirmed/${result.order.id}`

    } else {
      return null
    }
  } catch (e: any) {
    return medusaError(e)
  }
  
  if (redirectUrl) {
    redirect(redirectUrl)
  }
}

export async function enrichLineItems(
  items: HttpTypes.StoreCartLineItem[] | undefined,
  regionId: string
) {
  if (!items) return []
  return items
}

export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = getCartId()
  
  const regions = await listRegions()
  
  const region = regions?.find((r: HttpTypes.StoreRegion) =>
    r.countries?.some((c: HttpTypes.StoreRegionCountry) => c.iso_2 === countryCode)
  )

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    try {
      await sdk.store.cart.update(
        cartId,
        { region_id: region.id },
        {},
        getMedusaHeaders(["cart"])
      )
      revalidateTag("cart")
    } catch (e) {
      return medusaError(e)
    }
  }

  redirect(`/${countryCode}${currentPath}`)
}

// --- NEWLY ADDED PROMOTION FUNCTIONS TO FIX BUILD ---

export async function applyPromotions(codes: string[]) {
  const cartId = getCartId()
  if (!cartId) return medusaError("No cart found")

  try {
    await sdk.store.cart.update(cartId, { promo_codes: codes }, {}, getMedusaHeaders(["cart"]))
    revalidateTag("cart")
  } catch (e) {
    return medusaError(e)
  }
}

export async function submitPromotionForm(currentState: unknown, formData: FormData) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
    return null
  } catch (e: any) {
    return e.toString()
  }
}