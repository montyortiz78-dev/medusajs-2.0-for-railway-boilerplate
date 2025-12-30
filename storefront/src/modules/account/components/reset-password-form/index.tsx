"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Input from "@modules/common/components/input"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import ErrorMessage from "@modules/checkout/components/error-message"
import { updatePassword } from "@lib/data/customer"

type Props = {
  token: string
  email: string
}

const ResetPasswordForm = ({ token, email }: Props) => {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirm_password") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    formData.append("token", token)
    formData.append("email", email)

    const res = await updatePassword(null, formData)

    if (res) {
      setError(res)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push("/account")
      }, 3000)
    }
  }

  if (success) {
    return (
      <div className="max-w-sm w-full flex flex-col items-center">
        <h1 className="text-large-semi uppercase mb-6">Success!</h1>
        <p className="text-center text-base-regular text-ui-fg-base">
          Your password has been updated. Redirecting you to login...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-sm w-full flex flex-col items-center">
      <h1 className="text-large-semi uppercase mb-6">Reset Password</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Please enter your new password below.
      </p>
      <form className="w-full" action={handleSubmit}>
        <div className="flex flex-col w-full gap-y-4">
          <Input
            label="New Password"
            name="password"
            type="password"
            required
          />
          <Input
            label="Confirm Password"
            name="confirm_password"
            type="password"
            required
          />
        </div>
        
        <ErrorMessage error={error} />
        
        <SubmitButton className="w-full mt-6">Reset Password</SubmitButton>
      </form>
    </div>
  )
}

export default ResetPasswordForm