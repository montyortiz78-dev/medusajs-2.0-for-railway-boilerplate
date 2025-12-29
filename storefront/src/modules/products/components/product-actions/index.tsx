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
    ROWS_KEYS: ["rows", "row", "tiers", "layers", "row count", "number of rows", "height"],
    STITCH_KEYS: ["stitch", "stitch type", "pattern", "weave", "style", "cuff type", "type", "design"],
}

const STITCH_MAPPING: Record<string, string> = {
  "Ladder": "ladder", 
  "Flat": "flat", 
  "Multi (Peyote)": "peyote",
  "Peyote": "peyote", 
  "Brick": "brick", 
  "Flower": "flower",
  "X-base": "x-base", 
  "Single": "single", 
}

const KANDI_PRODUCT_HANDLE = "custom-ai-kandi"
const WORD_BRACELET_HANDLE = "express-yourself-word-bracelets"

export default function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)

  const countryCode = useParams().countryCode as string
  
  // --- FIX 1: DESTRUCTURE customWord FROM CONTEXT (Remove local useState) ---
  const { 
    pattern, 
    setPattern, 
    setDesignConfig, 
    setIsCapturing,
    customWord,       // <--- Get from Global Context
    setCustomWord     // <--- Get Global Setter
  } = useKandiContext()

  const isKandiProduct = product.handle === KANDI_PRODUCT_HANDLE
  const isWordBracelet = product.handle === WORD_BRACELET_HANDLE
  const showCustomInterface = isKandiProduct || isWordBracelet
  const maxWordChars = isWordBracelet ? 10 : 12
  const isWordRequired = isWordBracelet 

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

  // === VISUALIZER UPDATE LOGIC ===
  useEffect(() => {
    const getOptionValue = (allowedKeys: string[]) => {
      const foundKey = Object.keys(options).find(key => 
        allowedKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))
      )
      return foundKey ? options[foundKey] : null
    }

    let rows = 1
    let stitch = "ladder"

    const resolveStitch = (val: string) => {
        const valLower = val.toLowerCase()
        const mappedKey = Object.keys(STITCH_MAPPING).find(
            key => key.toLowerCase() === valLower
        )
        if (mappedKey) return STITCH_MAPPING[mappedKey]
        
        if (valLower.includes('x-base')) return 'x-base'
        if (valLower.includes('peyote') || valLower.includes('multi')) return 'peyote'
        if (valLower.includes('flower')) return 'flower'
        
        return null
    }

    const selectedRowsVal = getOptionValue(VISUAL_CONFIG.ROWS_KEYS)
    if (selectedRowsVal) {
      const valStr = selectedRowsVal.toString().toLowerCase()
      const stitchFromRows = resolveStitch(selectedRowsVal)
      if (stitchFromRows) stitch = stitchFromRows
      
      if (valStr.includes("double")) rows = 2
      else if (valStr.includes("triple")) rows = 3
      else if (valStr.includes("quad")) rows = 4
      else {
        const match = valStr.match(/\d+/)
        if (match) rows = parseInt(match[0], 10)
      }
    }

    const selectedStitchVal = getOptionValue(VISUAL_CONFIG.STITCH_KEYS)
    if (selectedStitchVal) {
      const resolved = resolveStitch(selectedStitchVal)
      if (resolved) stitch = resolved
      else stitch = selectedStitchVal.toLowerCase()
    }

    if (selectedVariant?.metadata) {
      if (selectedVariant.metadata.kandi_rows) rows = Number(selectedVariant.metadata.kandi_rows)
      if (selectedVariant.metadata.kandi_stitch) stitch = String(selectedVariant.metadata.kandi_stitch)
    }

    setDesignConfig({
      rows: Math.max(1, rows),
      stitch: stitch,
    })

  }, [options, selectedVariant, setDesignConfig]) 

  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({ ...prev, [title]: value }))
  }

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
    if (isWordBracelet && customWord.trim().length === 0) return null

    setIsAdding(true)

    setIsCapturing(true)
    await new Promise(resolve => setTimeout(resolve, 600)) 
    const imageUrl = captureCanvasImage()
    setIsCapturing(false)

    const metadata = {
          is_custom: showCustomInterface || pattern.length > 0,
          pattern_data: pattern,           
          kandi_pattern: pattern.map(p => typeof p === 'string' ? p : p.color), 
          image_url: imageUrl,             
          kandi_name: product.title, 
          kandi_vibe: "Creative",
          ...(customWord.trim().length > 0 && { custom_word: customWord.trim() })
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

  const isValid = useMemo(() => {
     if (!inStock || !selectedVariant) return false
     if (isKandiProduct && pattern.length === 0) return false
     if (isWordBracelet && customWord.trim().length === 0) return false
     return true
  }, [inStock, selectedVariant, isKandiProduct, pattern, isWordBracelet, customWord])

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

        {showCustomInterface && (
            <div className="flex flex-col gap-y-2 py-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="custom-word-input" className="text-sm font-medium text-ui-fg-base">
                        {isWordRequired ? "Your Word (Required)" : "Your Word (Optional)"}
                    </Label>
                    <span className={clx("text-xs", 
                        customWord.length === maxWordChars ? "text-rose-500 font-bold" : "text-ui-fg-subtle"
                    )}>
                        {customWord.length} / {maxWordChars}
                    </span>
                </div>
                <Input
                    id="custom-word-input"
                    placeholder={isWordBracelet ? "e.g. BESTIE" : "e.g. PLUR"}
                    value={customWord}
                    onChange={(e) => {
                        if (e.target.value.length <= maxWordChars) {
                            setCustomWord(e.target.value.toUpperCase())
                        }
                    }}
                    disabled={isAdding}
                    className={clx(
                        isWordRequired && customWord.length === 0 && "border-ui-border-error"
                    )}
                />
                {isWordRequired && customWord.length === 0 && (
                     <p className="text-xs text-ui-fg-muted">Enter the text you want on your bracelet.</p>
                )}
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
          {!selectedVariant 
             ? "Select variant" 
             : !inStock 
                ? "Out of stock" 
                : (isWordBracelet && customWord.trim().length === 0)
                   ? "Enter Your Word"
                   : (isKandiProduct && pattern.length === 0) 
                      ? "Add Beads to Design" 
                      : (isAdding ? "Adding to Cart..." : "Add to cart")
          }
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