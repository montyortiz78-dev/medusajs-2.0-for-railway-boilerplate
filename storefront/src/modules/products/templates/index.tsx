import React, { Suspense } from "react"
import { InformationCircle } from "@medusajs/icons" // <--- Added Import

import ImageGallery from "@modules/products/components/image-gallery"
import PartComponent from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"
import { KandiProvider } from "@lib/context/kandi-context"
import VisualizerGalleryWrapper from "@modules/products/components/visualizer-gallery-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <KandiProvider>
      <div
        className="content-container flex flex-col small:flex-row small:items-start py-6 relative"
        data-testid="product-container"
      >
        <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-6">
          <ProductInfo product={product} />
          <ProductTabs product={product} />
        </div>
        <div className="block w-full relative">
          <VisualizerGalleryWrapper 
            images={product?.images} 
            productMetadata={product?.metadata}
          />
        </div>
        <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-12">
          <ProductOnboardingCta />
          <Suspense
            fallback={
              <PartComponent
                disabled={true}
                product={product}
                region={region}
              />
            }
          >
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>
        </div>
      </div>

      {/* --- DISCLAIMER ADDED HERE --- */}
      <div className="content-container">
        <div className="max-w-3xl mx-auto mt-20 p-6 border-t border-ui-border-base flex gap-4 text-ui-fg-muted opacity-80 hover:opacity-100 transition-opacity bg-white/50 dark:bg-black/20 rounded-2xl backdrop-blur-sm">
            <InformationCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
                <strong>Disclaimer:</strong> The digital 3D preview is for visualization purposes only and is not an exact replica of the physical product. 
                Our artists will replicate your pattern and colors as closely as possible, but due to the varying number of beads required for different 
                styles (e.g., Cuffs vs. Singles) and sizes, we may need to creatively adapt the design to ensure structural integrity and fit. 
                By purchasing, you agree to these minor artistic variations.
            </p>
        </div>
      </div>
      {/* --------------------------- */}

      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </KandiProvider>
  )
}

export default ProductTemplate