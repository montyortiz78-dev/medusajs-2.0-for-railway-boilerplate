"use client"

import { useFormState } from "react-dom"
import { useParams } from "next/navigation"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { login } from "@lib/data/customer"
import { useState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(login, null)
  const { countryCode } = useParams()
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // ✅ FIX: Fetch the Google URL from the backend, THEN redirect
  const handleGoogleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsGoogleLoading(true)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:8000"
      const storeUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const callbackUrl = `${storeUrl}/api/auth/google/callback`
      
      const googleAuthUrl = `${backendUrl}/auth/customer/google?callback_url=${encodeURIComponent(callbackUrl)}`
      
      console.log("Fetching Google Auth URL:", googleAuthUrl)

      // 1. Call the backend API
      const res = await fetch(googleAuthUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        throw new Error(`Server Error: ${res.status}`)
      }

      const data = await res.json()

      // 2. Redirect to the location provided by the backend
      if (data.location) {
        window.location.href = data.location
      } else {
        throw new Error("No location returned from backend")
      }
      
    } catch (err: any) {
      console.error("Google Auth Error:", err)
      alert("Something went wrong initializing Google Login.")
      setIsGoogleLoading(false)
    }
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Welcome back</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Sign in to access an enhanced shopping experience.
      </p>
      <form className="w-full" action={formAction}>
        <input type="hidden" name="country_code" value={countryCode || "us"} />
        
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <div className="flex flex-col w-full gap-y-2 relative">
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              data-testid="password-input"
            />
            <button
              onClick={() => setCurrentView(LOGIN_VIEW.FORGOT_PASSWORD)}
              className="text-small-regular text-ui-fg-base underline absolute right-0 -bottom-6"
              type="button"
              data-testid="forgot-password-button"
            >
              Forgot password?
            </button>
          </div>
        </div>
        
        <ErrorMessage error={message} data-testid="login-error-message" />
        
        <SubmitButton data-testid="sign-in-button" className="w-full mt-10"> 
          Sign in
        </SubmitButton>
      </form>

      {/* --- GOOGLE BUTTON --- */}
      <div className="w-full mt-6 flex flex-col gap-y-3">
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full inline-flex justify-center items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="google-button"
          type="button" 
        >
          {isGoogleLoading ? (
             <span className="h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M12.0003 20.45C16.6503 20.45 20.5503 17.3 22.1503 13.2H12.0003V10.8H23.6503C23.8503 11.8 24.0003 12.9 24.0003 14.1C24.0003 20.75 18.6003 26.15 12.0003 26.15C5.3503 26.15 0.000299454 20.75 0.000299454 14.1C0.000299454 7.45 5.3503 2.05 12.0003 2.05C14.8003 2.05 17.3503 2.95 19.3503 4.8L17.5003 6.65C16.2003 5.4 14.2003 4.6 12.0003 4.6C7.3003 4.6 3.4003 7.95 2.0003 12.2H12.0003V20.45Z"
                fill="currentColor"
              />
            </svg>
          )}
          Google
        </button>
      </div>

      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Not a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          Join us
        </button>
        .
      </span>
    </div>
  )
}

export default Login