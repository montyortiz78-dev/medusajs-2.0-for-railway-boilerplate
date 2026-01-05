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
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

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
      // Simple base64 decode of the payload (2nd part of JWT)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      
      // 3. If actor_id is missing, we MUST register the customer
      if (!payload.actor_id) {
        console.log("⚠️ No actor_id found. Attempting to register customer...")
        
        // NOTE: Since we don't have the user's email here easily, we use a placeholder or 
        // rely on a backend customization. For now, we attempt to register.
        // In a perfect setup, your backend callback would return the email too.
        const registerRes = await fetch(`${backendUrl}/store/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "x-publishable-api-key": publishableKey
          },
          body: JSON.stringify({
            // Fallback since we can't extract email easily without decoding ID token
            // This is a "best effort" to link the identity. 
            // Ideally, your backend should handle this or return the email.
            email: `google_user_${payload.auth_identity_id}@kandicreations.com`, 
            first_name: "Google",
            last_name: "User"
          }),
        })

        if (!registerRes.ok) {
          console.error("Failed to auto-register:", await registerRes.text())
          // If registration fails, we can't log them in fully.
          return NextResponse.redirect(new URL("/?login_error=registration_failed", request.url))
        }
        
        console.log("✅ Customer auto-registered successfully.")
        // Proceeding will allow the NEXT login to work, or the current session might now work
        // depending on if the backend resolves the customer dynamically.
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