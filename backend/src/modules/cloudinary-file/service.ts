import { AbstractFileProviderService } from "@medusajs/framework/utils"
import { 
  ProviderUploadFileDTO, 
  ProviderDeleteFileDTO, 
  ProviderFileResultDTO, 
  Logger,
  FileTypes // <--- IMPORT THIS NAMESPACE
} from "@medusajs/framework/types"
import { v2 as cloudinary } from "cloudinary"

type Options = {
  cloud_name: string
  api_key: string
  api_secret: string
  secure?: boolean
}

export default class CloudinaryFileProviderService extends AbstractFileProviderService {
  static identifier = "cloudinary-file"
  protected options_: Options
  protected logger_: Logger

  constructor({ logger }: { logger: Logger }, options: Options) {
    super()
    this.options_ = options
    this.logger_ = logger

    cloudinary.config({
      cloud_name: options.cloud_name,
      api_key: options.api_key,
      api_secret: options.api_secret,
      secure: options.secure ?? true,
    })
  }

  async upload(file: ProviderUploadFileDTO): Promise<ProviderFileResultDTO> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: file.filename.split(".")[0],
          resource_type: "auto",
          folder: "medusa-uploads",
        },
        (error, result) => {
          if (error) {
            this.logger_.error(`Cloudinary upload failed: ${error.message}`)
            return reject(error)
          }

          if (!result) {
            return reject(new Error("Cloudinary upload failed: Unknown error"))
          }

          resolve({
            url: result.secure_url,
            key: result.public_id,
          })
        }
      )

      uploadStream.end(Buffer.from(file.content, "binary"))
    })
  }

  async delete(fileData: ProviderDeleteFileDTO): Promise<void> {
    try {
      await cloudinary.uploader.destroy(fileData.fileKey)
    } catch (error) {
      this.logger_.error(`Cloudinary delete failed: ${error}`)
    }
  }

  // FIX: Use FileTypes.ProviderGetFileDTO
  async getPresignedDownloadUrl(fileData: FileTypes.ProviderGetFileDTO): Promise<string> {
    return fileData.fileKey
  }
}