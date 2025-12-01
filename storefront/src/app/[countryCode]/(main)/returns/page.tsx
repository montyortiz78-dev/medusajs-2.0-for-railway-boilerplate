import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description: "Read our returns and exchanges policy.",
}

export default function ReturnsPage() {
  return (
    <div className="content-container py-12 min-h-[calc(100vh-64px)]">
      <div className="max-w-3xl mx-auto glass p-8 rounded-lg">
        <h1 className="text-3xl font-medium mb-6 text-ui-fg-base font-sans">
          Returns & Exchanges
        </h1>
        
        <div className="flex flex-col gap-y-8 text-ui-fg-subtle">
          <section>
            <h2 className="text-xl font-medium mb-3 text-ui-fg-base font-sans">
              Our Policy
            </h2>
            <p className="mb-4 text-base-regular font-sans">
              We want you to be completely happy with your purchase. If you're not satisfied, you can return most items within 30 days of delivery for a full refund or exchange.
            </p>
            <p className="text-base-regular font-sans">
              To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-3 text-ui-fg-base font-sans">
              How to Initiate a Return
            </h2>
            <p className="mb-4 text-base-regular font-sans">
              To start a return, please contact our support team with your order number and details about the product you would like to return. We will respond quickly with instructions for how to return items from your order.
            </p>
             <LocalizedClientLink href="/contact" className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline">
                Contact Support to Start a Return
            </LocalizedClientLink>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-3 text-ui-fg-base font-sans">
              Refunds
            </h2>
            <p className="text-base-regular font-sans">
              Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund. If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}