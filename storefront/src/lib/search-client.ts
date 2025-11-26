import algoliasearch from "algoliasearch/lite"

// Prevent crash by providing a fallback if keys are missing
const appId = process.env.NEXT_PUBLIC_SEARCH_APP_ID || "test_app_id"
const apiKey = process.env.NEXT_PUBLIC_SEARCH_API_KEY || "test_api_key"

export const searchClient = algoliasearch(appId, apiKey)

export const SEARCH_INDEX_NAME =
  process.env.NEXT_PUBLIC_INDEX_NAME || "products"