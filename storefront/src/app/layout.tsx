import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      // Example modification in src/app/layout.tsx
      <body className={clx("bg-neutral-950 text-white font-sans", inter.variable)}>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
