import { Text, Heading, Link, Section, Container } from "@react-email/components"
import { Base } from "./base"

export const FORGOT_PASSWORD = "forgot-password"

export interface ForgotPasswordTemplateData {
  username: string
  resetLink: string
  emailOptions?: {
    subject?: string
  }
}

export const ForgotPasswordTemplate = ({ 
  username, 
  resetLink,
}: ForgotPasswordTemplateData) => {
  return (
    <Base>
      <Container>
        <Section className="mb-4">
          <Heading className="text-2xl font-bold text-gray-900">Reset Password</Heading>
          <Text className="text-gray-600 mb-4">Hi {username},</Text>
          <Text className="text-gray-600 mb-6">
            Someone requested a password change. Click below to reset it:
          </Text>
          <Section className="text-center my-8">
            <Link 
              href={resetLink} 
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md no-underline inline-block"
            >
              Reset Password
            </Link>
          </Section>
        </Section>
      </Container>
    </Base>
  )
}

export const isForgotPasswordData = (data: any): data is ForgotPasswordTemplateData => {
  return typeof data.resetLink === "string" && typeof data.username === "string"
}