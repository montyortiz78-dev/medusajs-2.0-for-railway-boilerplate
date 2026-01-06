import { Logger, NotificationTypes } from '@medusajs/framework/types'
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/framework/utils'
import { Resend, CreateEmailOptions } from 'resend'
import { ReactNode } from 'react'
import { generateEmailTemplate } from '../templates'

type InjectedDependencies = {
  logger: Logger
}

interface ResendServiceConfig {
  apiKey: string
  from: string
}

export interface ResendNotificationServiceOptions {
  api_key: string
  from: string
}

// Allow flexibility in the input data while ensuring we match Resend's expected output types
type NotificationEmailOptions = {
  subject?: string
  headers?: Record<string, string>
  replyTo?: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  tags?: any[]
  text?: string
  scheduledAt?: string
}

/**
 * Service to handle email notifications using the Resend API.
 */
export class ResendNotificationService extends AbstractNotificationProviderService {
  static identifier = "resend" // Matches medusa-config.js
  protected config_: ResendServiceConfig 
  protected logger_: Logger 
  protected resend: Resend 

  constructor({ logger }: InjectedDependencies, options: ResendNotificationServiceOptions) {
    super()
    this.config_ = {
      apiKey: options.api_key,
      from: options.from
    }
    this.logger_ = logger
    this.resend = new Resend(this.config_.apiKey)
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    if (!notification) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `No notification information provided`)
    }
    if (notification.channel === 'sms') {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `SMS notification not supported`)
    }

    // Generate the email content using the template
    let emailContent: ReactNode

    try {
      emailContent = generateEmailTemplate(notification.template, notification.data)
    } catch (error) {
      if (error instanceof MedusaError) {
        throw error 
      }
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to generate email content for template: ${notification.template}`
      )
    }

    // Cast carefully: fallback to empty object, then cast the RESULT to the type
    const emailOptions = (notification.data.emailOptions || {}) as NotificationEmailOptions

    // Compose the message body to send via API to Resend
    const message: CreateEmailOptions = {
      to: notification.to,
      from: notification.from?.trim() ?? this.config_.from,
      react: emailContent,
      subject: emailOptions.subject ?? 'You have a new notification',
      headers: emailOptions.headers,
      replyTo: emailOptions.replyTo, // FIXED: Changed back to replyTo (camelCase)
      cc: emailOptions.cc,
      bcc: emailOptions.bcc,
      tags: emailOptions.tags,
      text: emailOptions.text,
      scheduledAt: emailOptions.scheduledAt,
      attachments: Array.isArray(notification.attachments)
        ? notification.attachments.map((attachment) => ({
            content: attachment.content,
            filename: attachment.filename,
            content_type: attachment.content_type,
            disposition: attachment.disposition ?? 'attachment',
            id: attachment.id ?? undefined
          }))
        : undefined,
    }

    // Send the email via Resend
    try {
      await this.resend.emails.send(message)
      this.logger_.log(
        `Successfully sent "${notification.template}" email to ${notification.to} via Resend`
      )
      return {} 
    } catch (error) {
      const errorCode = error.code || 'UNKNOWN_ERROR'
      const responseError = error.response?.body?.errors?.[0]
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send "${notification.template}" email to ${notification.to} via Resend: ${errorCode} - ${responseError?.message ?? error.message}`
      )
    }
  }
}