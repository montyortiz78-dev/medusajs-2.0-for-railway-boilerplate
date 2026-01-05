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
    // 1. Exchange Code for Token
    const res = await fetch(`${backendUrl}/auth/customer/google/callback?code=${code}&state=${state}`, {
      method: "GET", 
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    })

    if (!res.ok) throw new Error(`Backend failed: ${res.statusText}`)

    const data = await res.json()
    const token = data.token

    if (token) {
        // 2. Decode Token
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        
        // 3. Handle Ghost Token (New User)
        if (!payload.actor_id) {
            console.log("⚠️ Ghost Token. Calling Onboarding...")
            
            const onboardRes = await fetch(`${backendUrl}/store/auth/google/onboarding`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "x-publishable-api-key": publishableKey
                }
            })

            if (onboardRes.ok) {
                const onboardData = await onboardRes.json()
                
                // If identity was deleted (corrupt) OR successfully linked -> Re-Auth to get fresh token
                if (onboardData.status === "success" || onboardData.status === "deleted") {
                    console.log(`✅ Onboarding ${onboardData.status}. Refreshing token...`)
                    
                    // Fetch Google URL for restart
                    const authUrlRes = await fetch(`${backendUrl}/auth/customer/google`, {
                        headers: { "x-publishable-api-key": publishableKey }
                    })
                    const authData = await authUrlRes.json()
                    if (authData.location) return NextResponse.redirect(authData.location)
                }
            }
            
            console.error("❌ Onboarding failed or unknown status.")
            return NextResponse.redirect(new URL("/?login_error=onboarding_failed", request.url))
        }

        // 4. Valid Token (Has actor_id) -> Login
        const response = NextResponse.redirect(new URL(`/${countryCode}/account`, request.url))
        response.cookies.set("_medusa_jwt", token, {
            maxAge: 60 * 60 * 24 * 7, 
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production", 
        })
        
        revalidateTag("customer")
        revalidateTag("order")
        return response
    }
    
    return NextResponse.redirect(new URL("/?login_error=auth_failed", request.url))

  } catch (err) {
     console.error("Google Auth Error:", err)
     return NextResponse.redirect(new URL("/?login_error=system_error", request.url))
  }
}