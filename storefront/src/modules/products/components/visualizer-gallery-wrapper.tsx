"use client"

import { useEffect } from "react"
import ImageGallery from "@modules/products/components/image-gallery"
import KandiVisualizer from "@components/kandi-visualizer"
import { useKandiContext } from "@lib/context/kandi-context"
import { HttpTypes } from "@medusajs/types"

type VisualizerGalleryWrapperProps = {
  images: HttpTypes.StoreProduct["images"]
  // FIX: Accept metadata to check for pattern
  productMetadata?: Record<string, unknown> | null
}

const VisualizerGalleryWrapper = ({ images, productMetadata }: VisualizerGalleryWrapperProps) => {
  const { pattern, setPattern, designConfig, setDesignConfig, isCapturing } = useKandiContext()

  // FIX: Initialize Pattern from Metadata if present
  useEffect(() => {
    // Only initialize if pattern is empty and metadata exists
    if (productMetadata?.pattern_data && Array.isArray(productMetadata.pattern_data) && pattern.length === 0) {
        const rawPattern = productMetadata.pattern_data as string[]
        
        // Convert simple string array to bead objects
        const formattedPattern = rawPattern.map(color => ({
            id: Math.random().toString(36).substr(2, 9),
            color: color,
            type: 'pony'
        }))
        setPattern(formattedPattern)
        
        // Also load config (Rows/Stitch) if exists
        if (productMetadata.kandi_rows || productMetadata.kandi_stitch) {
            setDesignConfig({
                rows: Number(productMetadata.kandi_rows) || 1,
                stitch: String(productMetadata.kandi_stitch || 'ladder')
            })
        }
    }
  }, [productMetadata, pattern.length, setPattern, setDesignConfig])

  // Show visualizer if we have a pattern (either from metadata or user interaction)
  const showVisualizer = pattern.length > 0

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {showVisualizer ? (
         <div className="sticky top-24">
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