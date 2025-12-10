import { Suspense } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "./paginated-products"
import { HttpTypes } from "@medusajs/types"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  categories,
  categoryId,
  activeCategory,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  categories: HttpTypes.StoreProductCategory[]
  categoryId?: string
  activeCategory?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1

  return (
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
      <RefinementList 
        sortBy={sortBy || "created_at"} 
        categories={categories}
        activeCategory={activeCategory} 
      />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1>{activeCategory ? categories.find(c => c.handle === activeCategory)?.name : "All Products"}</h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sortBy || "created_at"}
            page={pageNumber}
            countryCode={countryCode}
            categoryId={categoryId} // Pass the ID here so PaginatedProducts can filter
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate