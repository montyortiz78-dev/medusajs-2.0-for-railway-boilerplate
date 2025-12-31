import { loadEnv, Modules, defineConfig } from '@medusajs/utils';
import {
  ADMIN_CORS,
  AUTH_CORS,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  WORKER_MODE,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} from 'lib/constants';

loadEnv(process.env.NODE_ENV, process.cwd());

// --- DEBUG: Confirm Env Vars are loaded in Railway ---
console.log("Medusa Config Startup Check:", {
  NODE_ENV: process.env.NODE_ENV,
  Resend_Key_Exists: !!RESEND_API_KEY,
  Google_Client_ID_Exists: !!process.env.GOOGLE_CLIENT_ID, // Added Debug
  Redis_URL_Start: REDIS_URL?.substring(0, 8), 
});

// Smart Redis with Heartbeat
const redisOptions = {
  family: 6,
  keepAlive: 10000,
  ...(process.env.REDIS_URL?.startsWith("rediss://") ? {
    tls: { rejectUnauthorized: false }
  } : {})
};

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: process.env.REDIS_URL,
    redisOptions: redisOptions,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
      trustProxy: true,
      authCookieOptions: {
        sameSite: "none", 
        secure: true,
        httpOnly: true,
      },
    },
  },
  modules: [
    // --- AUTH MODULE (NEW) ---
    {
      resolve: "@medusajs/auth",
      options: {
        providers: [
          // Standard Email/Password
          {
            resolve: "@medusajs/auth-emailpass",
            id: "emailpass",
            options: {
              // Options usually empty for emailpass unless customizing
            }
          },
          // Google SSO
          {
            resolve: "@medusajs/auth-google",
            id: "google",
            options: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              // IMPORTANT: This URL must match the "Authorized redirect URI" in Google Console exactly
              callbackUrl: `${process.env.BACKEND_URL || "http://localhost:9000"}/auth/customer/google/callback`,
            },
          },
        ],
      },
    },

    // --- FILE MODULE ---
    {
      key: Modules.FILE,
      resolve: '@medusajs/file',
      options: {
        providers: [
          ...(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET ? [{
            resolve: './src/modules/cloudinary-file', 
            id: 'cloudinary',
            options: {
              cloud_name: CLOUDINARY_CLOUD_NAME,
              api_key: CLOUDINARY_API_KEY,
              api_secret: CLOUDINARY_API_SECRET,
              secure: true,
            }
          }] : 
          (MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY ? [{
            resolve: './src/modules/minio-file',
            id: 'minio',
            options: {
              endPoint: MINIO_ENDPOINT,
              accessKey: MINIO_ACCESS_KEY,
              secretKey: MINIO_SECRET_KEY,
              bucket: MINIO_BUCKET,
            }
          }] : 
          [{
            resolve: '@medusajs/file-local',
            id: 'local',
            options: {
              upload_dir: 'static',
              backend_url: `${process.env.BACKEND_URL || "http://localhost:9000"}/static`
            }
          }]))
        ]
      }
    },
    
    // --- REDIS / EVENT BUS ---
    ...(REDIS_URL ? [{
      key: Modules.EVENT_BUS,
      resolve: '@medusajs/event-bus-redis',
      options: {
        redisUrl: process.env.REDIS_URL,
        redisOptions: redisOptions
      }
    },
    {
      key: Modules.WORKFLOW_ENGINE,
      resolve: '@medusajs/workflow-engine-redis',
      options: {
        redis: {
          url: process.env.REDIS_URL,
          options: redisOptions
        }
      }
    },
    {
      key: Modules.CACHE,
      resolve: '@medusajs/cache-redis',
      options: {
        redisUrl: process.env.REDIS_URL,
        redisOptions: redisOptions
      }
    }] : []),

    // --- NOTIFICATION MODULE ---
    {
      key: Modules.NOTIFICATION,
      resolve: '@medusajs/notification',
      options: {
        providers: [
          // Resend Provider
          ...(RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
            resolve: './src/modules/email-notifications',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: RESEND_API_KEY,
              from: RESEND_FROM_EMAIL,
            },
          }] : []),
          
          // SendGrid Provider
          ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL ? [{
            resolve: '@medusajs/notification-sendgrid',
            id: 'sendgrid',
            options: {
              channels: ['email'],
              api_key: SENDGRID_API_KEY,
              from: SENDGRID_FROM_EMAIL,
            }
          }] : []),
        ]
      }
    },

    // --- PAYMENT MODULE ---
    ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET ? [{
      key: Modules.PAYMENT,
      resolve: '@medusajs/payment',
      options: {
        providers: [
          {
            resolve: '@medusajs/payment-stripe',
            id: 'stripe',
            options: {
              apiKey: STRIPE_API_KEY,
              webhookSecret: STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    }] : []),

    // --- FULFILLMENT MODULE ---
    {
      key: Modules.FULFILLMENT,
      resolve: '@medusajs/fulfillment',
      options: {
        providers: [
          {
            resolve: '@medusajs/fulfillment-manual',
            id: 'manual',
            options: {}
          },
          {
            resolve: './src/modules/fulfillment-providers/easypost-provider',
            id: 'easypost',
            options: {
              api_key: process.env.EASYPOST_API_KEY,
            }
          }
        ]
      }
    }
  ],
  plugins: [
    {
      resolve: `medusa-plugin-algolia`,
      options: {
        application_id: process.env.ALGOLIA_APP_ID,
        admin_api_key: process.env.ALGOLIA_ADMIN_API_KEY,
        settings: {
          products: {
            indexSettings: {
              searchableAttributes: ["title", "description", "variant_sku"],
              attributesToRetrieve: [
                "id",
                "title",
                "description",
                "handle",
                "thumbnail",
                "images",
                "variants",
                "variant_sku",
                "options",
                "collection_title",
                "collection_handle",
              ],
            },
            primaryKey: "id",
          },
        },
      },
    }
  ]
};

// console.log(JSON.stringify(medusaConfig, null, 2));
export default defineConfig(medusaConfig);