import { Metadata } from "next"
import ContactForm from "@modules/contact/components/contact-form"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Kandi Creations team.",
}

export default function ContactPage() {
  return (
    <div className="py-12 min-h-[calc(100vh-64px)] bg-ui-bg-subtle transition-colors duration-300">
      <div className="content-container flex justify-center">
        <div className="max-w-2xl w-full bg-ui-bg-base p-8 small:p-12 rounded-2xl border border-ui-border-base shadow-sm">
          
          <h1 className="text-3xl font-bold mb-6 text-ui-fg-base">
            Contact Us
          </h1>
          <p className="text-ui-fg-subtle mb-8 text-base-regular">
            Have a question about your order or need help with a custom design? 
            We're here to help you bring your phygital creations to life!
          </p>

          <div className="flex flex-col gap-y-10">
            
             <div className="pt-6 border-t border-ui-border-base">
                <h3 className="text-xl font-bold mb-6 text-ui-fg-base">
                  Send us a message
                </h3>
                <ContactForm />
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}