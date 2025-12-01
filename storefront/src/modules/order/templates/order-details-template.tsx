"use client"

import { XMark } from "@medusajs/icons"
import { Heading, Text } from "@medusajs/ui" // Import Heading and Text from UI package
import React from "react"

import CartTotals from "@modules/common/components/cart-totals"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import PaymentDetails from "@modules/order/components/payment-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  return (
    <div className="flex flex-col gap-y-8 w-full">
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <Heading level="h1" className="text-2xl-semi">Order Details</Heading>
          <LocalizedClientLink
            href="/account/orders"
            className="flex items-center gap-2 text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
          >
            <XMark /> Back to Orders
          </LocalizedClientLink>
        </div>
        <Text className="text-base-regular text-ui-fg-subtle">
            Order ID: <span className="text-ui-fg-base">{order.display_id}</span>
        </Text>
        <Text className="text-base-regular text-ui-fg-subtle">
            Date: <span className="text-ui-fg-base">{new Date(order.created_at).toDateString()}</span>
        </Text>
      </div>

      <div className="flex flex-col gap-4 w-full glass p-8 rounded-lg">
        <OrderDetails order={order} showStatus />
        <Items items={order.items} />
        <CartTotals totals={order} />
        <ShippingDetails order={order} />
        <PaymentDetails order={order} />
        
        <div className="mt-6">
            <Heading level="h2" className="text-base-semi">Need help?</Heading>
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
  )
}

export default OrderDetailsTemplate