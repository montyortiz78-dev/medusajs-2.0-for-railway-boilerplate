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

// Config for parsing option names
const VISUAL_CONFIG = {
    // Expanded keys to catch more variations
    ROWS_KEYS: ["rows", "row", "tiers", "layers", "row count", "number of rows", "height"],
    STITCH_KEYS: ["stitch", "stitch type", "pattern", "weave", "style", "cuff type", "type", "design"], // Added 'type', 'design'
}

const STITCH_MAPPING: Record<string, string> = {
  "Ladder": "ladder", "Flat": "ladder", "Multi (Peyote)": "peyote",
  "Peyote": "peyote", "Brick": "brick", "Flower": "flower",
  "X-base": "x-base", "Single": "ladder", 
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
  
  // Destructure setDesignConfig to update the visualizer
  const { pattern, setPattern, setDesignConfig, setIsCapturing } = useKandiContext()

  const isKandiProduct = product.handle === KANDI_PRODUCT_HANDLE
  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const optionsAsKeymap = (variantOptions: any) => {
    return variantOptions?.reduce((acc: Record<string, string | undefined>, varopt: any) => {
      if (varopt.option && varopt.value !== null && varopt.value !== undefined) {
        acc[varopt.option.title] = varopt.value
      }
      return acc
    }, {})
  }

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return undefined
    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // === PRE-SELECTION LOGIC ===
  useEffect(() => {
    if (Object.keys(options).length === product.options?.length) return

    const PREFERRED_DEFAULTS: Record<string, string> = {
      "Size": "Small", "Type": "Single Bracelet",
      "Rows": "1", "Stitch": "Single", "Stitch Type": "Single"
    }

    const newOptions = { ...options }
    let hasChanges = false

    product.options?.forEach((opt) => {
      const title = opt.title ?? ""
      if (newOptions[title]) return 

      const foundPreferred = opt.values?.find((v) => {
         const pref = PREFERRED_DEFAULTS[title]
         return pref && v.value.includes(pref)
      })

      if (foundPreferred) {
        newOptions[title] = foundPreferred.value
        hasChanges = true
      } else if (opt.values && opt.values.length > 0) {
        newOptions[title] = opt.values[0].value
        hasChanges = true
      }
    })

    if (hasChanges) setOptions(newOptions)
  }, [product.options, options])

  // === VISUALIZER UPDATE LOGIC (ROBUST) ===
  useEffect(() => {
    // 1. Helper to safely find keys case-insensitively
    const getOptionValue = (allowedKeys: string[]) => {
      const foundKey = Object.keys(options).find(key => 
        allowedKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))
      )
      return foundKey ? options[foundKey] : null
    }

    let rows = 1
    let stitch = "ladder"

    // Helper to map values to stitch types
    const resolveStitch = (val: string) => {
        const valLower = val.toLowerCase()
        const mappedKey = Object.keys(STITCH_MAPPING).find(
            key => key.toLowerCase() === valLower
        )
        if (mappedKey) return STITCH_MAPPING[mappedKey]
        
        // Fallback checks for keywords if direct map fails
        if (valLower.includes('x-base')) return 'x-base'
        if (valLower.includes('peyote') || valLower.includes('multi')) return 'peyote'
        if (valLower.includes('flower')) return 'flower'
        
        return null
    }

    // 2. Parse Rows
    const selectedRowsVal = getOptionValue(VISUAL_CONFIG.ROWS_KEYS)
    if (selectedRowsVal) {
      const valStr = selectedRowsVal.toString().toLowerCase()
      
      // Check if the "Rows" value is actually a stitch type (e.g. "X-base")
      const stitchFromRows = resolveStitch(selectedRowsVal)
      if (stitchFromRows) {
         stitch = stitchFromRows
      } 
      
      // Text-based overrides for quantity
      if (valStr.includes("double")) rows = 2
      else if (valStr.includes("triple")) rows = 3
      else if (valStr.includes("quad")) rows = 4
      else {
        // Numeric extraction
        const match = valStr.match(/\d+/)
        if (match) rows = parseInt(match[0], 10)
      }
    }

    // 3. Parse Stitch (Priority override if a dedicated stitch option exists)
    const selectedStitchVal = getOptionValue(VISUAL_CONFIG.STITCH_KEYS)
    if (selectedStitchVal) {
      const resolved = resolveStitch(selectedStitchVal)
      if (resolved) {
        stitch = resolved
      } else {
        // Fallback to raw value if it's not in the map but might be handled by 3D component directly
        stitch = selectedStitchVal.toLowerCase()
      }
    }

    // 4. Metadata Override (Overrides UI options if present on variant)
    if (selectedVariant?.metadata) {
      if (selectedVariant.metadata.kandi_rows) rows = Number(selectedVariant.metadata.kandi_rows)
      if (selectedVariant.metadata.kandi_stitch) stitch = String(selectedVariant.metadata.kandi_stitch)
    }

    // 5. Update Context
    // console.log("Updating Visualizer:", { rows, stitch }) // DEBUG
    setDesignConfig({
      rows: Math.max(1, rows),
      stitch: stitch,
    })

  }, [options, selectedVariant, setDesignConfig]) 

  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({ ...prev, [title]: value }))
  }

  // === SNAPSHOT & ADD TO CART ===
  const captureCanvasImage = (): string => {
    try {
      const canvasContainer = document.getElementById("kandi-canvas")
      const canvas = canvasContainer?.querySelector("canvas")
      if (canvas) return canvas.toDataURL("image/jpeg", 0.5)
    } catch (e) {
      console.error("Failed to capture snapshot", e)
    }
    return ""
  }

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null
    if (isKandiProduct && pattern.length === 0) return null

    setIsAdding(true)

    // Trigger Capture
    setIsCapturing(true)
    await new Promise(resolve => setTimeout(resolve, 600)) // Wait for float to stop
    const imageUrl = captureCanvasImage()
    setIsCapturing(false)

    const metadata = {
          is_custom: isKandiProduct || pattern.length > 0,
          pattern_data: pattern,           
          kandi_pattern: pattern.map(p => typeof p === 'string' ? p : p.color), 
          image_url: imageUrl,             
          kandi_name: product.title, 
          kandi_vibe: "Creative",
          ...(isKandiProduct && customWord.trim().length > 0 && { custom_word: customWord.trim() })
    }

    const error = await addToCart({
      variantId: selectedVariant.id,
      quantity: 1,
      countryCode,
      metadata
    })

    if (error) console.error("Cart Error:", error)
    setIsAdding(false)
  }

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) return true
    if (selectedVariant?.allow_backorder) return true
    if (selectedVariant?.manage_inventory && (selectedVariant?.inventory_quantity || 0) > 0) return true
    return false
  }, [selectedVariant])

  const isValid = inStock && selectedVariant && (isKandiProduct ? pattern.length > 0 : true)

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
                      disabled={!!disabled || isAdding}
                    />
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
                        if (e.target.value.length <= 12) setCustomWord(e.target.value.toUpperCase())
                    }}
                    disabled={isAdding}
                />
                <span className="text-xs text-ui-fg-subtle text-right">{customWord.length} / 12</span>
            </div>
        )}

        <div className="py-4 border-t border-b border-ui-border-base my-2">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-ui-fg-base">Customize Design</span>
                <span className="text-xs text-ui-fg-subtle">
                    {pattern.length === 0 ? (isKandiProduct ? "(Required)" : "(Optional)") : `${pattern.length} beads`}
                </span>
            </div>
            <KandiManualBuilder pattern={pattern} setPattern={setPattern} />
            
            {isKandiProduct && pattern.length === 0 && (
                <p className="text-xs text-rose-500 mt-2">* Please add at least one bead.</p>
            )}
        </div>
        
        <ProductPrice product={product} variant={selectedVariant} />

        <Button
          onClick={handleAddToCart}
          disabled={!isValid || !!disabled || isAdding}
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
        >
          {!selectedVariant ? "Select variant" : !inStock ? "Out of stock" : (isKandiProduct && pattern.length === 0) ? "Add Beads to Design" : (isAdding ? "Adding to Cart..." : "Add to cart")}
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
         <Modal.Title>Simple Sizing Guide</Modal.Title>
         <Modal.Body><div className="w-full pb-6"><KandiSizingGuide /></div></Modal.Body>
      </Modal>
    </>
  )
}