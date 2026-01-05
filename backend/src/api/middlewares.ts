import { defineMiddlewares, authenticate } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      method: "POST",
      matcher: "/store/auth/google/onboarding",
      middlewares: [
        // CRITICAL: allowUnregistered: true allows "Ghost Tokens" to access this route
        authenticate("customer", ["bearer", "session"], { allowUnregistered: true }),
      ],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/line-items",
      bodyParser: { sizeLimit: "10mb" },
    },
    {
      method: "POST",
      matcher: "/store/upload-image",
      bodyParser: { sizeLimit: "10mb" },
    },
  ],
})