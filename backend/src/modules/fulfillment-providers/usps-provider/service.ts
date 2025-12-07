import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import Shippo from "shippo"

type UspsOptions = {
  api_key: string
}

type InjectedDependencies = {
  logger: Logger
}

class UspsFulfillmentProvider extends AbstractFulfillmentProviderService {
  static identifier = "usps"
  
  protected options_: UspsOptions
  protected logger_: Logger
  protected shippo_: any

  constructor(container: InjectedDependencies, options: UspsOptions) {
    super() 
    this.options_ = options
    this.logger_ = container.logger

    // FIX: Add safety check for API Key
    if (!options.api_key) {
      this.logger_.warn("⚠️ SHIPPO_API_KEY is missing in medusa-config.js. USPS Provider will not work correctly.")
    } else {
      try {
        // Initialize Shippo
        this.shippo_ = (Shippo as any)(options.api_key)
      } catch (err) {
        this.logger_.error("❌ Failed to initialize Shippo client", err)
      }
    }
  }

  // Medusa calls this to populate the "Fulfillment Option" dropdown in Admin
  async getFulfillmentOptions(): Promise<any[]> {
    this.logger_.info("Fetching USPS Fulfillment Options...")
    return [
      { id: "usps_priority", name: "USPS Priority Mail" },
      { id: "usps_first", name: "USPS First Class" },
      { id: "usps_priority_express", name: "USPS Priority Express" }
    ]
  }

  async validateFulfillmentData(
    optionData: any,
    data: any,
    context: any
  ): Promise<any> {
    return data
  }

  async validateOption(data: any): Promise<boolean> {
    return true
  }

  async canCalculate(data: any): Promise<boolean> {
    // Return true to ensure the calculator runs
    return true
  }

  async calculatePrice(
    optionData: any,
    data: any,
    context: any
  ): Promise<any> {
    // Safety check
    if (!this.shippo_) {
      this.logger_.error("Shippo client not initialized. Cannot calculate price.")
      return 1500 // Return fallback price to prevent checkout crash
    }

    const address = data.data?.address || data.shipping_address
    
    if (!address) {
        this.logger_.warn("No address provided for calculation")
        return 1000
    }

    // 1. Construct Shipment Object for Shippo (Rate Shopping)
    const shipmentPayload = {
      address_from: {
        name: "Kandi Land Store", 
        street1: "123 Kandi Lane", 
        city: "San Francisco",
        state: "CA",
        zip: "94117",
        country: "US"
      },
      address_to: {
        name: `${address.first_name} ${address.last_name}`,
        street1: address.address_1,
        street2: address.address_2,
        city: address.city,
        state: address.province,
        zip: address.postal_code,
        country: address.country_code?.toUpperCase()
      },
      parcels: [{
        length: "5",
        width: "5",
        height: "5",
        distance_unit: "in",
        weight: "2", 
        mass_unit: "lb"
      }],
      async: false
    }

    try {
      this.logger_.info(`Fetching rates for ${optionData.id}...`)
      const shipment = await this.shippo_.shipment.create(shipmentPayload)
      
      const serviceLevel = optionData.id || "usps_priority"
      
      // Filter for the specific provider (USPS) and service level
      const rate = shipment.rates.find((r: any) => 
        r.servicelevel.token === serviceLevel
      )

      if (!rate) {
        this.logger_.warn(`No rate found for ${serviceLevel} from Shippo.`)
        // Fallback: Return a mock price so checkout doesn't break during setup
        return 2000 
      }

      this.logger_.info(`Rate found: ${rate.amount}`)
      return Math.round(parseFloat(rate.amount) * 100)

    } catch (error) {
      this.logger_.error("Shippo Rate Error", error)
      return 1500 // Fallback
    }
  }

  async createFulfillment(
    data: any,
    items: any[],
    order: any,
    fulfillment: any
  ): Promise<any> {
    if (!this.shippo_) throw new Error("Shippo not initialized")

    const shipmentPayload = {
        address_from: {
            name: "Kandi Land Store",
            street1: "123 Kandi Lane",
            city: "San Francisco",
            state: "CA",
            zip: "94117",
            country: "US"
        },
        address_to: {
            name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
            street1: order.shipping_address.address_1,
            city: order.shipping_address.city,
            state: order.shipping_address.province,
            zip: order.shipping_address.postal_code,
            country: order.shipping_address.country_code.toUpperCase()
        },
        parcels: [{
            length: "5",
            width: "5",
            height: "5",
            distance_unit: "in",
            weight: "2",
            mass_unit: "lb"
        }],
        async: false
    }

    try {
        const shipment = await this.shippo_.shipment.create(shipmentPayload)
        
        // Use the option ID (e.g. usps_priority) passed in the data or order context
        const serviceLevel = data.service_id || "usps_priority"
        const rate = shipment.rates.find((r: any) => r.servicelevel.token === serviceLevel)

        if (!rate) throw new Error("Rate not found for label purchase")

        const transaction = await this.shippo_.transaction.create({
            rate: rate.object_id,
            label_file_type: "PDF",
            async: false
        })

        if (transaction.status !== "SUCCESS") {
            throw new Error(`Label purchase failed: ${transaction.messages}`)
        }

        return {
            data: {
                carrier: "USPS",
                tracking_number: transaction.tracking_number,
                label_url: transaction.label_url
            }
        }
    } catch (e) {
        this.logger_.error("Shippo Label Purchase Error", e)
        throw e
    }
  }

  async cancelFulfillment(fulfillment: any): Promise<any> {
      return {}
  }
}

export default UspsFulfillmentProvider