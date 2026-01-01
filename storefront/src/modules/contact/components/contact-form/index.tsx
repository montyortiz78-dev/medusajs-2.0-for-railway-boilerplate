"use client"

import { useFormState, useFormStatus } from "react-dom"
import { sendMessage } from "../../actions"
import { Button, Input, Label, Text, Textarea, clx } from "@medusajs/ui"
import { useEffect, useRef, useState, useCallback } from "react"
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3"

const initialState = {
  success: false,
  message: "",
  errors: {},
}

function SubmitButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="w-full bg-pink-600 hover:bg-pink-700 text-white"
      isLoading={pending}
      disabled={pending}
      onClick={onClick} // Trigger captcha on click
    >
      Send Message
    </Button>
  )
}

// Internal Form Component to use the Hook
function ContactFormContent() {
  const [state, formAction] = useFormState(sendMessage, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [captchaToken, setCaptchaToken] = useState<string>("")

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset()
      setCaptchaToken("") 
    }
  }, [state.success])

  // Generate token when user attempts to submit
  const handleReCaptchaVerify = useCallback(async () => {
    if (!executeRecaptcha) {
      console.log('Execute recaptcha not yet available');
      return;
    }

    const token = await executeRecaptcha('contact_form_submit');
    setCaptchaToken(token);
  }, [executeRecaptcha]);

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
        {/* Hidden Input passes the token to the server action */}
        <input type="hidden" name="captchaToken" value={captchaToken} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="first_name" className="text-ui-fg-base">First Name</Label>
            <Input name="first_name" id="first_name" placeholder="John" required autoComplete="given-name" />
            {state.errors?.first_name && <Text className="text-red-500 text-small-regular">{state.errors.first_name[0]}</Text>}
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="last_name" className="text-ui-fg-base">Last Name</Label>
            <Input name="last_name" id="last_name" placeholder="Doe" required autoComplete="family-name" />
            {state.errors?.last_name && <Text className="text-red-500 text-small-regular">{state.errors.last_name[0]}</Text>}
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="email" className="text-ui-fg-base">Email</Label>
          <Input name="email" id="email" type="email" placeholder="john@example.com" required autoComplete="email" />
          {state.errors?.email && <Text className="text-red-500 text-small-regular">{state.errors.email[0]}</Text>}
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="subject" className="text-ui-fg-base">Subject</Label>
          <Input name="subject" id="subject" placeholder="How can we help?" required />
          {state.errors?.subject && <Text className="text-red-500 text-small-regular">{state.errors.subject[0]}</Text>}
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="message" className="text-ui-fg-base">Message</Label>
          <Textarea name="message" id="message" placeholder="Tell us more..." rows={5} required />
          {state.errors?.message && <Text className="text-red-500 text-small-regular">{state.errors.message[0]}</Text>}
        </div>

        <SubmitButton onClick={handleReCaptchaVerify} />
        
        <p className="text-xs text-gray-400 mt-2">
            This site is protected by reCAPTCHA and the Google
            <a href="https://policies.google.com/privacy" className="text-blue-500 hover:underline mx-1">Privacy Policy</a> and
            <a href="https://policies.google.com/terms" className="text-blue-500 hover:underline mx-1">Terms of Service</a> apply.
        </p>
      </form>
    </div>
  )
}

// Wrapper to Provide Context
export default function ContactForm() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
      scriptProps={{
        async: false,
        defer: false,
        appendTo: "head",
        nonce: undefined,
      }}
    >
      <ContactFormContent />
    </GoogleReCaptchaProvider>
  )
}