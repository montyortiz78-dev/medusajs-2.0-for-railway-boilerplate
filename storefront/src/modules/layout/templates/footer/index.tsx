import { Text, clx } from "@medusajs/ui"
import { getCategoriesList } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const { collections } = await getCollectionsList(0, 6)
  const { product_categories } = await getCategoriesList(0, 6)

  return (
    <footer className="border-t border-ui-border-base bg-ui-bg-subtle w-full relative overflow-hidden transition-colors duration-300">
      
      {/* Subtle Glow at the top of footer */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />

      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between py-20">
          
          {/* Brand Section */}
          <div className="max-w-sm">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 uppercase font-black hover:text-ui-fg-base"
            >
              Kandi Creations
            </LocalizedClientLink>
            <Text className="txt-small-plus text-ui-fg-subtle mt-4">
              The world's first AI-powered Phygital Kandi market. 
              Design on the blockchain, wear in the rave.
            </Text>
          </div>

          {/* Links Section */}
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {product_categories && product_categories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base font-bold">Categories</span>
                <ul className="grid grid-cols-1 gap-2" data-testid="footer-categories">
                  {product_categories?.slice(0, 6).map((c) => {
                    if (c.parent_category) return null
                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null

                    return (
                      <li
                        className="flex flex-col gap-2 text-ui-fg-subtle hover:text-pink-400 transition-colors"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-pink-400 transition-colors",
                            children && "txt-small-plus"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children &&
                              children.map((child) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="hover:text-pink-400 transition-colors"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            
            {/* Collections */}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base font-bold">Collections</span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-ui-fg-subtle hover:text-pink-400 transition-colors",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-cyan-400 transition-colors"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex w-full mb-16 justify-between text-ui-fg-muted border-t border-ui-border-base pt-6">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} KandiCreations.com. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  )
}