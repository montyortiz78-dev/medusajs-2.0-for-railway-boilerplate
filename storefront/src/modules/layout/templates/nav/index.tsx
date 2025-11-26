import { Suspense } from "react"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const regions = await listRegions().catch(() => null)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      {/* GLASSMORPHISM HEADER */}
      <header className="relative h-16 mx-auto duration-200 bg-black/40 backdrop-blur-xl border-b border-white/10">
        
        {/* Inner Content */}
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          
          {/* Left Side: Mobile Menu */}
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} />
            </div>
          </div>

          {/* Center: Logo / Brand */}
          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:text-ui-fg-base uppercase font-black tracking-widest"
              data-testid="nav-store-link"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-gradient-xy">
                KANDILAND
              </span>
            </LocalizedClientLink>
          </div>

          {/* Right Side: Search, Account, Cart */}
          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              {process.env.NEXT_PUBLIC_FEATURE_SEARCH_ENABLED && (
                <LocalizedClientLink
                  className="text-gray-300 hover:text-pink-400 transition-colors duration-200 font-bold"
                  href="/search"
                  scroll={false}
                  data-testid="nav-search-link"
                >
                  Search
                </LocalizedClientLink>
              )}
              
              <LocalizedClientLink
                className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 font-bold"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            
            {/* Cart Button with Hover Effect */}
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