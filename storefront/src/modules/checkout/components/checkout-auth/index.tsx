"use client"

import { useState } from "react"
import { login, signup } from "@lib/data/customer"
import { Button, Heading, Text, Input, Label } from "@medusajs/ui"
import { useParams } from "next/navigation"
import Spinner from "@modules/common/icons/spinner"

const CheckoutAuth = () => {
  const [mode, setMode] = useState<"sign-in" | "register">("register") // Default to register for new users
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
        await login(countryCode as string, formData)
      } else {
        await signup(countryCode as string, formData)
      }
      // The server actions usually redirect on success. 
      // If not, we reload to refresh the 'customer' prop in the parent.
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Authentication failed")
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white w-full">
      <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
        <button
          onClick={() => setMode("register")}
          className={`text-lg font-bold pb-1 ${mode === "register" ? "text-black" : "text-gray-400"}`}
        >
          New Customer
        </button>
        <div className="h-6 w-[1px] bg-gray-200"></div>
        <button
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
        
        {/* Hidden Phone field if register requires it (optional in some starters) */}
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