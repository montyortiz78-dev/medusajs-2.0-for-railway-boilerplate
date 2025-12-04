import { Metadata } from "next"
import FeaturedProducts from "@modules/home/components/featured-products"
import FeaturedCategories from "@modules/home/components/featured-categories"
import Hero from "@modules/home/components/hero"
import { getCollectionsList } from "@lib/data/collections"
import { getCategoriesList } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Medusa Store",
  description:
    "A performant frontend Ecommerce Starter Template with Next.js 14 and Medusa.",
}

export default async function Home({
  params: { countryCode },
}: {
  params: { countryCode: string }
}) {
  const { collections } = await getCollectionsList(0, 3)
  const { product_categories } = await getCategoriesList(0, 20) // Fetch more to filter client-side if needed
  const region = await getRegion(countryCode)

  if (!collections || !region) {
    return null
  }

  // Filter for top-level categories (no parent)
  const parents = product_categories.filter(c => !c.parent_category_id).slice(0, 6)

  return (
    <>
      <Hero />
      
      <FeaturedCategories categories={parents} />

      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}