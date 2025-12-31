"use client"

import { useEffect } from "react"
import ImageGallery from "@modules/products/components/image-gallery"
import KandiVisualizer from "@components/kandi-visualizer"
import { useKandiContext } from "@lib/context/kandi-context"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui" // <--- Import Button
import { Trash, XMark } from "@medusajs/icons" // <--- Import Icons

type VisualizerGalleryWrapperProps = {
  images: HttpTypes.StoreProduct["images"]
  productMetadata?: Record<string, unknown> | null
}

const VisualizerGalleryWrapper = ({ images, productMetadata }: VisualizerGalleryWrapperProps) => {
  // Destructure clearDesign from context
  const { 
    pattern, 
    setPattern, 
    designConfig, 
    setDesignConfig, 
    isCapturing,
    clearDesign 
  } = useKandiContext()

  // Initialize Pattern from Metadata if present
  useEffect(() => {
    if (productMetadata?.pattern_data && Array.isArray(productMetadata.pattern_data) && pattern.length === 0) {
        const rawPattern = productMetadata.pattern_data as string[]
        
        const formattedPattern = rawPattern.map(color => ({
            id: Math.random().toString(36).substr(2, 9),
            color: color,
            type: 'pony'
        }))
        setPattern(formattedPattern)
        
        if (productMetadata.kandi_rows || productMetadata.kandi_stitch) {
            setDesignConfig({
                rows: Number(productMetadata.kandi_rows) || 1,
                stitch: String(productMetadata.kandi_stitch || 'ladder')
            })
        }
    }
  }, [productMetadata, pattern.length, setPattern, setDesignConfig])

  const showVisualizer = pattern.length > 0

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {showVisualizer ? (
         <div className="sticky top-24 border border-ui-border-base rounded-lg overflow-hidden bg-ui-bg-subtle">
            
            {/* --- CLEAR & CLOSE BUTTON --- */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <Button 
                    variant="danger" 
                    size="small" 
                    onClick={clearDesign}
                    className="shadow-md backdrop-blur-sm bg-white/90 hover:bg-red-100 text-red-600 border-red-200"
                >
                    <Trash className="mr-1" /> Clear & Close
                </Button>
            </div>
            {/* --------------------------- */}

            <KandiVisualizer 
                pattern={pattern} 
                rows={designConfig.rows} 
                stitch={designConfig.stitch}
                captureMode={isCapturing} 
            />
         </div>
      ) : (
        <ImageGallery images={images || []} />
      )}
    </div>
  )
}

export default VisualizerGalleryWrapper