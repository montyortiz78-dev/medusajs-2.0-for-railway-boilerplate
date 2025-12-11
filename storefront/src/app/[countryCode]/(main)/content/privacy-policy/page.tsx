import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Kandi Land",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-ui-fg-base">
      <header className="mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter">
          PRIVACY POLICY
        </h1>
        <p className="text-ui-fg-subtle">
          Last Updated: December 2025
        </p>
      </header>

      <div className="space-y-8 leading-relaxed text-sm md:text-base">
        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">1. Introduction</h2>
          <p>
            Welcome to Kandi Land ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. 
            This Privacy Policy explains what information we collect, how we use it, and your rights when you visit our website 
            or use our "Phygital" services (creating custom Kandi and minting digital collectibles).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">2. Information We Collect</h2>
          <p className="mb-2">We collect personal information that you voluntarily provide to us when you:</p>
          <ul className="list-disc pl-5 space-y-1 text-ui-fg-subtle">
            <li>Register on the website.</li>
            <li>Place an order for physical goods (Shipping Address, Name, Billing Info).</li>
            <li>Create a custom design using our Generator.</li>
            <li>Request a digital collectible (Wallet Address).</li>
            <li>Contact us for support.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">3. How We Use Your Information</h2>
          <p className="mb-2">We use your information for legitimate business purposes, including:</p>
          <ul className="list-disc pl-5 space-y-1 text-ui-fg-subtle">
            <li><strong>Fulfillment:</strong> To ship your custom Kandi bracelets to your physical address.</li>
            <li><strong>Digital Asset Minting:</strong> To associate your unique design with an NFT/Digital Collectible on the blockchain via our partners (e.g., Crossmint).</li>
            <li><strong>Account Management:</strong> To manage your orders, designs, and "Stash".</li>
            <li><strong>Security:</strong> To protect our services and prevent fraud.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">4. Sharing Information</h2>
          <p className="mb-2">We strictly do not sell your data. We only share information with:</p>
          <ul className="list-disc pl-5 space-y-1 text-ui-fg-subtle">
            <li><strong>Service Providers:</strong> Payment processors (e.g., Stripe), shipping partners (e.g., USPS), and blockchain infrastructure providers (e.g., Crossmint) needed to deliver our services.</li>
            <li><strong>Legal Obligations:</strong> If required by law or valid legal processes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">5. Your Digital Collectibles</h2>
          <p>
            When you purchase a "Phygital" item, a public record of the digital asset is created on the blockchain. 
            While this record is pseudonymous (linked to a wallet address, not your name), please be aware that blockchain transactions are public and permanent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">6. Contact Us</h2>
          <p>
            If you have questions or comments about this policy, you may email us at support@kandiland.xyz.
          </p>
        </section>
      </div>
    </div>
  )
}