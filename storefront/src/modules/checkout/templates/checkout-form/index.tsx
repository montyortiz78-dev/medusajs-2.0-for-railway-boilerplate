import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import CheckoutAuth from "@modules/checkout/components/checkout-auth" // Import the new component

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region_id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  // --- INTEGRATED AUTH CHECK ---
  // If no customer is logged in, show the Auth Component FIRST.
  // This replaces the Address/Shipping/Payment steps until they login.
  if (!customer) {
    return (
        <div className="w-full grid grid-cols-1 gap-y-8">
            <CheckoutAuth />
        </div>
    )
  }
  // -----------------------------

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <div>
        <Addresses cart={cart} customer={customer} />
      </div>

      <div>
        <Shipping
          cart={cart}
          availableShippingMethods={shippingMethods}
        />
      </div>

      <div>
        <Payment
          cart={cart}
          availablePaymentMethods={paymentMethods}
        />
      </div>

      <div>
        <Review cart={cart} />
      </div>
    </div>
  )
}