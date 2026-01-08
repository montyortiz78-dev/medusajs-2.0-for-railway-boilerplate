import React from "react"
import { CreditCard } from "@medusajs/icons"

import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"
import PayPal from "@modules/common/icons/paypal"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  pp_system_default: {
    title: "Manual Payment",
    icon: <CreditCard />,
  },
  // Add more payment providers here
}

// This only checks if it is native stripe for card payments, it ignores the other stripe-based providers
export const isStripe = (providerId?: string) => {
  return providerId?.startsWith("pp_stripe_")
}
export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]

export const usStates = [
  { value: "us-al", label: "Alabama" },
  { value: "us-ak", label: "Alaska" },
  { value: "us-az", label: "Arizona" },
  { value: "us-ar", label: "Arkansas" },
  { value: "us-ca", label: "California" },
  { value: "us-co", label: "Colorado" },
  { value: "us-ct", label: "Connecticut" },
  { value: "us-de", label: "Delaware" },
  { value: "us-dc", label: "District Of Columbia" },
  { value: "us-fl", label: "Florida" },
  { value: "us-ga", label: "Georgia" },
  { value: "us-hi", label: "Hawaii" },
  { value: "us-id", label: "Idaho" },
  { value: "us-il", label: "Illinois" },
  { value: "us-in", label: "Indiana" },
  { value: "us-ia", label: "Iowa" },
  { value: "us-ks", label: "Kansas" },
  { value: "us-ky", label: "Kentucky" },
  { value: "us-la", label: "Louisiana" },
  { value: "us-me", label: "Maine" },
  { value: "us-md", label: "Maryland" },
  { value: "us-ma", label: "Massachusetts" },
  { value: "us-mi", label: "Michigan" },
  { value: "us-mn", label: "Minnesota" },
  { value: "us-ms", label: "Mississippi" },
  { value: "us-mo", label: "Missouri" },
  { value: "us-mt", label: "Montana" },
  { value: "us-ne", label: "Nebraska" },
  { value: "us-nv", label: "Nevada" },
  { value: "us-nh", label: "New Hampshire" },
  { value: "us-nj", label: "New Jersey" },
  { value: "us-nm", label: "New Mexico" },
  { value: "us-ny", label: "New York" },
  { value: "us-nc", label: "North Carolina" },
  { value: "us-nd", label: "North Dakota" },
  { value: "us-oh", label: "Ohio" },
  { value: "us-ok", label: "Oklahoma" },
  { value: "us-or", label: "Oregon" },
  { value: "us-pa", label: "Pennsylvania" },
  { value: "us-ri", label: "Rhode Island" },
  { value: "us-sc", label: "South Carolina" },
  { value: "us-sd", label: "South Dakota" },
  { value: "us-tn", label: "Tennessee" },
  { value: "us-tx", label: "Texas" },
  { value: "us-ut", label: "Utah" },
  { value: "us-vt", label: "Vermont" },
  { value: "us-va", label: "Virginia" },
  { value: "us-wa", label: "Washington" },
  { value: "us-wv", label: "West Virginia" },
  { value: "us-wi", label: "Wisconsin" },
  { value: "us-wy", label: "Wyoming" },
]