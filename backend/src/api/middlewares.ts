import { defineMiddlewares, authenticate } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    // --- ADD THIS BLOCK ---
    {
      method: "POST",
      matcher: "/store/auth/google/repair",
      middlewares: [
        // "customer" scope tells Medusa to validate user tokens (Bearer or Session)
        authenticate("customer", ["bearer", "session"]),
      ],
    },
    // ---------------------
    {
      method: "POST",
      matcher: "/store/carts/:id/line-items",
      bodyParser: {
        sizeLimit: "10mb",
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