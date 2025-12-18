"use client"

import ImageGallery from "@modules/products/components/image-gallery"
import KandiVisualizer from "@components/kandi-visualizer"
import { useKandiContext } from "@lib/context/kandi-context"
import { HttpTypes } from "@medusajs/types"

type VisualizerGalleryWrapperProps = {
  images: HttpTypes.StoreProduct["images"]
}

const VisualizerGalleryWrapper = ({ images }: VisualizerGalleryWrapperProps) => {
  // Pull isCapturing from context
  const { pattern, designConfig, isCapturing } = useKandiContext()

  const showVisualizer = pattern.length > 0

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {showVisualizer ? (
         <div className="sticky top-24">
            <KandiVisualizer 
                pattern={pattern} 
                rows={designConfig.rows} 
                stitch={designConfig.stitch}
                // Pass the capture mode to trigger the camera snap
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