"use client"

import { useEffect, useState } from "react"
import { clx } from "@medusajs/ui"

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie_consent")

    if (consent === "granted") {
      updateConsent(true)
    } else if (consent === "denied") {
      updateConsent(false)
    } else {
      // No choice made yet, show banner
      setShowBanner(true)
    }
  }, [])

  const updateConsent = (granted: boolean) => {
    const state = granted ? "granted" : "denied"

    // 1. Save choice locally
    localStorage.setItem("cookie_consent", state)

    // 2. Update Google Consent Mode
    // We check if window.gtag exists (it is initialized in layout.tsx)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        ad_storage: state,
        ad_user_data: state,
        ad_personalization: state,
        analytics_storage: state,
      })
    }

    // 3. Push a custom event to GTM (optional, but helpful for triggers)
    if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({
            event: granted ? "consent_granted" : "consent_denied"
        })
    }

    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 m-4 bg-ui-bg-base border border-ui-border-base rounded-lg shadow-lg md:max-w-md md:left-auto text-ui-fg-base">
      <h3 className="text-large-semi mb-2">Cookie Preferences</h3>
      <p className="text-small-regular text-ui-fg-subtle mb-4">
        We use cookies to ensure you get the best experience on our website. 
        By accepting, you agree to our tracking for analytics and personalized ads.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => updateConsent(false)}
          className="px-4 py-2 text-small-regular border border-ui-border-base rounded-md hover:bg-ui-bg-subtle transition-colors"
        >
          Decline
        </button>
        <button
          onClick={() => updateConsent(true)}
          className="px-4 py-2 text-small-regular bg-ui-fg-base text-ui-bg-base rounded-md hover:opacity-90 transition-opacity"
        >
          Accept All
        </button>
      </div>
    </div>
  )
}