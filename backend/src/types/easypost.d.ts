declare module '@easypost/api' {
  export default class EasyPostClient {
    constructor(apiKey: string);
    Shipment: any;
    // Allow any other property
    [key: string]: any;
  }
}