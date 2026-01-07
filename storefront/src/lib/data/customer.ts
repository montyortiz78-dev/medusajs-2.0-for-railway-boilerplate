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

  // Check if token exists in headers (don't log the full token for security)
  const hasToken = !!headers.authorization
  const tokenPreview = headers.authorization ? headers.authorization.substring(0, 15) + "..." : "NONE"
  console.log(`🔍 getCustomer: Sending Authorization? ${hasToken} [${tokenPreview}]`)

  return await sdk.store.customer
    .retrieve({}, { next: { tags: ["customer"] }, ...headers } as any)
    .then(({ customer }) => customer)
    .catch((err) => {
      // --- DEBUG LOGGING ---
      console.error("❌ getCustomer Failed:", err.message)
      // If unauthorized, token is bad. If not found, user doesn't exist.
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
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const countryCode = (formData.get("country_code") as string) || "us"

  try {
    // Attempt to register auth identity
    const token = await sdk.auth.register("customer", "emailpass", {
      email,
      password,
    })
    
    // Initial customer creation
    await sdk.store.customer.create(
      {
        email,
        first_name: formData.get("first_name") as string,
        last_name: formData.get("last_name") as string,
        phone: formData.get("phone") as string,
      },
      {},
      { authorization: `Bearer ${token}` }
    )

    // Log them in immediately
    const loginRes = await sdk.auth.login("customer", "emailpass", { email, password }) as any
    const authToken = loginRes.access_token || loginRes.token || loginRes

    if (authToken) {
        setAuthToken(authToken)
        revalidateTag("customer")
        revalidateTag("order") // <--- ADD THIS
    }
  } catch (error: any) {
    if (error.message?.includes("exists")) {
        return "This email is already registered. Please sign in."
    }
    return error.toString()
  }
  
  redirect(`/${countryCode}/account`)
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase().trim()
  const password = formData.get("password") as string
  const countryCode = (formData.get("country_code") as string) || "us"

  try {
    const loginRes = await sdk.auth.login("customer", "emailpass", { 
        email, 
        password 
    }) as any

    const token = loginRes.access_token || loginRes.token || (typeof loginRes === "string" ? loginRes : undefined)

    if (token) {
        setAuthToken(token)
        // CRITICAL FIX: Invalidate 'order' so we don't serve cached guest errors
        revalidateTag("customer")
        revalidateTag("order") 
        revalidateTag("cart")
    } else {
        throw new Error("No token received")
    }
  } catch (error: any) {
    if (error.message && (error.message.includes("NEXT_REDIRECT") || error.digest?.includes("NEXT_REDIRECT"))) {
        throw error
    }
    return error.message || "Login failed."
  }

  redirect(`/${countryCode}/account`)
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()
  removeAuthToken()
  revalidateTag("auth")
  revalidateTag("customer")
  revalidateTag("order") // <--- ADD THIS
  revalidateTag("cart")
  redirect(`/${countryCode}/account`)
}

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

export const updateCustomerAddress = async (addressId: string, currentState: any, formData: FormData) => {
  const headers = getAuthHeaders() as { authorization: string }
  
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