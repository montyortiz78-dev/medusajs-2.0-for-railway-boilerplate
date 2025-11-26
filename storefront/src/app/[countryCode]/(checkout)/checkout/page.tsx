import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { retrieveCart } from "@lib/data/cart"
import { getCustomer } from "@lib/data/customer" // CHANGED: retrieveCustomer -> getCustomer
import Wrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"

export const metadata: Metadata = {
  title: "Checkout",
}

const fetchCart = async () => {
  const cart = await retrieveCart()
  if (!cart) {
    return notFound()
  }
  return cart
}

export default async function CheckoutPage({
  params,
}: {
  params: { countryCode: string }
}) {
  const { countryCode } = params

  const cart = await fetchCart()
  
  // CHANGED: Use getCustomer
  const customer = await getCustomer().catch(() => null)

  // FIX: Added safe check for items
  if (cart?.items && cart.items.length === 0) {
    redirect(`/${countryCode}`)
  }

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <Wrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </Wrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}