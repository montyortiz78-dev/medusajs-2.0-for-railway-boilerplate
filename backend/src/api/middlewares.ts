import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      method: "POST",
      matcher: "/store/carts/:id/line-items",
      bodyParser: {
        sizeLimit: "10mb", // Increase limit for image uploads
      },
    },
    {
      method: "POST",
      matcher: "/store/upload-image",
      bodyParser: {
        sizeLimit: "10mb", 
      },
    },
  ],
})