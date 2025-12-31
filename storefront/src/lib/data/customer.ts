"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { cache } from "react"
import { getAuthHeaders, removeAuthToken, setAuthToken } from "./cookies"

export const getCustomer = cache(async function () {
  const headers = getAuthHeaders() as { authorization: string }

  // --- DEBUG LOGS (Check Railway Logs) ---
  if (!headers.authorization) {
     console.warn("⚠️ getCustomer: No Auth Token found (User is Guest).")
  } else {
     // Log truncated token to confirm persistence
     console.log(`✅ getCustomer: Token found (starts with ${headers.authorization.substring(7, 15)}...)`)
  }
  // ---------------------------------------

  return await sdk.store.customer
    .retrieve({}, { next: { tags: ["customer"] }, ...headers } as any)
    .then(({ customer }) => customer)
    .catch((err) => {
      // Suppress 401 errors as they are expected for guests
      if (err.message !== "Unauthorized") {
         console.error("❌ getCustomer: API Failed", err.message)
      }
      return null
    })
})

export const updateCustomer = cache(async function (
  body: HttpTypes.StoreUpdateCustomer
) {
  const headers = getAuthHeaders() as { authorization: string }
  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  revalidateTag("customer")
  return updateRes
})

export async function signup(_currentState: unknown, formData: FormData) {
  // ... (keep your existing signup code here)
  // Just ensure you add the country code logic if you want signup to redirect correctly too
  // For brevity, I am not repeating the full signup function unless you need it.
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    const customHeaders = { authorization: `Bearer ${token}` }
    
    await sdk.store.customer.create(customerForm, {}, customHeaders)

    const loginRes = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    }) as any

    let authToken = ""
    if (typeof loginRes === "string") authToken = loginRes
    else authToken = loginRes.access_token || loginRes.token

    if (authToken) setAuthToken(authToken)

    revalidateTag("customer")
    return null // Return null to indicate success if your form handles it
  } catch (error: any) {
    return error.toString()
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase().trim()
  const password = formData.get("password") as string
  // Retrieve the country code passed from the hidden input
  const countryCode = (formData.get("country_code") as string) || "us"

  console.log(`LOGIN: Attempting login for ${email} in region ${countryCode}`)
  let loggedIn = false

  try {
    const loginRes = await sdk.auth.login("customer", "emailpass", { 
        email, 
        password 
    }) as any

    let token: string | undefined

    if (typeof loginRes === "string") {
        token = loginRes
    } else if (typeof loginRes === "object") {
        if (loginRes.message) throw new Error(loginRes.message)
        token = loginRes.access_token || loginRes.token
    }

    if (token) {
        setAuthToken(token)
        revalidateTag("customer")
        loggedIn = true
        console.log("LOGIN: Success. Token set.")
    } else {
        throw new Error("Authentication failed: No token received")
    }
  } catch (error: any) {
    console.error("LOGIN ERROR:", error.toString())
    // Important: Re-throw redirect errors so Next.js handles them
    if (error.message && (error.message.includes("NEXT_REDIRECT") || error.digest?.includes("NEXT_REDIRECT"))) {
        throw error
    }
    return error.message || "Login failed."
  }

  if (loggedIn) {
    // FIX: Redirect DIRECTLY to the country-specific account page
    // This avoids the Middleware 307 redirect that drops cookies
    redirect(`/${countryCode}/account`)
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()
  removeAuthToken()
  revalidateTag("auth")
  revalidateTag("customer")
  redirect(`/${countryCode}/account`)
}

// ... (Rest of the file: resetPassword, updatePassword, addresses, etc. keep as is) ...
// Ensure you keep the rest of your file exports!
export async function resetPassword(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  try {
    await sdk.client.fetch("/store/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { email },
    })
    return null
  } catch (error: any) {
    return "Something went wrong."
  }
}

export async function updatePassword(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const token = formData.get("token") as string
  const password = formData.get("password") as string

  try {
      const res = await sdk.client.fetch("/store/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { email, token, password },
      }) as { success: boolean; message?: string }
  
      if (!res.success) return res.message || "Failed"
      return null
    } catch (error: any) {
      return error.message
    }
}

export const addCustomerAddress = async (_currentState: unknown, formData: FormData) => {
  const headers = getAuthHeaders() as { authorization: string }
  
  return sdk.store.customer.createAddress({
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      company: formData.get("company") as string,
      address_1: formData.get("address_1") as string,
      address_2: formData.get("address_2") as string,
      city: formData.get("city") as string,
      postal_code: formData.get("postal_code") as string,
      province: formData.get("province") as string,
      country_code: formData.get("country_code") as string,
      phone: formData.get("phone") as string,
  }, {}, headers).then(({customer}) => {
      revalidateTag("customer")
      return { success: true, error: null }
  }).catch(err => ({ success: false, error: err.toString() }))
}

export const deleteCustomerAddress = async (addressId: string) => {
  const headers = getAuthHeaders() as { authorization: string }
  await sdk.store.customer.deleteAddress(addressId, headers)
  revalidateTag("customer")
  return { success: true, error: null }
}

export const updateCustomerAddress = async (currentState: any, formData: FormData) => {
  const headers = getAuthHeaders() as { authorization: string }
  const addressId = currentState.addressId as string
  return sdk.store.customer.updateAddress(addressId, {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      company: formData.get("company") as string,
      address_1: formData.get("address_1") as string,
      address_2: formData.get("address_2") as string,
      city: formData.get("city") as string,
      postal_code: formData.get("postal_code") as string,
      province: formData.get("province") as string,
      country_code: formData.get("country_code") as string,
      phone: formData.get("phone") as string,
  }, {}, headers).then(() => {
      revalidateTag("customer")
      return { success: true, error: null }
  }).catch(err => ({ success: false, error: err.toString() }))
}