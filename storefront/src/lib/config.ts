import Medusa from "@medusajs/js-sdk"

// Debug check to ensure key is loaded in Vercel
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
if (!publishableKey && process.env.NODE_ENV === "production") {
  console.error("⚠️ CRITICAL: NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is missing in config.ts")
}

export const sdk = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  debug: process.env.NODE_ENV === "development",
  publishableKey: publishableKey,
})