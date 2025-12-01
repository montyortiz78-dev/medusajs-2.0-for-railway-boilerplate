import { Heading } from "@medusajs/ui"
import { cookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cartId = cookies().get("_medusa_cart_id")?.value

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {cartId && (
          <OnboardingCta orderId={order.id} />
        )}
        <div
          className="flex flex-col gap-4 max-w-4xl h-full w-full py-10 glass p-8 rounded-lg"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
          >
            <span>Thank you!</span>
            <span>Your order was placed successfully.</span>
          </Heading>
          <OrderDetails order={order} />
          <Heading level="h2" className="flex flex-row text-3xl-regular">
            Summary
          </Heading>
          <Items items={order.items} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          
          {/* UPDATED HELP SECTION WITH CORRECT LINKS */}
          <div className="mt-6">
            <Heading level="h1" className="text-base-semi">
                Need help?
            </Heading>
            <div className="text-base-regular my-2">
                <ul className="gap-y-2 flex flex-col text-ui-fg-interactive">
                    <li>
                        <LocalizedClientLink href="/contact">
                            Contact
                        </LocalizedClientLink>
                    </li>
                    <li>
                        <LocalizedClientLink href="/returns">
                            Returns & Exchanges
                        </LocalizedClientLink>
                    </li>
                </ul>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}