import { Metadata } from "next"
import { Inter } from "next/font/google"
import { clx } from "@medusajs/ui"
import "../styles/globals.css" // Ensure this matches your CSS file location

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
    <html lang="en" data-mode="dark" className={clx("h-full dark", inter.variable)}>
      <body className="bg-black text-white h-full antialiased font-sans">
        <main className="relative flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}