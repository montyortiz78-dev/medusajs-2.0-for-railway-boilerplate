import { Metadata } from "next"
import { Heading, Text } from "@medusajs/ui"

export const metadata: Metadata = {
  title: "Privacy Policy",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12">
      <div className="content-container">
        <div className="max-w-3xl mx-auto glass p-10 rounded-2xl border border-white/10">
          <Heading level="h1" className="text-3xl text-white mb-8">Privacy Policy 🔒</Heading>
          
          <div className="flex flex-col gap-y-6 text-gray-300 leading-relaxed">
            <Text>
              At KandiLand, we value your privacy. This policy outlines how we collect, use, and protect your personal information.
            </Text>

            <Heading level="h2" className="text-xl text-white mt-4">1. Information We Collect</Heading>
            <Text>
              We collect information you provide directly to us, such as when you create an account, generate a Kandi design, or make a purchase. This includes your name, email address, shipping address, and payment information.
            </Text>

            <Heading level="h2" className="text-xl text-white mt-4">2. How We Use Your Data</Heading>
            <Text>
              We use your data to fulfill your orders, mint your NFTs (which requires sharing your email with our wallet provider Crossmint), and improve our AI generation algorithms.
            </Text>

            <Heading level="h2" className="text-xl text-white mt-4">3. Blockchain Data</Heading>
            <Text>
              Please note that transactions on the blockchain are public. When you mint a Kandi NFT, the ownership record is permanently visible on the public ledger.
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
}