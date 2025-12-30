import { Metadata } from "next"
import ResetPasswordForm from "@modules/account/components/reset-password-form"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your password.",
}

type Props = {
  searchParams: {
    token?: string
    email?: string
  }
}

export default function ResetPasswordPage({ searchParams }: Props) {
  const { token, email } = searchParams

  if (!token || !email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <h1 className="text-2xl-semi mb-4">Invalid Link</h1>
        <p className="text-base-regular text-ui-fg-subtle">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
      </div>
    )
  }

  return (
    <div className="flex justify-center py-24 px-4">
      <ResetPasswordForm token={token} email={email} />
    </div>
  )
}