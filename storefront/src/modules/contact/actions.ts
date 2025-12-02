"use server"

import { z } from "zod"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const ContactSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

export async function sendMessage(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  
  const validatedFields = ContactSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please check your entries and try again.",
    }
  }

  const { first_name, last_name, email, subject, message } = validatedFields.data

  try {
    // Send email using Resend directly or via your notification module if extended
    // For simplicity and direct integration with your Resend setup:
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
         throw new Error("Resend configuration missing")
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.RESEND_FROM_EMAIL, // Send to support
      reply_to: email,
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <h2>New Message from ${first_name} ${last_name}</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <br/>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    })

    return {
      success: true,
      message: "Thank you! Your message has been sent successfully.",
    }
  } catch (error) {
    console.error("Contact form error:", error)
    return {
      success: false,
      message: "Something went wrong. Please try again later.",
    }
  }
}