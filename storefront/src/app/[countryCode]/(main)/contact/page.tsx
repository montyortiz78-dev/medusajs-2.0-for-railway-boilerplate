import { Metadata } from "next"
import ContactForm from "@modules/contact/components/contact-form"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with our team.",
}

export default function ContactPage() {
  return (
    <div className="content-container py-12 min-h-[calc(100vh-64px)]">
      <div className="max-w-2xl mx-auto glass p-8 rounded-lg">
        <h1 className="text-3xl font-medium mb-6 text-ui-fg-base font-sans">
          Contact Us
        </h1>
        <p className="text-ui-fg-subtle mb-8 text-base-regular font-sans">
          Have a question about your order or need help with a custom design? We're here to help!
        </p>

        <div className="flex flex-col gap-y-8">
          <div className="flex flex-col gap-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-ui-fg-base font-sans">
                Customer Service Hours
              </h3>
              <p className="text-ui-fg-subtle text-base-regular font-sans">
                Monday - Friday: 9:00 AM - 5:00 PM EST
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-ui-fg-base font-sans">
                Email
              </h3>
              <p className="text-ui-fg-subtle text-base-regular font-sans">
                <a href="mailto:support@medusastore.com" className="hover:text-ui-fg-base transition-colors">
                  support@medusastore.com
                </a>
              </p>
            </div>
          </div>
          
           <div className="mt-4">
              <h3 className="text-xl font-medium mb-4 text-ui-fg-base font-sans">
                Send us a message
              </h3>
              <ContactForm />
           </div>
        </div>
      </div>
    </div>
  )
}