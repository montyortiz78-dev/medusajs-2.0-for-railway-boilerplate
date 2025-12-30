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

  // Only log if headers are actually missing to reduce noise
  if (!headers.authorization) {
    // This is expected when a user is not logged in, so we can suppress it or keep it as debug
    // console.log("ℹ️ getCustomer: No Auth Token found (User likely guest).")
  }

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
    
    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      customHeaders
    )

    // Log the user in immediately after signup
    const loginRes = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    }) as any

    const authToken = loginRes.access_token || loginRes.token

    if (authToken) {
        setAuthToken(authToken)
    }

    revalidateTag("customer")
    return createdCustomer
  } catch (error: any) {
    return error.toString()
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase().trim()
  const password = formData.get("password") as string

  console.log("LOGIN DEBUG: Attempting login for:", email)
  let loggedIn = false

  try {
    const loginRes = await sdk.auth.login("customer", "emailpass", { 
        email, 
        password 
    }) as any

    // --- NEW DEBUGGING LOGIC ---
    // Often Medusa returns { message: "Invalid credentials" } instead of throwing
    if (loginRes.message) {
      console.error("LOGIN FAILED (API Message):", loginRes.message)
      throw new Error(loginRes.message)
    }

    // Check for token
    const token = loginRes.access_token || loginRes.token

    if (token) {
        setAuthToken(token)
        revalidateTag("customer")
        loggedIn = true
        console.log("LOGIN DEBUG: Success. Redirecting...")
    } else {
        console.error("LOGIN DEBUG: Full Response:", JSON.stringify(loginRes))
        throw new Error("Authentication failed: No token received in response")
    }
  } catch (error: any) {
    console.error("LOGIN DEBUG ERROR:", error.toString())
    // Allow redirect to throw
    if (error.message && (error.message.includes("NEXT_REDIRECT") || error.digest?.includes("NEXT_REDIRECT"))) {
        throw error
    }
    return error.message || error.toString()
  }

  if (loggedIn) {
    redirect("/account")
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()
  removeAuthToken()
  revalidateTag("auth")
  revalidateTag("customer")
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
  const address = {
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
  }

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