import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of Use for Kandi Land",
}

export default function TermsOfUsePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-ui-fg-base">
      <header className="mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter">
          TERMS OF USE
        </h1>
        <p className="text-ui-fg-subtle">
          Last Updated: December 2025
        </p>
      </header>

      <div className="space-y-8 leading-relaxed text-sm md:text-base">
        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">1. Agreement to Terms</h2>
          <p>
            These Terms of Use constitute a legally binding agreement made between you ("User") and Kandi Land ("we," "us," or "our"). 
            By accessing our "Phygital" marketplace, creating custom designs, or purchasing products, you agree to be bound by these terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">2. Custom Kandi Creations</h2>
          <p className="mb-2">Our service allows you to design custom Kandi bracelets.</p>
          <ul className="list-disc pl-5 space-y-1 text-ui-fg-subtle">
            <li><strong>User-Generated Content:</strong> You represent that any text, words, or patterns you submit do not violate any third-party rights or contain hate speech, explicit content, or offensive language.</li>
            <li><strong>Right to Refuse:</strong> We reserve the right to cancel and refund any order that we deem inappropriate, offensive, or technically unfeasible to produce.</li>
            <li><strong>Artistic Variation:</strong> As stated in our product disclaimer, the 3D preview is for visualization. Minor variations in bead count, color shading, and spacing may occur in the final physical product to ensure structural integrity.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">3. Digital Collectibles (NFTs)</h2>
          <p className="mb-2">Certain purchases include a complementary digital collectible ("NFT") minted on the blockchain.</p>
          <ul className="list-disc pl-5 space-y-1 text-ui-fg-subtle">
            <li><strong>Ownership:</strong> You own the specific NFT token associated with your purchase.</li>
            <li><strong>License:</strong> You are granted a non-exclusive, personal license to display the digital artwork associated with your NFT. You do not own the underlying 3D generation code or the Kandi Land brand IP.</li>
            <li><strong>Wallet Responsibility:</strong> If you choose to transfer your NFT to a personal wallet, you are responsible for the security of that wallet. We cannot recover lost or stolen digital assets once transferred.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">4. Returns and Refunds</h2>
          <p>
            <strong>Custom Products:</strong> Due to the personalized nature of our "Create" products, <u>all sales of custom Kandi are final</u> and non-refundable, except in the case of manufacturing defects or shipping damage.
          </p>
          <p className="mt-2">
            <strong>Standard Store Products:</strong> Non-custom items may be returned within 14 days of receipt if they are unused and in original packaging.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">5. Shipping</h2>
          <p>
            We are not responsible for delays caused by shipping carriers, customs clearance, or incorrect addresses provided by the User. 
            Risk of loss passes to you upon our delivery to the carrier.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">6. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Kandi Land shall not be liable for any indirect, consequential, or incidental damages arising out of your use of the service or the products purchased.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">7. Contact Information</h2>
          <p>
            For questions regarding these Terms, please contact us at support@kandiland.xyz.
          </p>
        </section>
      </div>
    </div>
  )
}