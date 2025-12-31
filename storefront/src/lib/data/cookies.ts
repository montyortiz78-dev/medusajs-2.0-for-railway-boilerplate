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

    if (token) {
      return { authorization: `Bearer ${token}` }
    }
  } catch (error) {
    return {}
  }

  return {}
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