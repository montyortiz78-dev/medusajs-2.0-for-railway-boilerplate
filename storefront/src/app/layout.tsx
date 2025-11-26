import { Metadata } from "next"
import { Inter } from "next/font/google" // <--- FIX 1: Import the font
import { clx } from "@medusajs/ui"       // <--- FIX 2: Import the utility
import "../styles/globals.css"           // Make sure this points to your css

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    template: "%s | KandiLand",
    default: "KandiLand Phygital Market",
  },
  description: "AI-Generated Kandi. Minted on Blockchain. Delivered to your door.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-mode="dark" className={clx("h-full", inter.variable)}>
      <body className="bg-black text-white h-full antialiased font-sans">
        <main className="relative flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}