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

// 1. CONFIGURATION: Explicit Mapping
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

  const optionsAsKeymap = (variantOptions: any) => {
    return variantOptions?.reduce((acc: Record<string, string | undefined>, varopt: any) => {
      if (varopt.option && varopt.value !== null && varopt.value !== undefined) {
        acc[varopt.option.title] = varopt.value
      }
      return acc
    }, {})
  }

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
    // Only run if we haven't selected everything yet
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
      if (newOptions[title]) return // Already set

      // 1. Try Preferred
      const foundPreferred = opt.values?.find((v) => {
         const pref = PREFERRED_DEFAULTS[title]
         return pref && v.value.includes(pref)
      })

      if (foundPreferred) {
        newOptions[title] = foundPreferred.value
        hasChanges = true
      } else if (opt.values && opt.values.length > 0) {
        // 2. Fallback to First Option
        newOptions[title] = opt.values[0].value
        hasChanges = true
      }
    })

    if (hasChanges) {
      setOptions(newOptions)
    }
  }, [product.options, options])

  // === VISUALIZER UPDATE LOGIC (THE FIX) ===
  useEffect(() => {
    if (!isKandiProduct) return

    // Helper: LOOSE MATCHING (Contains vs Exact Match)
    // This allows "Row Count" or "Number of Rows" to match "row"
    const getOptionValue = (searchKey: string) => {
      const key = Object.keys(options).find(k => k.toLowerCase().includes(searchKey.toLowerCase()))
      return key ? options[key] : null
    }

    let rows = 1
    let stitch = "ladder"

    // 1. Parse Rows
    const selectedRows = getOptionValue("row") // Looks for "Rows", "Row Count", etc.
    
    if (selectedRows) {
      const valStr = selectedRows.toString().toLowerCase()
      const match = valStr.match(/\d+/) // Find any number
      
      if (match) {
        rows = parseInt(match[0], 10)
      } else if (valStr.includes("double")) {
        rows = 2
      } else if (valStr.includes("triple")) {
        rows = 3
      } else if (valStr.includes("quad")) {
        rows = 4
      }
    }

    // 2. Parse Stitch
    const selectedStitch = getOptionValue("stitch")
    if (selectedStitch) {
      stitch = STITCH_MAPPING[selectedStitch] || selectedStitch.toLowerCase()
    }

    // 3. Metadata Override
    // WARNING: If your variant has 'kandi_rows: 1' in Medusa Admin, this WILL lock it to 1.
    if (selectedVariant?.metadata) {
      if (selectedVariant.metadata.kandi_rows) {
        rows = Number(selectedVariant.metadata.kandi_rows)
      }
      if (selectedVariant.metadata.kandi_stitch) {
        stitch = String(selectedVariant.metadata.kandi_stitch)
      }
    }

    // Debugging: Check your browser console to see if rows are being detected
    console.log("Visualizer Update:", { 
        foundRowsOption: selectedRows, 
        parsedRows: rows, 
        stitch 
    })

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

  // Snapshot Logic
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

    if (error) console.error("Cart Error:", error)
    setIsAdding(false)
  }

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) return true
    if (selectedVariant?.allow_backorder) return true
    if (selectedVariant?.manage_inventory && (selectedVariant?.inventory_quantity || 0) > 0) return true
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
                    {pattern.length === 0 ? "(Required)" : `${pattern.length} beads`}
                </span>
            </div>
            <KandiManualBuilder pattern={pattern} setPattern={setPattern} />
            
            {pattern.length === 0 && (
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
          {!selectedVariant ? "Select variant" : !inStock ? "Out of stock" : pattern.length === 0 ? "Add Beads to Design" : "Add to cart"}
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