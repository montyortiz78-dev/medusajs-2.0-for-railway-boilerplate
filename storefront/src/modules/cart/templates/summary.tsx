import { Button, Heading } from "@medusajs/ui"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions?: HttpTypes.StorePromotion[]
  }
}

const Summary = ({ cart }: SummaryProps) => {
  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Heading>
      
      {/* THE GLASS UPGRADE */}
      <div className="glass p-6 rounded-2xl flex flex-col gap-y-4">
        
        <CartTotals data={cart} />
        
        <LocalizedClientLink href={"/checkout?step=" + cart.checkout_step} passHref>
          <Button className="w-full h-12 bg-white text-black hover:bg-gray-200 font-bold tracking-wide rounded-lg">
            Go to checkout
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default Summary