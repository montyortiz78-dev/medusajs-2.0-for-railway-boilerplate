import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")
    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div>
      <Text className="text-ui-fg-subtle">
        We have sent the order confirmation details to{" "}
        <span
          className="text-ui-fg-base font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>
      <Text className="mt-2 text-ui-fg-subtle">
        Order date:{" "}
        <span data-testid="order-date" className="text-ui-fg-base">
          {new Date(order.created_at).toDateString()}
        </span>
      </Text>
      <Text className="mt-2 text-pink-500 font-medium">
        Order number: <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text className="text-ui-fg-subtle">
              Order status:{" "}
              <span className="text-ui-fg-base" data-testid="order-status">
                {/* {formatStatus(order.fulfillment_status)} */}
              </span>
            </Text>
            <Text className="text-ui-fg-subtle">
              Payment status:{" "}
              <span
                className="text-ui-fg-base"
                data-testid="order-payment-status"
              >
                {/* {formatStatus(order.payment_status)} */}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails