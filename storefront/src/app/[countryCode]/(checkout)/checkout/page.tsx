import { Metadata } from "next"
import { notFound, redirect } from "next/navigation" // Added redirect

import Wrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Checkout",
}

const fetchCart = async () => {
  const cart = await retrieveCart()
  if (!cart) {
    return notFound()
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id!)
    cart.items = enrichedItems as HttpTypes.StoreCartLineItem[]
  }

  return cart
}

// Updated to accept 'params' so we can build the redirect URL
export default async function Checkout({
  params
}: {
  params: { countryCode: string }
}) {
  const { countryCode } = params
  
  const cart = await fetchCart()
  const customer = await getCustomer()

  // --- GATEKEEPER LOGIC ---
  if (!customer) {
    // FIX: Redirect to /account instead of /account/login
    // The account page handles showing the login form if you aren't signed in.
    redirect(`/${countryCode}/account`)
  }
  // ------------------------

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <Wrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </Wrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}