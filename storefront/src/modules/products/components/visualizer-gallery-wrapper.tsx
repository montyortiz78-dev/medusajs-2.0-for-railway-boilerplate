"use client"

import ImageGallery from "@modules/products/components/image-gallery"
import KandiVisualizer from "@components/kandi-visualizer"
import { useKandiContext } from "@lib/context/kandi-context"
import { HttpTypes } from "@medusajs/types"

type VisualizerGalleryWrapperProps = {
  images: HttpTypes.StoreProduct["images"]
}

const VisualizerGalleryWrapper = ({ images }: VisualizerGalleryWrapperProps) => {
  const { pattern } = useKandiContext()

  // If the user has started a pattern, show the visualizer.
  // Otherwise, show the standard product image gallery.
  const showVisualizer = pattern.length > 0

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {showVisualizer ? (
         <div className="sticky top-24">
            <KandiVisualizer pattern={pattern.map(p => p.color)} />
         </div>
      ) : (
        <ImageGallery images={images || []} />
      )}
    </div>
  )
}

export default VisualizerGalleryWrapper