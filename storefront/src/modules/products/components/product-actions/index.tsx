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
import KandiSizingGuide from "../../../../components/kandi-sizing-guide"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

// 1. CONFIGURATION: Explicit Mapping (Stable & Predictable)
// Maps your Medusa Option Values to the Visualizer IDs
const STITCH_MAPPING: Record<string, string> = {
  "Ladder": "ladder",
  "Flat": "ladder", 
  "Multi (Peyote)": "peyote",
  "Peyote": "peyote",
  "Brick": "brick",
  "Flower": "flower",
  "X-base": "x-base",
  "Single": "ladder", 
}

const KANDI_PRODUCT_HANDLE = "custom-ai-kandi"

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
  const { pattern, setPattern, setDesignConfig } = useKandiContext()

  const isKandiProduct = product.handle === KANDI_PRODUCT_HANDLE
  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  // Helper to convert options array to map
  const optionsAsKeymap = (variantOptions: any) => {
    return variantOptions?.reduce((acc: Record<string, string | undefined>, varopt: any) => {
      if (varopt.option && varopt.value !== null && varopt.value !== undefined) {
        acc[varopt.option.title] = varopt.value
      }
      return acc
    }, {})
  }

  // Find the specific variant ID based on selected options
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return undefined
    }
    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // === PRE-SELECTION & DEFAULTS LOGIC ===
  useEffect(() => {
    // If options are already fully populated, don't overwrite user choices
    if (Object.keys(options).length === product.options?.length) return

    const PREFERRED_DEFAULTS: Record<string, string> = {
      "Size": "Small",
      "Type": "Single Bracelet",
      "Rows": "1",
      "Stitch": "Single", 
      "Stitch Type": "Single"
    }

    const newOptions = { ...options }
    let hasChanges = false

    product.options?.forEach((opt) => {
      const title = opt.title ?? ""
      // Skip if this option is already set
      if (newOptions[title]) return

      // 1. Try to find a matching preferred value
      const foundPreferred = opt.values?.find((v) => {
         const pref = PREFERRED_DEFAULTS[title]
         // Check exact match or partial match (e.g. "Small" in "Small (6.5 in)")
         return pref && v.value.includes(pref)
      })

      if (foundPreferred) {
        newOptions[title] = foundPreferred.value
        hasChanges = true
      } else if (opt.values && opt.values.length > 0) {
        // 2. Fallback: Pick the first available option (e.g. if "Small" is OOS)
        newOptions[title] = opt.values[0].value
        hasChanges = true
      }
    })

    if (hasChanges) {
      setOptions(newOptions)
    }
  }, [product.options, options])

  // === VISUALIZER UPDATE LOGIC ===
  useEffect(() => {
    if (!isKandiProduct) return

    // Helper: Find value ignoring case (e.g. matches "Rows", "rows", "ROWS")
    const getOptionValue = (searchKey: string) => {
      const key = Object.keys(options).find(k => k.toLowerCase() === searchKey.toLowerCase())
      return key ? options[key] : null
    }

    // 1. Defaults
    let rows = 1
    let stitch = "ladder"

    // 2. Parse User Selections (Case Insensitive)
    const selectedRows = getOptionValue("rows")
    const selectedStitch = getOptionValue("stitch")

    // Parse Rows
    if (selectedRows) {
      // Extract number just in case the value is "4 Rows" instead of "4"
      const match = selectedRows.toString().match(/\d+/)
      if (match) {
        rows = parseInt(match[0], 10)
      }
    }

    // Parse Stitch
    if (selectedStitch) {
      // Check Mapping first, then fallback to lowercase
      stitch = STITCH_MAPPING[selectedStitch] || selectedStitch.toLowerCase()
    }

    // 3. Metadata Override (Backend Authority)
    if (selectedVariant?.metadata) {
      if (selectedVariant.metadata.kandi_rows) {
        rows = Number(selectedVariant.metadata.kandi_rows)
      }
      if (selectedVariant.metadata.kandi_stitch) {
        stitch = String(selectedVariant.metadata.kandi_stitch)
      }
    }

    // 4. Update Context
    setDesignConfig({
      rows: Math.max(1, rows),
      stitch: stitch,
    })

  }, [options, selectedVariant, isKandiProduct, setDesignConfig])

  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [title]: value,
    }))
  }

  // Capture the 3D canvas as an image
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

    setIsAdding(true)

    const imageUrl = captureCanvasImage()

    const metadata = {
          is_custom: true,
          pattern_data: pattern,           
          kandi_pattern: pattern.map(p => typeof p === 'string' ? p : p.color), 
          image_url: imageUrl,             
          kandi_name: "Custom Kandi Bracelet",
          kandi_vibe: "Creative",
          ...(isKandiProduct && customWord.trim().length > 0 && { custom_word: customWord.trim() })
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

  const isValid = inStock && selectedVariant && pattern.length > 0

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

        {/* Custom Word Input */}
        {isKandiProduct && (
            <div className="flex flex-col gap-y-2 py-2">
                <Label htmlFor="custom-word-input" className="text-sm font-medium text-ui-fg-base">
                    Your Word (Optional)
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
                <KandiSizingGuide />
            </div>
         </Modal.Body>
      </Modal>

    </>
  )
}