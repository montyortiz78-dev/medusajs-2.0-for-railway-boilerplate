import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import MedusaCTA from "@modules/layout/components/medusa-cta"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // REMOVED: bg-white (allows global dark body gradient to show)
    <div className="w-full relative small:min-h-screen">
      
      {/* ADDED: Glass effect for header (bg-black/60 + blur) and sticky positioning */}
      <div className="h-16 bg-black/60 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-ui-fg-base flex items-center gap-x-2 uppercase flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90 text-ui-fg-subtle" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base transition-colors">
              Back to shopping cart
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base transition-colors">
              Back
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="txt-compact-xlarge-plus text-ui-fg-subtle hover:text-ui-fg-base uppercase transition-colors"
            data-testid="store-link"
          >
            Medusa Store
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
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