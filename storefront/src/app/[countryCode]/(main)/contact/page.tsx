import { Metadata } from "next"
import { Heading, Text } from "@medusajs/ui"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with our team.",
}

export default function ContactPage() {
  return (
    <div className="content-container py-12 min-h-[calc(100vh-64px)]">
      <div className="max-w-2xl mx-auto glass p-8 rounded-lg">
        <Heading level="h1" className="text-3xl mb-6 text-ui-fg-base">
          Contact Us
        </Heading>
        <Text className="text-ui-fg-subtle mb-8">
          Have a question about your order or need help with a custom design? We're here to help!
        </Text>

        <div className="flex flex-col gap-y-6">
          <div>
            <Heading level="h3" className="text-lg mb-2 text-ui-fg-base">
              Email
            </Heading>
            <Text className="text-ui-fg-subtle">
              <a href="mailto:support@medusastore.com" className="hover:text-ui-fg-base transition-colors">
                support@medusastore.com
              </a>
            </Text>
          </div>

          <div>
            <Heading level="h3" className="text-lg mb-2 text-ui-fg-base">
              Customer Service Hours
            </Heading>
            <Text className="text-ui-fg-subtle">
              Monday - Friday: 9:00 AM - 5:00 PM EST
            </Text>
          </div>
          
           {/* Placeholder for a future contact form */}
           <div className="mt-8 p-6 border border-ui-border-base rounded-md bg-ui-bg-subtle">
              <Text className="text-center text-ui-fg-muted">
                (Contact Form Coming Soon)
              </Text>
           </div>
        </div>
      </div>
    </div>
  )
}