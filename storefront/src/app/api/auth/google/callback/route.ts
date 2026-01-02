import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const countryCode = "us" // You might want to make this dynamic later or pull from cookie

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Point to your Medusa Backend
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  
  try {
    // 1. Pass the code to Medusa Backend to validate and get the Token
    // We forward the query params exactly as received
    const res = await fetch(`${backendUrl}/auth/customer/google/callback?code=${code}&state=${state}`, {
      method: "GET", 
      headers: {
        "Content-Type": "application/json",
      },
    })
    
    if (!res.ok) {
        throw new Error("Failed to validate token with backend")
    }

    const data = await res.json()
    
    if (data.token) {
       // 2. Set the Auth Cookie in the Browser
       cookies().set("_medusa_jwt", data.token, {
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
       })
       
       // 3. Redirect the user to their account
       return NextResponse.redirect(new URL(`/${countryCode}/account`, request.url))
    }
    
    // Handle failure
    return NextResponse.redirect(new URL("/?login_error=auth_failed", request.url))

  } catch (err) {
     console.error("Google Auth Error:", err)
     return NextResponse.redirect(new URL("/?login_error=system_error", request.url))
  }
}