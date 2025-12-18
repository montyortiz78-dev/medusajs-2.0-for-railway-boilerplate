import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  return (
    <>
      {/* @ts-expect-error Server Component */}
      <Nav />
      {props.children}
      {/* @ts-expect-error Server Component */}
      <Footer />
    </>
  )
}