import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@medusajs/ui"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
}

const Item = ({ item }: ItemProps) => {
  // Logic: Use metadata if available, otherwise fall back to product data
  const customImage = (item.metadata?.image_url as string) || item.thumbnail
  const customName = (item.metadata?.kandi_name as string) || item.title
  const kandiVibe = item.metadata?.kandi_vibe as string

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-2 w-16 small:p-4 small:w-24 align-top">
        <div className="flex w-full aspect-square rounded-lg overflow-hidden">
          <Thumbnail 
            thumbnail={customImage} 
            size="square" 
          />
        </div>
      </Table.Cell>

      <Table.Cell className="text-left p-2 small:p-4 align-top">
        <Text
          className="txt-medium-plus text-ui-fg-base line-clamp-2"
          data-testid="product-name"
        >
          {customName}
        </Text>
        
        {kandiVibe && (
            <Text className="txt-small text-ui-fg-subtle italic truncate max-w-[150px]">
                "{kandiVibe}"
            </Text>
        )}

        {/* Only show variant options if it's NOT a custom Kandi */}
        {item.variant && !item.metadata?.kandi_name && (
          <LineItemOptions variant={item.variant} data-testid="product-variant" />
        )}
      </Table.Cell>

      <Table.Cell className="!pr-0 p-2 small:p-4 align-top">
        <span className="!pr-0 flex flex-col items-end h-full justify-start">
          <span className="flex gap-x-1 ">
            <Text className="text-ui-fg-muted">
              <span data-testid="product-quantity">{item.quantity}</span>x{" "}
            </Text>
            <LineItemUnitPrice item={item} style="tight" />
          </span>

          <LineItemPrice item={item} style="tight" />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item