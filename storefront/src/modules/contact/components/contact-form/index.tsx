"use client"

import { useFormState, useFormStatus } from "react-dom"
import { sendMessage } from "../../actions"
import { Button, Input, Label, Text, Textarea, clx } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import ReCAPTCHA from "react-google-recaptcha" // <--- Import

const initialState = {
  success: false,
  message: "",
  errors: {},
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="w-full bg-pink-600 hover:bg-pink-700 text-white"
      isLoading={pending}
      disabled={pending || disabled}
    >
      Send Message
    </Button>
  )
}

export default function ContactForm() {
  const [state, formAction] = useFormState(sendMessage, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset()
      setCaptchaToken(null)
      recaptchaRef.current?.reset() // Reset captcha on success
    }
  }, [state.success])

  const onCaptchaChange = (token: string | null) => {
    setCaptchaToken(token)
  }

  return (
    <div className="flex flex-col gap-y-4">
      {state.message && (
        <div
          className={clx(
            "p-4 rounded-md text-small-regular",
            state.success
              ? "bg-green-100 text-green-900 border border-green-200"
              : "bg-red-100 text-red-900 border border-red-200"
          )}
        >
          {state.message}
        </div>
      )}

      <form ref={formRef} action={formAction} className="flex flex-col gap-y-4">
        {/* --- Hidden Input for Captcha Token --- */}
        <input type="hidden" name="captchaToken" value={captchaToken || ""} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="first_name" className="text-ui-fg-base">
              First Name
            </Label>
            <Input
              name="first_name"
              id="first_name"
              placeholder="John"
              required
              autoComplete="given-name"
            />
            {state.errors?.first_name && (
                <Text className="text-red-500 text-small-regular">{state.errors.first_name[0]}</Text>
            )}
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="last_name" className="text-ui-fg-base">
              Last Name
            </Label>
            <Input
              name="last_name"
              id="last_name"
              placeholder="Doe"
              required
              autoComplete="family-name"
            />
            {state.errors?.last_name && (
                <Text className="text-red-500 text-small-regular">{state.errors.last_name[0]}</Text>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="email" className="text-ui-fg-base">
            Email
          </Label>
          <Input
            name="email"
            id="email"
            type="email"
            placeholder="john@example.com"
            required
            autoComplete="email"
          />
          {state.errors?.email && (
            <Text className="text-red-500 text-small-regular">{state.errors.email[0]}</Text>
          )}
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="subject" className="text-ui-fg-base">
            Subject
          </Label>
          <Input
            name="subject"
            id="subject"
            placeholder="How can we help?"
            required
          />
          {state.errors?.subject && (
            <Text className="text-red-500 text-small-regular">{state.errors.subject[0]}</Text>
          )}
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="message" className="text-ui-fg-base">
            Message
          </Label>
          <Textarea
            name="message"
            id="message"
            placeholder="Tell us more about your inquiry..."
            rows={5}
            required
          />
          {state.errors?.message && (
            <Text className="text-red-500 text-small-regular">{state.errors.message[0]}</Text>
          )}
        </div>

        {/* --- RECAPTCHA WIDGET --- */}
        <div className="flex justify-center md:justify-start">
            <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                onChange={onCaptchaChange}
                theme="light" // or "dark" based on context, but automatic detection is tricky in simple setup
            />
        </div>

        <SubmitButton disabled={!captchaToken} />
      </form>
    </div>
  )
}