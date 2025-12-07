import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import Shippo from "shippo" // Import strictly for typing if available, or generic usage

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
    
    // FIX: Cast 'Shippo' to any to bypass "not callable" TS error.
    // This is necessary because Shippo uses legacy CommonJS exports.
    this.shippo_ = (Shippo as any)(options.api_key)
  }

  async getFulfillmentOptions(): Promise<any[]> {
    return [
      { id: "usps_priority", name: "USPS Priority Mail" },
      { id: "usps_first", name: "USPS First Class" }
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
    return !!(data.data?.address && data.data?.items?.length)
  }

  async calculatePrice(
    optionData: any,
    data: any,
    context: any
  ): Promise<any> {
    const address = data.data?.address
    
    // 1. Construct Shipment Object for Shippo
    const shipmentPayload = {
      address_from: {
        name: "Sender Name", // Replace with your store info
        street1: "123 Store St",
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
        country: address.country_code.toUpperCase()
      },
      parcels: [{
        length: "5",
        width: "5",
        height: "5",
        distance_unit: "in",
        weight: "2", // TODO: Calculate actual weight from data.items
        mass_unit: "lb"
      }],
      async: false
    }

    try {
      // 2. Call Shippo API to Rate Shop
      const shipment = await this.shippo_.shipment.create(shipmentPayload)
      
      // 3. Find the rate matching our option (e.g. "usps_priority")
      const serviceLevel = optionData.id || "usps_priority"
      
      // Filter for the specific provider (USPS) and service level
      const rate = shipment.rates.find((r: any) => 
        r.servicelevel.token === serviceLevel && r.provider === "USPS"
      )

      if (!rate) {
        this.logger_.warn(`No rate found for ${serviceLevel}`)
        return 1500 // Fallback price (in cents)
      }

      // Return price in cents (Shippo returns strings like "5.50")
      return Math.round(parseFloat(rate.amount) * 100)

    } catch (error) {
      this.logger_.error("Shippo Rate Error", error)
      return 1000 // Fallback
    }
  }

  async createFulfillment(
    data: any,
    items: any[],
    order: any,
    fulfillment: any
  ): Promise<any> {
    // 1. Re-construct shipment to get a fresh Rate ID
    const shipmentPayload = {
        address_from: {
            name: "Sender Name",
            street1: "123 Store St",
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
        
        // 2. Find the rate to purchase
        const serviceLevel = data.service_id || "usps_priority"
        const rate = shipment.rates.find((r: any) => r.servicelevel.token === serviceLevel)

        if (!rate) throw new Error("Rate not found for label purchase")

        // 3. Purchase Label (Transaction)
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