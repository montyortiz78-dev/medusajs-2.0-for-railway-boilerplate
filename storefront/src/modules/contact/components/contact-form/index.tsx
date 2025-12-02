"use client"

import { useFormState, useFormStatus } from "react-dom"
import { sendMessage } from "../../actions"
import { Button, Input, Label, Text, Textarea } from "@medusajs/ui"
import { useEffect, useRef } from "react"

const initialState = {
  success: false,
  message: "",
  errors: {},
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="w-full"
      isLoading={pending}
      disabled={pending}
    >
      Send Message
    </Button>
  )
}

export default function ContactForm() {
  const [state, formAction] = useFormState(sendMessage, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset()
    }
  }, [state.success])

  return (
    <div className="flex flex-col gap-y-4">
      {state.message && (
        <div
          className={`p-4 rounded-md text-small-regular ${
            state.success
              ? "bg-green-50 text-green-900 border border-green-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {state.message}
        </div>
      )}

      <form ref={formRef} action={formAction} className="flex flex-col gap-y-4">
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
              <Text className="text-red-500 text-small-regular">
                {state.errors.first_name[0]}
              </Text>
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
              <Text className="text-red-500 text-small-regular">
                {state.errors.last_name[0]}
              </Text>
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
            <Text className="text-red-500 text-small-regular">
              {state.errors.email[0]}
            </Text>
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
            <Text className="text-red-500 text-small-regular">
              {state.errors.subject[0]}
            </Text>
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
            <Text className="text-red-500 text-small-regular">
              {state.errors.message[0]}
            </Text>
          )}
        </div>

        <SubmitButton />
      </form>
    </div>
  )
}