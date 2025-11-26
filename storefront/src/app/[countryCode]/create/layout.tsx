import { Metadata } from "next"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"

export const metadata: Metadata = {
  title: "Create Kandi",
  description: "Generate your own custom Phygital Kandi bracelet with AI.",
}

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav />
      {/* We render the children (the generator page) directly here. 
          The page itself handles the full-screen background. */}
      {children}
      <Footer />
    </>
  )
}