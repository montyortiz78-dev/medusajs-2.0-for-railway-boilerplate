import { Metadata } from "next"
import "styles/globals.css"
import { ThemeProvider } from "lib/providers/theme-provider"
import KandiChatWidget from "@components/kandi-chat-widget"

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
          <main className="relative">
            {props.children}
            {/* Add the Chat Widget here */}
            <KandiChatWidget /> 
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}