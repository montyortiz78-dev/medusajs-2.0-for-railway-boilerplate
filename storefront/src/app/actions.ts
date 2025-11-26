"use server"

import { login as medusaLogin, signup as medusaSignup } from "@lib/data/customer"

export async function loginAction(countryCode: string, formData: FormData) {
  return await medusaLogin(countryCode, formData)
}

export async function signupAction(countryCode: string, formData: FormData) {
  return await medusaSignup(countryCode, formData)
}