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
       // --- FIX START: Decode token to check for missing actor_id ---
       let needsRepair = false

       const decodeToken = (t: string) => {
         try {
           return JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString())
         } catch { return {} }
       }

       let payload = decodeToken(token)

       try {
         const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
         // If actor_id is empty string or undefined, we have a Ghost Token
         if (!payload.actor_id) {
            console.log("⚠️ Ghost Token detected. Waiting for Subscriber to create customer...")
            for (let i = 0; i < 3; i++) {
             await new Promise(resolve => setTimeout(resolve, 1500)) // Wait 1.5s
             // Check if customer exists now via API (using the same token)
             const checkRes = await fetch(`${backendUrl}/store/customers/me`, {
                headers: { 
                   Authorization: `Bearer ${token}`,
                   "x-publishable-api-key": publishableKey
                },
                cache: "no-store"
             })
             if (checkRes.ok) {
                console.log("✅ Customer found after wait! Redirecting to refresh token...")
                // Customer created! We just need a new token with the ID in it.
                const authUrlRes = await fetch(`${backendUrl}/auth/customer/google`, {
                    headers: { "x-publishable-api-key": publishableKey }
                })
                const authData = await authUrlRes.json()
                if (authData.location) return NextResponse.redirect(authData.location)
             }
          }
            // If still no customer after waiting, THEN trigger repair
          console.log("❌ Wait failed. Marking for repair...")
          needsRepair = true
       }
       } catch (e) {
         console.error("Token decode failed", e)
       }

       // 2. Secondary Check: Call API if we aren't sure yet
       if (!needsRepair) {
           const customerCheck = await fetch(`${backendUrl}/store/customers/me`, {
             headers: { 
                Authorization: `Bearer ${token}`,
                "x-publishable-api-key": publishableKey
             },
             cache: "no-store"
           })
           // 404 = Zombie (Deleted User), 401 = Ghost (Empty ID)
           if (customerCheck.status === 404 || customerCheck.status === 401) {
               needsRepair = true
           }
       }

       // 3. EXECUTE REPAIR if needed
       if (needsRepair) {
          console.log("🛠️ Initiating Self-Healing Protocol...")
          
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

             // Handle "Identity Deleted" (Re-Auth Required)
             if (repairData.action === "reauth") {
                 console.log("🔄 Identity deleted. Redirecting to Google for fresh signup...")
                 const authUrlRes = await fetch(`${backendUrl}/auth/customer/google`, {
                    headers: { "x-publishable-api-key": publishableKey }
                 })
                 const authData = await authUrlRes.json()
                 if (authData.location) return NextResponse.redirect(authData.location)
             }

             console.log("✅ Repair successful. Refreshing token via re-login...")
             const googleAuthRes = await fetch(`${backendUrl}/auth/customer/google`, {
                 headers: { "x-publishable-api-key": publishableKey }
             })
             
             if (googleAuthRes.ok) {
                 const googleData = await googleAuthRes.json()
                 if (googleData.location) return NextResponse.redirect(googleData.location)
             }
             
             return NextResponse.redirect(new URL("/?login_error=system_error", request.url))
          } else {
             console.error("❌ Repair failed:", await repairRes.text())
             // Don't let them proceed with a bad token
             return NextResponse.redirect(new URL("/?login_error=repair_failed", request.url))
          }
       }
       // --- FIX END ---

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