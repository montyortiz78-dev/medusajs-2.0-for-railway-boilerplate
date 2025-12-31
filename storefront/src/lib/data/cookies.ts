import { cookies } from "next/headers"

export const getAuthToken = () => {
  try {
    return cookies().get("_medusa_jwt")?.value
  } catch (error) {
    return null
  }
}

export const getCartId = () => {
  try {
    return cookies().get("_medusa_cart_id")?.value
  } catch (error) {
    return null
  }
}

export const setCartId = (cartId: string) => {
  try {
    cookies().set("_medusa_cart_id", cartId, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  } catch (error) {
    // Ignore during build
  }
}

export const removeCartId = () => {
  try {
    cookies().delete("_medusa_cart_id")
  } catch (error) {
    // Ignore during build
  }
}

export const setAuthToken = (token: string) => {
  try {
    cookies().set("_medusa_jwt", token, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  } catch (error) {
    // Ignore during build
  }
}

export const removeAuthToken = () => {
  try {
    cookies().delete("_medusa_jwt")
  } catch (error) {
    // Ignore during build
  }
}

export const getAuthHeaders = () => {
  try {
    const token = cookies().get("_medusa_jwt")?.value
    const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

    const headers: Record<string, string> = {}

    if (token) {
      headers["authorization"] = `Bearer ${token}`
    }

    // FIX: Only add header if key exists and is not empty
    if (pubKey) {
       headers["x-publishable-api-key"] = pubKey
    } else {
       // Log this specifically so it shows up in Vercel Function Logs
       console.error("CRITICAL: NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is undefined in Vercel Environment!")
    }
    
    return headers
  } catch (error) {
    return {}
  }
}

export const getMedusaHeaders = (tags: string[] = []) => {
  const headers = {
    ...getAuthHeaders(),
  } as Record<string, string>

  if (tags.length > 0) {
    headers["next-cache-tags"] = tags.join(",")
  }

  return headers
}