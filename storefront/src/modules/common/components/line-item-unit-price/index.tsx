import { getPricesForVariant } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
}

const LineItemUnitPrice = ({
  item,
  style = "default",
}: LineItemUnitPriceProps) => {
  const variantPrices = getPricesForVariant(item.variant)

  // Use fallback values from item if variant prices are missing
  const original_price_number = variantPrices?.original_price_number ?? item.unit_price
  const calculated_price_number = variantPrices?.calculated_price_number ?? item.unit_price
  
  // FIX: Cast item.variant to any to access 'prices' which may not exist on the strict type
  const currency_code = variantPrices?.currency_code ?? 
    (item as any).currency_code ?? 
    (item.variant as any)?.prices?.[0]?.currency_code ?? 
    "USD"
  
  const percentage_diff = variantPrices?.percentage_diff ?? 0

  const hasReducedPrice = calculated_price_number < original_price_number

  return (
    <div className="flex flex-col text-ui-fg-muted justify-center h-full">
      {hasReducedPrice && (
        <>
          <p>
            {style === "default" && (
              <span className="text-ui-fg-muted">Original: </span>
            )}
            <span
              className="line-through"
              data-testid="product-unit-original-price"
            >
              {convertToLocale({
                amount: original_price_number,
                currency_code
              })}
            </span>
          </p>
          {style === "default" && (
            <span className="text-ui-fg-interactive">-{percentage_diff}%</span>
          )}
        </>
      )}
      <span
        className={clx("text-base-regular", {
          "text-ui-fg-interactive": hasReducedPrice,
        })}
        data-testid="product-unit-price"
      >
        {convertToLocale({
          amount: calculated_price_number,
          currency_code
        })}
      </span>
    </div>
  )
}

export default LineItemUnitPrice