import { defineMiddlewares, authenticate } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      // 1. Protect the Onboarding route
      matcher: "/store/auth/google/onboarding",
      method: "POST",
      // 2. IMPORTANT: allowUnregistered: true lets the "Ghost Token" in
      middlewares: [authenticate("customer", ["bearer", "session"], { allowUnregistered: true })],
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