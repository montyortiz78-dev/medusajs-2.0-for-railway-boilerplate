import { Metadata } from "next"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import { listCategories } from "@lib/data/categories"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: {
    sortBy?: SortOptions
    page?: string
    category?: string // We receive the category handle here
  }
  params: {
    countryCode: string
  }
}

export default async function StorePage({ searchParams, params }: Params) {
  const { sortBy, page, category } = searchParams

  // 1. Fetch Categories to display in the sidebar
  const categories = await listCategories()
  
  // 2. Resolve the Category ID from the Handle
  // The URL gives us a handle (e.g., "bracelets"), but the API needs the ID.
  const activeCategoryData = categories.find(c => c.handle === category)
  const categoryId = activeCategoryData?.id

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      categories={categories}
      categoryId={categoryId} // Pass ID for fetching products
      activeCategory={category} // Pass Handle for UI highlighting
    />
  )
}