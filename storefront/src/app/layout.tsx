import { Metadata } from "next"
import "styles/globals.css"
import { ThemeProvider } from "lib/providers/theme-provider"
import { KandiProvider } from "lib/context/kandi-context" // <--- Import Provider
import KandiChatWidget from "components/kandi-chat-widget" // <--- Re-adding Chatbot

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
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
            </main>
          </KandiProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}