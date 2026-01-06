import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // 1. Handle Google Errors
  if (error) {
    console.error("Google Auth Error:", error)
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=no_code`)
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    
    // 2. Exchange the Code for a Token
    const response = await fetch(`${backendUrl}/auth/customer/google/callback?code=${code}&state=${state}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("Backend Verification Failed:", errText)
      return NextResponse.redirect(`${request.nextUrl.origin}/login?error=backend_verification_failed`)
    }

    const data = await response.json()
    const token = data.token

    if (!token) {
        console.error("No token returned from backend:", data)
        return NextResponse.redirect(`${request.nextUrl.origin}/login?error=no_token`)
    }

    // -------------------------------------------------------------------
    // 3. 🚨 CRITICAL STEP: Run Onboarding (Create/Link Customer)
    // -------------------------------------------------------------------
    console.log("Token received. Running Onboarding for:", token.substring(0, 10) + "...")
    
    const onboardingRes = await fetch(`${backendUrl}/store/auth/google/onboarding`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`, // Pass the Ghost Token
            "Content-Type": "application/json"
        }
    })

    if (!onboardingRes.ok) {
        // If onboarding fails, logging the error is crucial
        const errJson = await onboardingRes.json()
        console.error("❌ Onboarding Failed:", JSON.stringify(errJson))
        
        // Optional: Redirect to login with error, or proceed and hope for the best
        // return NextResponse.redirect(`${request.nextUrl.origin}/login?error=onboarding_failed`)
    } else {
        console.log("✅ Onboarding Successful. Customer Created/Linked.")
    }
    // -------------------------------------------------------------------

    // 4. Success! Set Cookie and Redirect
    const nextResponse = NextResponse.redirect(`${request.nextUrl.origin}/account`)
    
    nextResponse.cookies.set("_medusa_jwt", token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return nextResponse

  } catch (err) {
    console.error("Callback Route Error:", err)
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=internal_error`)
  }
}