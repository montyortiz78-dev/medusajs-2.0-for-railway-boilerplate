import { Suspense } from "react"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import { MagnifyingGlass } from "@medusajs/icons" // Import the icon

export default async function Nav() {
  const regions = await listRegions().catch(() => null)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      {/* GLASS HEADER CONTAINER */}
      <header className="relative h-16 mx-auto duration-200 glass border-b-0">
        
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          
          {/* Left Side: Empty to keep logo centered (SideMenu removed) */}
          <div className="flex-1 basis-0 h-full flex items-center">
             {/* Hamburger removed */}
          </div>

          {/* Center: Logo */}
          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:text-white uppercase font-black tracking-widest"
              data-testid="nav-store-link"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-gradient-xy">
                KANDILAND
              </span>
            </LocalizedClientLink>
          </div>

          {/* Right Side: Search Icon, Account, Cart */}
          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              {process.env.NEXT_PUBLIC_FEATURE_SEARCH_ENABLED && (
                <LocalizedClientLink
                  className="hover:text-pink-400 transition-colors flex items-center justify-center"
                  href="/search"
                  scroll={false}
                  data-testid="nav-search-link"
                >
                  {/* SEARCH ICON */}
                  <MagnifyingGlass className="text-gray-300 hover:text-pink-400 w-6 h-6" />
                </LocalizedClientLink>
              )}
              
              <LocalizedClientLink
                className="text-gray-300 hover:text-cyan-400 transition-colors font-bold"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="text-gray-300 hover:text-white flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <div className="text-gray-300 hover:text-white transition-colors">
                <CartButton />
              </div>
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}