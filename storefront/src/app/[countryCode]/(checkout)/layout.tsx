import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import MedusaCTA from "@modules/layout/components/medusa-cta"
import { Suspense } from "react"
import CartButton from "@modules/layout/components/cart-button"
import { ThemeToggle } from "@components/theme-toggle"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full relative small:min-h-screen">
      {/* Header with Glass Effect */}
      <div className="h-16 bg-white/80 dark:bg-black/60 backdrop-blur-md border-b border-ui-border-base sticky top-0 z-50 transition-colors duration-300">
        <nav className="flex h-full items-center content-container justify-between">
          
          {/* Left: Back Link */}
          <div className="flex-1 basis-0 flex items-center">
            <LocalizedClientLink
              href="/cart"
              className="text-small-semi text-ui-fg-base flex items-center gap-x-2 uppercase group"
              data-testid="back-to-cart-link"
            >
              <ChevronDown className="rotate-90 text-ui-fg-subtle group-hover:text-ui-fg-base transition-colors" size={16} />
              <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle group-hover:text-ui-fg-base transition-colors">
                Back to cart
              </span>
              <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle group-hover:text-ui-fg-base transition-colors">
                Back
              </span>
            </LocalizedClientLink>
          </div>

          {/* Center: Logo */}
          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus text-ui-fg-base uppercase hover:text-ui-fg-interactive transition-colors"
              data-testid="store-link"
            >
              Medusa Store
            </LocalizedClientLink>
          </div>

          {/* Right: Nav Items (Search, Account, Toggle, Cart) */}
          <div className="flex-1 basis-0 flex justify-end items-center gap-x-6">
            <div className="hidden small:flex items-center gap-x-6 h-full text-small-regular text-ui-fg-subtle">
              {process.env.FEATURE_SEARCH_ENABLED && (
                <LocalizedClientLink
                  className="hover:text-ui-fg-base transition-colors"
                  href="/search"
                  scroll={false}
                  data-testid="nav-search-link"
                >
                  Search
                </LocalizedClientLink>
              )}
              <LocalizedClientLink
                className="hover:text-ui-fg-base transition-colors"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>

            <ThemeToggle />

            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </div>

      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
      
      <div className="py-4 w-full flex items-center justify-center">
        <MedusaCTA />
      </div>
    </div>
  )
}