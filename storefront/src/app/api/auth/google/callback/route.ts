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
       // 2. HEALTH CHECK: Verify the customer exists
       const customerCheck = await fetch(`${backendUrl}/store/customers/me`, {
         headers: { 
            Authorization: `Bearer ${token}`,
            "x-publishable-api-key": publishableKey
         },
         cache: "no-store"
       })

       // 3. ZOMBIE CHECK: If 404 (Not Found), the ID in the token is dead. Repair it.
       if (customerCheck.status === 404) {
          console.log("⚠️ Zombie Customer detected. Attempting repair...")
          
          const repairRes = await fetch(`${backendUrl}/store/auth/google/repair`, {
             method: "POST",
             headers: { 
                Authorization: `Bearer ${token}`,
                "x-publishable-api-key": publishableKey
             }
          })

          if (repairRes.ok) {
             const repairData = await repairRes.json()
             console.log("✅ Repair Result:", repairData)

             // --- FIX: Handle "Identity Deleted" (Re-Auth Required) ---
             if (repairData.action === "reauth") {
                 console.log("🔄 Identity deleted. Redirecting to Google for fresh signup...")
                 // We fetch the auth URL to send them back to the start
                 const authUrlRes = await fetch(`${backendUrl}/auth/customer/google`, {
                    headers: { "x-publishable-api-key": publishableKey }
                 })
                 const authData = await authUrlRes.json()
                 if (authData.location) {
                     return NextResponse.redirect(authData.location)
                 }
             }
             // ---------------------------------------------------------

             console.log("✅ Repair successful. Initiating re-login...")
             const googleAuthRes = await fetch(`${backendUrl}/auth/customer/google`, {
                 headers: { "x-publishable-api-key": publishableKey }
             })
             
             if (googleAuthRes.ok) {
                 const googleData = await googleAuthRes.json()
                 if (googleData.location) {
                     return NextResponse.redirect(googleData.location)
                 }
             }
             
             console.error("❌ Failed to get Google Auth URL")
             return NextResponse.redirect(new URL("/?login_error=system_error", request.url))
          } else {
             console.error("❌ Repair failed:", await repairRes.text())
          }
       }

       // 4. Success - Set Cookie
       const response = NextResponse.redirect(new URL(`/${countryCode}/account`, request.url))
       
       response.cookies.set("_medusa_jwt", token, {
          maxAge: 60 * 60 * 24 * 7, 
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production", 
       })
       
       revalidateTag("customer")
       revalidateTag("order")
       revalidateTag("cart")
       
       return response
    }
    
    return NextResponse.redirect(new URL("/?login_error=auth_failed", request.url))

  } catch (err) {
     console.error("Google Auth Error:", err)
     return NextResponse.redirect(new URL("/?login_error=system_error", request.url))
  }
}