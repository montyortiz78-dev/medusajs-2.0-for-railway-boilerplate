import { KandiProvider } from "@lib/context/kandi-context"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <KandiProvider>
      <Nav />
      <main className="relative">{children}</main>
      <Footer />
    </KandiProvider>
  )
}