"use client"

import { Button, Input, Label, clx } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { InformationCircle } from "@medusajs/icons" 

import { useIntersection } from "@lib/hooks/use-in-view"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import Modal from "@modules/common/components/modal"

import MobileActions from "./mobile-actions"
import ProductPrice from "../product-price"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

import KandiManualBuilder from "../../../../components/kandi-manual-builder"
import { useKandiContext } from "@lib/context/kandi-context"
// CHANGED: Import the condensed guide
import KandiSizingGuide from "../../../../components/kandi-sizing-guide" 

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

const WORD_BRACELET_HANDLE = "express-yourself-word-bracelets"

export default function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [customWord, setCustomWord] = useState("") 
  const [showSizeGuide, setShowSizeGuide] = useState(false) 
  
  const countryCode = useParams().countryCode as string
  const { pattern, setPattern } = useKandiContext()

  const isWordBracelet = product.handle === WORD_BRACELET_HANDLE

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

  const captureCanvasImage = (): string => {
    try {
      const canvasContainer = document.getElementById("kandi-canvas")
      const canvas = canvasContainer?.querySelector("canvas")
      
      if (canvas) {
        return canvas.toDataURL("image/jpeg", 0.5)
      }
    } catch (e) {
      console.error("Failed to capture 3D bracelet snapshot", e)
    }
    return ""
  }

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null
    
    if (pattern.length === 0) return null
    if (isWordBracelet && customWord.trim().length === 0) {
        return null 
    }

    setIsAdding(true)

    const imageUrl = captureCanvasImage()

    const metadata = {
          is_custom: true,
          pattern_data: pattern,           
          kandi_pattern: pattern.map(p => p.color), 
          image_url: imageUrl,             
          kandi_name: "Custom Kandi Bracelet",
          kandi_vibe: "Creative",
          ...(isWordBracelet && { custom_word: customWord.trim() })
    }

    const error = await addToCart({
      variantId: selectedVariant.id,
      quantity: 1,
      countryCode,
      metadata
    })

    if (error) {
      console.error("Failed to add to cart:", error)
    }

    setIsAdding(false)
  }

  const isValid = 
    inStock && 
    selectedVariant && 
    pattern.length > 0 &&
    (!isWordBracelet || customWord.trim().length > 0);

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
                    {/* Size Guide Link */}
                    {option.title === "Size" && (
                        <button 
                            onClick={() => setShowSizeGuide(true)}
                            className="flex items-center gap-1.5 text-small-regular text-ui-fg-muted hover:text-ui-fg-base mt-2 transition-colors cursor-pointer group"
                        >
                            <InformationCircle className="w-4 h-4" />
                            <span className="underline decoration-ui-fg-muted group-hover:decoration-ui-fg-base">
                                Sizing Guide
                            </span>
                        </button>
                    )}
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        {isWordBracelet && (
            <div className="flex flex-col gap-y-2 py-2">
                <Label htmlFor="custom-word-input" className="text-sm font-medium text-ui-fg-base">
                    Your Word (Max 12 chars)
                </Label>
                <Input
                    id="custom-word-input"
                    placeholder="e.g. PLUR, VIBE"
                    value={customWord}
                    onChange={(e) => {
                        if (e.target.value.length <= 12) {
                            setCustomWord(e.target.value.toUpperCase())
                        }
                    }}
                    disabled={isAdding}
                />
                <span className="text-xs text-ui-fg-subtle text-right">
                    {customWord.length} / 12 characters
                </span>
            </div>
        )}

        <div className="py-4 border-t border-b border-ui-border-base my-2">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-ui-fg-base">Customize Design</span>
                <span className="text-xs text-ui-fg-subtle">
                    {pattern.length === 0 ? "(Required)" : `${pattern.length} beads`}
                </span>
            </div>
            <KandiManualBuilder pattern={pattern} setPattern={setPattern} />
            
            {pattern.length === 0 && (
                <p className="text-xs text-rose-500 mt-2">
                    * Please add at least one bead to your design.
                </p>
            )}
        </div>
        
        <ProductPrice product={product} variant={selectedVariant} />

        <Button
          onClick={handleAddToCart}
          disabled={!isValid || !!disabled || isAdding}
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant
            ? "Select variant"
            : !inStock
            ? "Out of stock"
            : pattern.length === 0
            ? "Add Beads to Design"
            : isWordBracelet && customWord.length === 0 
            ? "Enter Your Word" 
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

      <Modal isOpen={showSizeGuide} close={() => setShowSizeGuide(false)} size="large">
         <Modal.Title>
            Simple Sizing Guide
         </Modal.Title>
         <Modal.Body>
            <div className="w-full pb-6">
                {/* CHANGED: Render the Condensed Guide */}
                <KandiSizingGuide />
            </div>
         </Modal.Body>
      </Modal>

    </>
  )
}