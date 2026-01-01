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
  captchaToken: z.string().optional(), // Token from frontend
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

  const { first_name, last_name, email, subject, message, captchaToken } = validatedFields.data

  // --- RECAPTCHA VERIFICATION ---
  if (process.env.RECAPTCHA_SECRET_KEY && captchaToken) {
    try {
      const verifyRes = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
        { method: "POST" }
      )
      const verifyData = await verifyRes.json()
      
      if (!verifyData.success) {
        return {
          success: false,
          message: "reCAPTCHA verification failed. Please try again.",
        }
      }
    } catch (e) {
      console.error("ReCAPTCHA Error:", e)
      return { success: false, message: "Security check failed." }
    }
  }
  // ------------------------------

  try {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
         throw new Error("Resend configuration missing")
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.RESEND_FROM_EMAIL, // Emails go to your support inbox
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
            <h2>New Message from ${first_name} ${last_name}</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="white-space: pre-wrap;">${message}</p>
        </div>
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