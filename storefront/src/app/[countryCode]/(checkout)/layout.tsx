import { Metadata } from "next"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"

// OPTIONAL: You can keep the metadata export if you want specific checkout metadata
export const metadata: Metadata = {
  title: "Checkout",
  robots: "noindex", 
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full relative small:min-h-screen flex flex-col">
      {/* 1. Use the Standard Nav */}
      <Nav />

      {/* 2. Main Checkout Content */}
      {/* Added flex-1 to push footer down if content is short */}
      <div className="relative flex-1" data-testid="checkout-container">
        {children}
      </div>

      {/* 3. Use the Standard Footer */}
      <Footer />
    </div>
  )
}