import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text } from "@medusajs/ui"

export default function FeaturedCategories({
  categories,
}: {
  categories: HttpTypes.StoreProductCategory[]
}) {
  if (!categories.length) {
    return null
  }

  return (
    <div className="py-12">
      <div className="content-container py-12">
        <div className="flex flex-col gap-4 mb-8">
          <Text className="txt-xlarge-plus text-ui-fg-base">
            Shop by Category
          </Text>
        </div>
        <ul className="grid grid-cols-2 small:grid-cols-4 gap-4">
          {categories.map((c) => (
            <li key={c.id}>
              <LocalizedClientLink
                href={`/categories/${c.handle}`}
                className="group flex flex-col items-center justify-center p-8 bg-ui-bg-subtle rounded-rounded hover:bg-ui-bg-subtle-hover transition-colors h-full border border-transparent hover:border-ui-border-base"
              >
                <Text className="text-lg-regular text-ui-fg-base group-hover:text-ui-fg-interactive transition-colors">
                  {c.name}
                </Text>
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}