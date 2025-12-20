"use client"

import { Table, Text, clx } from "@medusajs/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
}

const Item = ({ item, type = "full" }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { handle } = item.variant?.product ?? {}

  // --- CUSTOM KANDI DATA ---
  const kandiName = item.metadata?.kandi_name as string | undefined;
  const kandiVibe = item.metadata?.kandi_vibe as string | undefined;
  const customImage = item.metadata?.image_url as string | undefined;
  const patternData = item.metadata?.pattern_data;

  // GENERATE REMIX LINK
  let productLink = `/products/${handle}`; // Default
  
  if (kandiName && patternData) {
    const remixPayload = JSON.stringify({
        name: kandiName,
        vibe: kandiVibe,
        pattern: patternData
    });
    const encoded = btoa(encodeURIComponent(remixPayload));
    
    // FIX: Point to /create instead of /
    productLink = `/create?remix=${encoded}`; 
  }
  // -------------------------

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)
    const message = await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  return (
    <Table.Row className="w-full" data-testid="product-row">
      {/* FIX: Reduced width and padding for mobile */}
      <Table.Cell className="!pl-0 p-2 small:p-4 w-16 small:w-24 align-top">
        <LocalizedClientLink
          href={productLink} 
          className={clx("flex aspect-square w-full rounded-lg overflow-hidden")}
        >
          <Thumbnail
            thumbnail={customImage || item.variant?.product?.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left p-2 small:p-4 align-top">
        <Text
          className="txt-medium-plus text-ui-fg-base break-words line-clamp-2"
          data-testid="product-title"
        >
            <LocalizedClientLink href={productLink}>
                {kandiName || item.product_title}
            </LocalizedClientLink>
        </Text>
        
        {kandiVibe && (
            <Text className="txt-small text-ui-fg-subtle italic truncate max-w-[120px] small:max-w-[200px]">
                "{kandiVibe}"
            </Text>
        )}

        {!kandiName && (
            <LineItemOptions variant={item.variant} data-testid="product-variant" />
        )}
      </Table.Cell>

      {type === "full" && (
        <Table.Cell className="p-2 small:p-4 align-top">
          {/* FIX: Flex column on mobile to stack controls, row on desktop */}
          <div className="flex flex-col-reverse items-start small:flex-row gap-2 small:items-center w-full small:w-28">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="w-12 h-9 p-2 small:w-14 small:h-10 small:p-4 text-small-regular"
              data-testid="product-select-button"
            >
              {Array.from(
                {
                  length: Math.min(maxQuantity, 10),
                },
                (_, i) => (
                  <option value={i + 1} key={i}>
                    {i + 1}
                  </option>
                )
              )}
              <option value={1} key={1}>1</option>
            </CartItemSelect>
            {updating && <Spinner />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell p-4 align-top">
          <LineItemUnitPrice item={item} style="tight" />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0 p-2 small:p-4 align-top">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">{item.quantity}x </Text>
              <LineItemUnitPrice item={item} style="tight" />
            </span>
          )}
          <LineItemPrice item={item} style="tight" />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item