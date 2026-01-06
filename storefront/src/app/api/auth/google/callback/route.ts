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
    
    // 2. Exchange the Code for a Token (Call Backend Manually)
    // We forward the code & state to the backend's callback URL.
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

    // 3. Success! Set Cookie and Redirect
    const nextResponse = NextResponse.redirect(`${request.nextUrl.origin}/account`)
    
    // Set the JWT cookie (Standard Medusa Name: _medusa_jwt)
    // This allows the server-side Next.js components to see you are logged in.
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