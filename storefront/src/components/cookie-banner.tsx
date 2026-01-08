"use client"

import { useEffect, useState } from "react"

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent")
    console.log("🍪 Cookie Consent Status:", consent) // DEBUG: Check console

    if (!consent) {
      setShowBanner(true)
    } else {
      // Ensure GTM is updated even if banner is hidden
      updateGTM(consent === "granted")
    }
  }, [])

  const updateGTM = (granted: boolean) => {
    if (typeof window === "undefined") return

    const state = granted ? "granted" : "denied"
    if (window.gtag) {
      window.gtag("consent", "update", {
        ad_storage: state,
        ad_user_data: state,
        ad_personalization: state,
        analytics_storage: state,
      })
    }
    if (window.dataLayer) {
      window.dataLayer.push({
        event: granted ? "consent_granted" : "consent_denied",
      })
    }
  }

  const handleConsent = (granted: boolean) => {
    localStorage.setItem("cookie_consent", granted ? "granted" : "denied")
    updateGTM(granted)
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 m-4 bg-white dark:bg-zinc-900 border border-ui-border-base rounded-lg shadow-2xl md:max-w-md md:left-auto text-ui-fg-base">
      <h3 className="text-large-semi mb-2">Cookie Preferences</h3>
      <p className="text-small-regular text-ui-fg-subtle mb-4">
        We use cookies to ensure you get the best experience. By accepting, you
        agree to our tracking for analytics and ads.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => handleConsent(false)}
          className="px-4 py-2 text-small-regular border border-ui-border-base rounded-md hover:bg-ui-bg-subtle transition-colors"
        >
          Decline
        </button>
        <button
          onClick={() => handleConsent(true)}
          className="px-4 py-2 text-small-regular bg-black text-white dark:bg-white dark:text-black rounded-md hover:opacity-90 transition-opacity"
        >
          Accept All
        </button>
      </div>
    </div>
  )
}