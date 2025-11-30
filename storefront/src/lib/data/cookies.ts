import { cookies } from "next/headers"

export const getAuthToken = () => {
  return cookies().get("_medusa_jwt")?.value
}

export const getCartId = () => {
  return cookies().get("_medusa_cart_id")?.value
}

export const setCartId = (cartId: string) => {
  cookies().set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = () => {
  cookies().delete("_medusa_cart_id")
}

export const setAuthToken = (token: string) => {
  cookies().set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = () => {
  cookies().delete("_medusa_jwt")
}

export const getAuthHeaders = () => {
  const token = getAuthToken()

  if (token) {
    return { authorization: `Bearer ${token}` }
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