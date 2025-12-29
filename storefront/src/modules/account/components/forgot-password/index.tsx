"use client"

import { useState } from "react"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
// Make sure resetPassword is imported from the updated customer file
import { resetPassword } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const ForgotPassword = ({ setCurrentView }: Props) => {
  const [message, setMessage] = useState<string | null>(null)
  
  const handleSubmit = async (formData: FormData) => {
     const error = await resetPassword(null, formData)
     if (error) {
       setMessage(error)
     } else {
       // On success, flip back to sign in
       setCurrentView(LOGIN_VIEW.SIGN_IN)
     }
  }

  return (
    <div className="max-w-sm flex flex-col items-center" data-testid="forgot-password-page">
      <h1 className="text-large-semi uppercase mb-6">Reset Password</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      <form className="w-full" action={handleSubmit}>
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
        </div>
        <ErrorMessage error={message} data-testid="forgot-password-error-message" />
        <SubmitButton data-testid="send-reset-link-button" className="w-full mt-6">
          Send Reset Link
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Remember your password?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
          type="button"
        >
          Sign in
        </button>
      </span>
    </div>
  )
}

export default ForgotPassword