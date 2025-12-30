import { NextRequest, NextResponse } from "next/server"

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isOnboarding = request.cookies.get("_medusa_onboarding")?.value === "true"
  const cartId = request.cookies.get("_medusa_cart_id")?.value
  const cartIdCookie = request.cookies.get("_medusa_cart_id")
  
  // 1. Check for Auth Token (The fix: explicitly check for _medusa_jwt)
  const authToken = request.cookies.get("_medusa_jwt")?.value
  const loggedIn = !!authToken

  // 2. Define Protected Routes
  // Add any other routes that require login here
  const protectedRoutes = ["/account", "/order/confirmed"] 
  const isProtectedRoute = protectedRoutes.some((route) => 
    path.startsWith(route) && !path.includes("/reset-password") && !path.includes("/login")
  )

  // 3. Handle Login/Account Redirects
  // If user is on login page but already logged in, send them to account
  if (path === "/account/login" && loggedIn) {
    return NextResponse.redirect(new URL("/account", request.url))
  }

  // If user is on a protected route but NOT logged in, send them to login
  if (isProtectedRoute && !loggedIn) {
    const loginUrl = new URL("/account/login", request.url)
    // Optional: Add redirect param to send them back after login
    loginUrl.searchParams.set("redirect", path)
    return NextResponse.redirect(loginUrl)
  }

  // 4. Onboarding Logic (Keep existing logic)
  if (isOnboarding) {
    // If we have a cartId cookie but no value, we might want to clean it up or ignore
    // For now, we pass through
  }

  return NextResponse.next()
}