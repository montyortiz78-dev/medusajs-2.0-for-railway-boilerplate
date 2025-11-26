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
  // --- CUSTOM KANDI DATA EXTRACTION ---
  const kandiName = item.metadata?.kandi_name as string | undefined;
  const kandiVibe = item.metadata?.kandi_vibe as string | undefined;
  const customImage = item.metadata?.image_url as string | undefined;
  // ------------------------------------

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <div className="flex w-16">
          {/* Custom Thumbnail Logic */}
          <Thumbnail 
            thumbnail={customImage || item.thumbnail} 
            size="square" 
          />
        </div>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-name"
        >
          {/* Custom Name Logic */}
          {kandiName || item.title}
        </Text>
        
        {/* Custom Vibe Logic */}
        {kandiVibe && (
            <Text className="txt-small text-ui-fg-subtle italic">
                "{kandiVibe}"
            </Text>
        )}

        {item.variant && (
          <LineItemOptions variant={item.variant} data-testid="product-variant" />
        )}
      </Table.Cell>

      <Table.Cell className="!pr-0">
        <span className="!pr-0 flex flex-col items-end h-full justify-center">
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