import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { revalidateTag } from "next/cache" // <--- Import this

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const countryCode = "us" 

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  
  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    const res = await fetch(`${backendUrl}/auth/customer/google/callback?code=${code}&state=${state}`, {
      method: "GET", 
      headers: {
        "Content-Type": "application/json",
        "Cookie": allCookies
      },
    })
    
    if (!res.ok) {
        throw new Error(`Backend failed: ${res.statusText}`)
    }

    const data = await res.json()
    
    if (data.token) {
       cookies().set("_medusa_jwt", data.token, {
          maxAge: 60 * 60 * 24 * 7, 
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
       })
       
       // --- CRITICAL FIX: Purge Cache ---
       revalidateTag("customer")
       revalidateTag("order")
       revalidateTag("cart")
       // ---------------------------------
       
       return NextResponse.redirect(new URL(`/${countryCode}/account`, request.url))
    }
    
    return NextResponse.redirect(new URL("/?login_error=auth_failed", request.url))

  } catch (err) {
     console.error("Google Auth Error:", err)
     return NextResponse.redirect(new URL("/?login_error=system_error", request.url))
  }
}