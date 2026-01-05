import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const countryCode = "us" 

  if (!code) return NextResponse.redirect(new URL("/", request.url))

  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  try {
    // 1. Exchange Code
    const res = await fetch(`${backendUrl}/auth/customer/google/callback?code=${code}&state=${state}`, {
      method: "GET", 
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    })

    if (!res.ok) {
        console.error("Backend Auth Failed:", await res.text())
        return NextResponse.redirect(new URL("/?login_error=backend_fail", request.url))
    }

    const data = await res.json()
    const token = data.token

    if (token) {
        // 2. Decode Token
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        
        // 3. GHOST CHECK: If no actor_id, call Onboarding
        if (!payload.actor_id) {
            console.log("⚠️ Ghost Token. Calling Onboarding API...")
            
            const onboardRes = await fetch(`${backendUrl}/store/auth/google/onboarding`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "x-publishable-api-key": publishableKey
                }
            })

            if (onboardRes.ok) {
                const onboardData = await onboardRes.json()
                
                // If Success or Deleted -> We must restart login to get a fresh token
                if (onboardData.status === "success" || onboardData.status === "deleted") {
                    console.log(`✅ Onboarding ${onboardData.status}. Restarting auth...`)
                    
                    const authUrlRes = await fetch(`${backendUrl}/auth/customer/google`, {
                        headers: { "x-publishable-api-key": publishableKey }
                    })
                    const authData = await authUrlRes.json()
                    if (authData.location) return NextResponse.redirect(authData.location)
                }
            }
            
            console.error("❌ Onboarding failed:", await onboardRes.text())
            return NextResponse.redirect(new URL("/?login_error=onboarding_failed", request.url))
        }

        // 4. VALID TOKEN -> Log In
        const response = NextResponse.redirect(new URL(`/${countryCode}/account`, request.url))
        response.cookies.set("_medusa_jwt", token, {
            maxAge: 60 * 60 * 24 * 7, 
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production", 
        })
        
        revalidateTag("customer")
        return response
    }
    
    return NextResponse.redirect(new URL("/?login_error=no_token", request.url))

  } catch (err) {
     console.error("Google Auth Error:", err)
     return NextResponse.redirect(new URL("/?login_error=system_error", request.url))
  }
}