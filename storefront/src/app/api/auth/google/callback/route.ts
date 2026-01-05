import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

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
    // 1. Exchange Code for Token
    const res = await fetch(`${backendUrl}/auth/customer/google/callback?code=${code}&state=${state}`, {
      method: "GET", 
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store"
    })
    
    if (!res.ok) {
        throw new Error(`Backend failed: ${res.statusText}`)
    }

    const data = await res.json()
    
    if (data.token) {
       // --- FIX STARTS HERE ---
       
       // 1. Create the redirect response object first
       const response = NextResponse.redirect(new URL(`/${countryCode}/account`, request.url))
       
       // 2. Set the cookie ON the response object
       // This guarantees the 'Set-Cookie' header is sent to the browser
       response.cookies.set("_medusa_jwt", data.token, {
          maxAge: 60 * 60 * 24 * 7, 
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production", // Safer than hardcoding true
       })
       
       // 3. Revalidate cache
       revalidateTag("customer")
       revalidateTag("order")
       revalidateTag("cart")
       
       return response
       // --- FIX ENDS HERE ---
    }
    
    return NextResponse.redirect(new URL("/?login_error=auth_failed", request.url))

  } catch (err) {
     console.error("Google Auth Error:", err)
     return NextResponse.redirect(new URL("/?login_error=system_error", request.url))
  }
}