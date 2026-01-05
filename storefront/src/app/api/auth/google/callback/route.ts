import { NextRequest, NextResponse } from "next/server"

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
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!res.ok) {
      console.error("Backend auth exchange failed:", await res.text())
      return NextResponse.redirect(new URL("/?login_error=backend_fail", request.url))
    }

    const data = await res.json()
    const token = data.token

    if (token) {
      // 2. Decode Token to check for actor_id
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      
      // 3. If actor_id is missing, the Backend Subscriber is probably still running.
      // We redirect back to Google to "refresh" the token.
      if (!payload.actor_id) {
        console.log("⚠️ No actor_id yet (Subscriber working). Refreshing token...")
        return NextResponse.redirect(`${backendUrl}/auth/customer/google`)
      }

      // 4. Success: Set Cookie and Redirect
      const response = NextResponse.redirect(new URL(`/${countryCode}/account`, request.url))
      
      response.cookies.set("_medusa_jwt", token, {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
      
      return response
    }

    return NextResponse.redirect(new URL("/?login_error=no_token", request.url))
  } catch (err) {
    console.error("Google Auth Error:", err)
    return NextResponse.redirect(new URL("/?login_error=system_error", request.url))
  }
}