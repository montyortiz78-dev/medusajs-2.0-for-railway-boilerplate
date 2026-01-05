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
             console.log("✅ Repair successful. Refreshing token...")
             // Redirect back to Google to get a FRESH token with the new ID
             return NextResponse.redirect(`${backendUrl}/auth/customer/google`)
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
       
       return response
    }
    
    return NextResponse.redirect(new URL("/?login_error=auth_failed", request.url))

  } catch (err) {
     console.error("Google Auth Error:", err)
     return NextResponse.redirect(new URL("/?login_error=system_error", request.url))
  }
}