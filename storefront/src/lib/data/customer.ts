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
  // FIXED: Cast options to 'any' to allow 'next' property which isn't in standard ClientHeaders type
  return await sdk.store.customer
    .retrieve({}, { next: { tags: ["customer"] }, ...headers } as any)
    .then(({ customer }) => customer)
    .catch(() => null)
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

    // FIXED: Cast to 'any' to robustly handle token extraction (access_token vs location)
    const loginRes = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    }) as any

    const authToken = loginRes.access_token || loginRes.location || (typeof loginRes === 'string' ? loginRes : '')

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
  const email = (formData.get("email") as string).toLowerCase().trim(); // Add trim()
  const password = formData.get("password") as string;

  console.log("Attempting login for:", email); // Add logging

  try {
    const loginRes = await sdk.auth.login("customer", "emailpass", { 
        email, 
        password 
    }) as any;

    const token = loginRes.access_token || loginRes.location || (typeof loginRes === 'string' ? loginRes : null)

    if (token) {
        setAuthToken(token)
        revalidateTag("customer")
    } else {
        throw new Error("Authentication failed: No token received")
    }
  } catch (error: any) {
    return error.toString()
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
    // Ensure the backend route matches exactly '/store/reset-password'
    await sdk.client.fetch("/store/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: { email }, // SDK stringifies this automatically
    })
    return null // Return null on success so the UI can update
  } catch (error: any) {
    console.error("Reset Password Error:", error)
    // Return a friendly error message
    return "Something went wrong. Please try again."
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

    if (!res.success) {
      return res.message || "Failed to reset password"
    }
    
    return null
  } catch (error: any) {
    return error.message || error.toString()
  }
}

export const addCustomerAddress = async (
  _currentState: unknown,
  formData: FormData
): Promise<any> => {
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

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(({ customer }) => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = getAuthHeaders() as { authorization: string }
  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(() => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const headers = getAuthHeaders() as { authorization: string }
  const addressId = currentState.addressId as string

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

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(() => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}