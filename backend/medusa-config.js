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
  Resend_From_Exists: !!RESEND_FROM_EMAIL,
  Redis_URL_Start: REDIS_URL?.substring(0, 8), // Debug protocol
});

// --- SMART REDIS CONFIG ---
// Define options once to use across all Redis modules.
// This preserves your 'family: 6' fix but adds SSL support if the URL requires it.
const redisOptions = {
  family: 6,
  ...(REDIS_URL?.startsWith("rediss://") ? {
    tls: {
      rejectUnauthorized: false,
    }
  } : {})
};

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET,
      // 👇 THIS IS THE CRITICAL FIX FOR 401 ERRORS 👇
      authCookieOptions: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    build: {
      rollupOptions: {
        external: ["@medusajs/dashboard"]
      }
    }
  },
  admin: {
    backendUrl: "https://backend-production-622a.up.railway.app",
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
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
              backend_url: "https://backend-production-622a.up.railway.app/static"
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
        redisUrl: REDIS_URL,
        redisOptions: redisOptions // Updated to use smart config
      }
    },
    {
      key: Modules.WORKFLOW_ENGINE,
      resolve: '@medusajs/workflow-engine-redis',
      options: {
        redis: {
          url: REDIS_URL,
          options: redisOptions // Updated to use smart config
        }
      }
    },
    {
      key: Modules.CACHE,
      resolve: '@medusajs/cache-redis',
      options: {
        redisUrl: REDIS_URL,
        redisOptions: redisOptions // Added Cache module just in case
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

console.log(JSON.stringify(medusaConfig, null, 2));
export default defineConfig(medusaConfig);