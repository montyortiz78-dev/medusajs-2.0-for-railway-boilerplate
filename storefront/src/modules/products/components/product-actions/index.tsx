"use client"

import { Button } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { useIntersection } from "@lib/hooks/use-in-view"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"

import MobileActions from "./mobile-actions"
import ProductPrice from "../product-price"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

// Import Builder and Context
import KandiManualBuilder from "../../../../components/kandi-manual-builder"
import { useKandiContext } from "@lib/context/kandi-context"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (variantOptions: any) => {
  return variantOptions?.reduce((acc: Record<string, string | undefined>, varopt: any) => {
    if (varopt.option && varopt.value !== null && varopt.value !== undefined) {
      acc[varopt.option.title] = varopt.value
    }
    return acc
  }, {})
}

export default function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  // --- KANDI STATE FROM CONTEXT ---
  const { pattern, setPattern } = useKandiContext()
  // -------------------

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [title]: value,
    }))
  }

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) return true
    if (selectedVariant?.allow_backorder) return true
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  // Helper to capture the 3D Canvas
  const captureCanvasImage = (): string => {
    try {
      // We look for the canvas ID defined in kandi-bracelet-3d.tsx
      const canvasContainer = document.getElementById("kandi-canvas")
      const canvas = canvasContainer?.querySelector("canvas")
      
      if (canvas) {
        return canvas.toDataURL("image/png")
      }
    } catch (e) {
      console.error("Failed to capture 3D bracelet snapshot", e)
    }
    return ""
  }

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    // Capture metadata for NFT minting
    let metadata: Record<string, any> | undefined = undefined

    if (pattern.length > 0) {
      // Capture the visual
      const imageUrl = captureCanvasImage()

      metadata = {
          is_custom: true,
          // Metadata expected by backend/src/subscribers/mint-nft.ts
          pattern_data: pattern,           // The full bead objects
          kandi_pattern: pattern.map(p => p.color), // Simple color list
          image_url: imageUrl,             // Base64 image from 3D Canvas
          kandi_name: "Custom Kandi Bracelet",
          kandi_vibe: "Creative"
      }
    }

    await addToCart({
      variantId: selectedVariant.id,
      quantity: 1,
      countryCode,
      metadata
    })

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.title ?? ""]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        {/* --- KANDI BUILDER SECTION (Always Visible) --- */}
        <div className="py-4 border-t border-b border-ui-border-base my-2">
            <span className="text-sm font-medium mb-2 block text-ui-fg-base">Customize Design</span>
            <KandiManualBuilder pattern={pattern} setPattern={setPattern} />
        </div>
        {/* ----------------------------- */}

        <ProductPrice product={product} variant={selectedVariant} />

        <Button
          onClick={handleAddToCart}
          disabled={!inStock || !selectedVariant || !!disabled || isAdding}
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant
            ? "Select variant"
            : !inStock
            ? "Out of stock"
            : "Add to cart"}
        </Button>
        
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}