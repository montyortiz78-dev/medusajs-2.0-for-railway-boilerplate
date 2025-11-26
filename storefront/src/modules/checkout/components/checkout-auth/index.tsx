"use client"

import { useState } from "react"
// CHANGED: Import from the new actions file
import { loginAction, signupAction } from "../../../../../app/actions" 
import { Button, Heading, Text, Input, Label } from "@medusajs/ui"
import { useParams } from "next/navigation"
import Spinner from "@modules/common/icons/spinner"

const CheckoutAuth = () => {
  const [mode, setMode] = useState<"sign-in" | "register">("register")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { countryCode } = useParams()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    try {
      if (mode === "sign-in") {
        await loginAction(countryCode as string, formData)
      } else {
        await signupAction(countryCode as string, formData)
      }
      // Reload to update the checkout page state
      window.location.reload()
    } catch (err: any) {
      // Ignore redirect errors (Next.js redirect throws an error that we shouldn't catch)
      if (err.message === "NEXT_REDIRECT") {
        window.location.reload();
        return;
      }
      setError(err.message || "Authentication failed")
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white w-full">
      <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
        <button
          type="button" // Add type button to prevent form submit
          onClick={() => setMode("register")}
          className={`text-lg font-bold pb-1 ${mode === "register" ? "text-black" : "text-gray-400"}`}
        >
          New Customer
        </button>
        <div className="h-6 w-[1px] bg-gray-200"></div>
        <button
          type="button" // Add type button
          onClick={() => setMode("sign-in")}
          className={`text-lg font-bold pb-1 ${mode === "sign-in" ? "text-black" : "text-gray-400"}`}
        >
          Sign In
        </button>
      </div>

      <div className="mb-6">
        <Heading level="h2" className="text-xl mb-2">
          {mode === "register" ? "Create Account & Stash" : "Welcome Back"}
        </Heading>
        <Text className="text-ui-fg-subtle">
          {mode === "register" 
            ? "Create an account to save your Phygital Kandi to your Stash." 
            : "Sign in to access your saved addresses and stash."}
        </Text>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "register" && (
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <Label size="small">First Name</Label>
                    <Input name="first_name" required placeholder="Monty" />
                </div>
                <div className="flex flex-col gap-2">
                    <Label size="small">Last Name</Label>
                    <Input name="last_name" required placeholder="Ortiz" />
                </div>
            </div>
        )}

        <div className="flex flex-col gap-2">
            <Label size="small">Email</Label>
            <Input name="email" type="email" required placeholder="monty@example.com" />
        </div>

        <div className="flex flex-col gap-2">
            <Label size="small">Password</Label>
            <Input name="password" type="password" required />
        </div>
        
        {/* Hidden Phone field required by some Medusa setups */}
        {mode === "register" && (
             <Input name="phone" type="hidden" value="" />
        )}

        {error && (
            <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
                {error}
            </div>
        )}

        <Button 
            className="w-full mt-2" 
            size="large" 
            type="submit" 
            disabled={isLoading}
        >
            {isLoading ? <Spinner /> : (mode === "register" ? "Create Account & Continue" : "Sign In & Continue")}
        </Button>
      </form>
    </div>
  )
}

export default CheckoutAuth