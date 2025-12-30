import { getCustomer } from "@lib/data/customer"
import AccountNav from "../components/account-nav"
import UnderlineLink from "@modules/common/components/interactive-link" // Check this import path
import React from "react"

const AccountLayout = async ({ customer, children }: { customer: any | null, children: React.ReactNode }) => {
  // If no customer is passed as prop, try to fetch it
  const user = customer || await getCustomer().catch(() => null)

  if (!user) {
    return (
      <div className="flex-1 content-container h-full max-w-5xl mx-auto bg-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Account Not Found</h2>
        <p className="mb-6 text-gray-600">You need to be logged in to view this page.</p>
        <UnderlineLink href="/account/login">Log in</UnderlineLink>
      </div>
    )
  }

  return (
    <div className="flex-1 small:py-12" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto bg-white flex flex-col">
        <div className="grid grid-cols-1  small:grid-cols-[240px_1fr] py-12">
          <div>
            <AccountNav customer={user} />
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout