import { Metadata } from "next"
import Hero from "@modules/home/components/hero"
import StoreTemplate from "@modules/store/templates"
import { listCategories } from "@lib/data/categories"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export const metadata: Metadata = {
  title: "Kandi Creations",
  description: "The Phygital Lab.",
}

type Params = {
  searchParams: {
    sortBy?: SortOptions
    page?: string
    category?: string
  }
  params: {
    countryCode: string
  }
}

export default async function Home({ params, searchParams }: Params) {
  const { sortBy, page, category } = searchParams
  const { countryCode } = params

  // 1. Fetch Categories for the filter sidebar
  const categories = await listCategories()

  // 2. Resolve Category ID if a category filter is active
  const activeCategoryData = categories.find(c => c.handle === category)
  const categoryId = activeCategoryData?.id

  return (
    <>
      <Hero />
      <StoreTemplate
        sortBy={sortBy}
        page={page}
        countryCode={countryCode}
        categories={categories}
        categoryId={categoryId}
        activeCategory={category}
      />
    </>
  )
}