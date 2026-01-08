import { Metadata } from "next"
import Script from "next/script"
import "styles/globals.css"
import { ThemeProvider } from "lib/providers/theme-provider"
import { KandiProvider } from "lib/context/kandi-context"
import KandiChatWidget from "components/kandi-chat-widget"
import CookieBanner from "components/cookie-banner"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* 2. Initialize Consent Mode DEFAULT (Denied) */}
      {/* This MUST run before the main GTM script */}
      <Script id="google-consent-mode" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied',
            'wait_for_update': 500
          });
        `}
      </Script>
      {/* 3. Paste the GTM "Head" Script here using the Script component */}
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-W2576T6Q');
        `}
      </Script>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W2576T6Q"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* FIX: Wrap the application in KandiProvider */}
          <KandiProvider>
            <main className="relative">
              {props.children}
              <KandiChatWidget />
              <CookieBanner />
            </main>
          </KandiProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}