"use client"

import ImageGallery from "@modules/products/components/image-gallery"
import KandiVisualizer from "@components/kandi-visualizer"
import { useKandiContext } from "@lib/context/kandi-context"
import { HttpTypes } from "@medusajs/types"

type VisualizerGalleryWrapperProps = {
  images: HttpTypes.StoreProduct["images"]
}

const VisualizerGalleryWrapper = ({ images }: VisualizerGalleryWrapperProps) => {
  const { pattern, designConfig } = useKandiContext()

  const showVisualizer = pattern.length > 0

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {showVisualizer ? (
         <div className="sticky top-24">
            <KandiVisualizer 
                pattern={pattern} // CHANGED: Pass the full pattern array, do not .map()
                rows={designConfig.rows}
                stitch={designConfig.stitch}
            />
         </div>
      ) : (
        <ImageGallery images={images || []} />
      )}
    </div>
  )
}

export default VisualizerGalleryWrapper