import { ModuleProvider, Modules, AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import EasyPostClient from "@easypost/api"

// --- TYPES ---
type EasyPostOptions = {
  api_key: string
}

type InjectedDependencies = {
  logger: Logger
}

// --- SERVICE CLASS ---
class EasyPostFulfillmentProvider extends AbstractFulfillmentProviderService {
  static identifier = "easypost"
  
  protected options_: EasyPostOptions
  protected logger_: Logger
  protected easypost_: EasyPostClient

  constructor(container: InjectedDependencies, options: EasyPostOptions) {
    super() 
    this.options_ = options
    this.logger_ = container.logger

    if (!options.api_key) {
      this.logger_.warn("⚠️ EASYPOST_API_KEY is missing. EasyPost Provider will not work.")
    } else {
      try {
        this.easypost_ = new EasyPostClient(options.api_key)
      } catch (err) {
        this.logger_.error("❌ Failed to initialize EasyPost client", err)
      }
    }
  }

  async getFulfillmentOptions(): Promise<any[]> {
    return [
      { id: "First", name: "USPS First Class" },
      { id: "Priority", name: "USPS Priority" },
      { id: "Express", name: "USPS Express" },
      { id: "GroundAdventure", name: "USPS Ground Advantage" },
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
    return true
  }

  async calculatePrice(
    optionData: any,
    data: any,
    context: any
  ): Promise<any> {
    if (!this.easypost_) {
      this.logger_.error("EasyPost client not initialized.")
      return 1500
    }

    const address = data.data?.address || data.shipping_address
    if (!address) return 1000

    try {
      const shipment = await this.easypost_.Shipment.create({
        to_address: {
          name: `${address.first_name} ${address.last_name}`,
          street1: address.address_1,
          street2: address.address_2,
          city: address.city,
          state: address.province,
          zip: address.postal_code,
          country: address.country_code?.toUpperCase(),
          phone: address.phone || "5555555555"
        },
        from_address: {
          name: "Kandi Land Store",
          street1: "123 Kandi Lane",
          city: "San Francisco",
          state: "CA",
          zip: "94117",
          country: "US",
          phone: "5555555555"
        },
        parcel: {
          length: 5,
          width: 5,
          height: 5,
          weight: 20
        }
      })

      const serviceName = optionData.id
      const rates = shipment.rates
      const matchedRate = rates.find((r: any) => r.service === serviceName)

      if (!matchedRate) {
        if (rates.length > 0) {
           const cheapest = rates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))[0]
           return Math.round(parseFloat(cheapest.rate) * 100)
        }
        return 2000
      }

      return Math.round(parseFloat(matchedRate.rate) * 100)

    } catch (error) {
      this.logger_.error("EasyPost Rate Calculation Error", error)
      return 1500
    }
  }

  async createFulfillment(
    data: any,
    items: any[],
    order: any,
    fulfillment: any
  ): Promise<any> {
    if (!this.easypost_) throw new Error("EasyPost not initialized")

    try {
        const shipment = await this.easypost_.Shipment.create({
            to_address: {
              name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
              street1: order.shipping_address.address_1,
              street2: order.shipping_address.address_2,
              city: order.shipping_address.city,
              state: order.shipping_address.province,
              zip: order.shipping_address.postal_code,
              country: order.shipping_address.country_code?.toUpperCase(),
              phone: order.shipping_address.phone || "5555555555"
            },
            from_address: {
              name: "Kandi Land Store",
              street1: "123 Kandi Lane",
              city: "San Francisco",
              state: "CA",
              zip: "94117",
              country: "US",
              phone: "5555555555"
            },
            parcel: {
              length: 5,
              width: 5,
              height: 5,
              weight: 20
            }
        })

        const serviceName = data.service_id || "Priority"
        const rate = shipment.rates.find((r: any) => r.service === serviceName) || shipment.lowestRate()

        if (!rate) throw new Error("Could not find a valid rate to purchase label.")

        const boughtShipment = await this.easypost_.Shipment.buy(shipment.id, rate.id)

        return {
            data: {
                carrier: boughtShipment.tracker.carrier,
                tracking_number: boughtShipment.tracker.tracking_code,
                label_url: boughtShipment.postage_label.label_url,
                easypost_shipment_id: boughtShipment.id
            }
        }
    } catch (e) {
        this.logger_.error("EasyPost Label Purchase Error", e)
        throw e
    }
  }

  async cancelFulfillment(fulfillment: any): Promise<any> {
      return {}
  }
}

// --- MODULE EXPORT ---
export default ModuleProvider(Modules.FULFILLMENT, {
  services: [EasyPostFulfillmentProvider],
})