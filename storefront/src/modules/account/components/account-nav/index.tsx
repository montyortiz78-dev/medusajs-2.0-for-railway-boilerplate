"use client"

import { clx } from "@medusajs/ui"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { useParams, usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signout } from "@lib/data/customer"

const AccountNav = ({
  customer,
}: {
  customer: Omit<any, "password_hash"> | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  // Check if we are on the main account overview page
  const isAccountOverview = route === `/${countryCode}/account`

  return (
    <div>
      {/* Mobile Breadcrumb: Only shows when on a sub-page (e.g. Orders) */}
      <div className="small:hidden">
        {!isAccountOverview ? (
          <LocalizedClientLink
            href="/account"
            className="flex items-center gap-x-2 text-small-regular py-2 text-ui-fg-base"
            data-testid="account-main-link"
          >
            <>
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
              <span>Account</span>
            </>
          </LocalizedClientLink>
        ) : null}
      </div>

      {/* Navigation Menu: Visible on Desktop, OR on Mobile if on the Overview page */}
      <div
        className={clx("small:block", {
          "hidden": !isAccountOverview, // Hide on mobile if on a sub-page
        })}
      >
        <div className="pb-4">
          <h3 className="text-base-semi text-ui-fg-base">Account</h3>
        </div>
        <div className="text-base-regular">
          <ul className="flex mb-0 justify-start items-start flex-col gap-y-4">
            <li>
              <AccountNavLink href="/account" route={route!}>
                Overview
              </AccountNavLink>
            </li>
            
            <li>
              <AccountNavLink href="/account/stash" route={route!}>
                💎 My Stash
              </AccountNavLink>
            </li>

            <li>
              <AccountNavLink href="/account/profile" route={route!}>
                Profile
              </AccountNavLink>
            </li>
            <li>
              <AccountNavLink href="/account/addresses" route={route!}>
                Addresses
              </AccountNavLink>
            </li>
            <li>
              <AccountNavLink href="/account/orders" route={route!}>
                Orders
              </AccountNavLink>
            </li>
            <li className="text-ui-fg-subtle hover:text-ui-fg-base">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-x-2"
                data-testid="logout-button"
              >
                Log out
                <ArrowRightOnRectangle />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
}

const AccountNavLink = ({ href, route, children }: AccountNavLinkProps) => {
  const { countryCode } = useParams()
  const active = route === `/${countryCode}${href}`
  return (
    <LocalizedClientLink
      href={href}
      className={clx("text-ui-fg-subtle hover:text-ui-fg-base transition-colors", {
        "text-ui-fg-base font-semibold": active,
        "text-pink-500 font-bold": active && href.includes("stash"),
      })}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default AccountNav