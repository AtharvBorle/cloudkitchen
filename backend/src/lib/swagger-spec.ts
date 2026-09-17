/**
 * Complete OpenAPI 3.0.3 Specification for Neo Cloud Kitchen & Room Rental API
 * Includes full Bearer Token authorization and all 100+ backend endpoints.
 */

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Neo Cloud Kitchen & Room Rental API",
    version: "1.0.0",
    description: `
## 🚀 Mobile & Frontend Developer API Interactive Documentation

Welcome to the **Neo Cloud Kitchen & Room Rental REST API Console**.

### 🔐 How to Test Authorized Endpoints:
1. First, call **\`POST /api/auth/login\`** with your credentials (or **\`POST /api/auth/register\`** to create a new user/seller/rider).
2. Copy the **\`token\`** value from the response: \`"eyJhbGciOiJIUzI1NiIsInR5cCI6..."\`.
3. Click the green **\`Authorize 🔓\`** button at the top-right of this page.
4. Paste the token into the **Value** field and click **Authorize**. *(You can paste just the token, or format it as \`Bearer <token>\`)*.
5. Click **Close**. All authorized endpoints will now automatically send the \`Authorization: Bearer <token>\` header with every request!
    `,
    contact: {
      name: "Neo Cloud Kitchen Engineering Team",
      email: "support@neocloudroom.com"
    }
  },
  servers: [
    {
      url: "/",
      description: "Current Server (Auto-detects Localhost, LAN IP, or Domain)"
    },
    {
      url: "http://localhost:5000",
      description: "Localhost Development Server"
    }
  ],
  tags: [
    { name: "Authentication", description: "Registration and login endpoints for Customers, Sellers, and Riders" },
    { name: "Public-Discovery", description: "Public storefront, search, explore, categories, rooms, and banners" },
    { name: "Customer-User", description: "User profile, delivery addresses, orders, payments, reviews, and bookings" },
    { name: "Seller-Profile", description: "Seller profile, store online/offline switch, overview stats, and offers" },
    { name: "Seller-Food-Menu", description: "Dishes, categories, pricing, stock availability, and delivery pincodes" },
    { name: "Seller-Meal-Plans", description: "Recurring weekly/monthly meal plans" },
    { name: "Seller-Rooms", description: "Room listings, photos, amenities, pricing, and tenant bookings" },
    { name: "Seller-Orders", description: "Live order processing, rider assignment, and customer review responses" },
    { name: "Seller-Delivery", description: "In-house delivery rider roster, cash collection (COD), and ledger" },
    { name: "Seller-Subscriptions", description: "Platform subscription tiers, Razorpay payment verification, and coupons" },
    { name: "Delivery-Rider", description: "Rider task dashboard, route details, COD collection, and transactions" },
    { name: "Coupons-Discounts", description: "Discount coupon validation and management" },
    { name: "Refunds-Disputes", description: "Order cancellation and refund tracking" },
    { name: "Support-Tickets", description: "Support tickets and messaging threads" },
    { name: "Furniture-Inquiries", description: "Custom furniture rental enquiries" },
    { name: "Admin-Superadmin", description: "Platform administration, approvals, categories, sellers, and system settings" }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Bearer JWT token from POST /api/auth/login or POST /api/auth/register."
      }
    },
    schemas: {
      StandardResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
          message: { type: "string", example: "Operation successful" },
          statusCode: { type: "integer", example: 200 }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Error message description" },
          statusCode: { type: "integer", example: 400 }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "seller@example.com" },
          password: { type: "string", example: "SecurePassword123!" }
        }
      },
      CustomerRegisterRequest: {
        type: "object",
        required: ["name", "email", "password", "role"],
        properties: {
          name: { type: "string", example: "Aman Sharma" },
          email: { type: "string", format: "email", example: "aman@example.com" },
          phone: { type: "string", example: "9876543210" },
          password: { type: "string", example: "SecurePassword123!" },
          role: { type: "string", enum: ["USER", "SELLER", "DELIVERY"], example: "USER" },
          city: { type: "string", example: "Pune" },
          pincode: { type: "string", example: "411001" }
        }
      },
      SellerRegisterRequest: {
        type: "object",
        required: ["name", "email", "password", "businessName", "sellerType"],
        properties: {
          name: { type: "string", example: "Rohan Mehra" },
          email: { type: "string", format: "email", example: "rohan@kitchen.com" },
          phone: { type: "string", example: "9876543210" },
          password: { type: "string", example: "SecurePassword123!" },
          role: { type: "string", example: "SELLER" },
          sellerType: { type: "string", enum: ["FOOD", "PROPERTY", "BOTH"], example: "FOOD" },
          businessName: { type: "string", example: "Spice Symphony Cloud Kitchen" },
          foodType: { type: "string", enum: ["BOTH", "PURE_VEG", "NON_VEG"], example: "BOTH" },
          city: { type: "string", example: "Pune" },
          pincode: { type: "string", example: "411038" },
          addressArea: { type: "string", example: "Kothrud, Pune" },
          addressFlat: { type: "string", example: "Shop 12, Floor 1" },
          latitude: { type: "number", format: "float", example: 18.5074, description: "Accurate GPS Latitude for delivery routing" },
          longitude: { type: "number", format: "float", example: 73.8077, description: "Accurate GPS Longitude for delivery routing" },
          isLocationPinned: { type: "boolean", example: true }
        }
      }
    }
  },
  paths: {
    // ==========================================
    // 1. AUTHENTICATION & ONBOARDING
    // ==========================================
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "User / Seller / Rider Login",
        description: "Authenticates user credentials and returns a JWT Bearer token valid for 30 days.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Login successful with JWT token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                        user: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "usr_12345" },
                            name: { type: "string", example: "Aman Sharma" },
                            email: { type: "string", example: "aman@example.com" },
                            role: { type: "string", example: "USER" }
                          }
                        }
                      }
                    },
                    message: { type: "string", example: "Login successful" }
                  }
                }
              }
            }
          },
          401: { description: "Invalid email or password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "User / Seller / Rider Registration",
        description: "Registers a new customer (JSON) or seller/rider with KYC documents and GPS delivery pin coordinates (JSON or multipart/form-data).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/CustomerRegisterRequest" },
                  { $ref: "#/components/schemas/SellerRegisterRequest" }
                ]
              }
            },
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Rohan Mehra" },
                  email: { type: "string", example: "seller@example.com" },
                  phone: { type: "string", example: "9876543210" },
                  password: { type: "string", example: "SecurePassword123!" },
                  role: { type: "string", example: "SELLER" },
                  sellerType: { type: "string", enum: ["FOOD", "PROPERTY", "BOTH"], example: "FOOD" },
                  businessName: { type: "string", example: "Spice Symphony Kitchen" },
                  foodType: { type: "string", enum: ["BOTH", "PURE_VEG", "NON_VEG"], example: "BOTH" },
                  city: { type: "string", example: "Pune" },
                  pincode: { type: "string", example: "411038" },
                  addressArea: { type: "string", example: "Kothrud, Pune" },
                  latitude: { type: "number", example: 18.5074 },
                  longitude: { type: "number", example: 73.8077 },
                  isLocationPinned: { type: "boolean", example: true },
                  adhaarFrontFile: { type: "string", format: "binary" },
                  adhaarBackFile: { type: "string", format: "binary" },
                  fssaiFile: { type: "string", format: "binary" },
                  lightBillFile: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Registration successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { type: "object" },
                        sellerProfile: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            trackingId: { type: "string", example: "SHOP-772910" },
                            businessName: { type: "string", example: "Spice Symphony Kitchen" },
                            latitude: { type: "number", example: 18.5074 },
                            longitude: { type: "number", example: 73.8077 },
                            isLocationPinned: { type: "boolean", example: true },
                            verificationStatus: { type: "string", example: "PENDING" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Validation error or duplicate user", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/api/auth/session": {
      get: {
        tags: ["Authentication"],
        summary: "Get Active Session (Web NextAuth)",
        description: "Returns active user session when authenticated via NextAuth browser cookie or Bearer token.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Active session object",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        email: { type: "string" },
                        role: { type: "string" }
                      }
                    },
                    expires: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/csrf": {
      get: {
        tags: ["Authentication"],
        summary: "Get CSRF Token (Web NextAuth)",
        description: "Returns the anti-CSRF token required by NextAuth for browser-based form logins.",
        responses: {
          200: {
            description: "CSRF token response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    csrfToken: { type: "string", example: "9f8a3b2c1e..." }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/providers": {
      get: {
        tags: ["Authentication"],
        summary: "List Auth Providers (Web NextAuth)",
        description: "Returns configured NextAuth authentication providers (e.g., credentials).",
        responses: {
          200: {
            description: "Providers list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    credentials: {
                      type: "object",
                      properties: {
                        id: { type: "string", example: "credentials" },
                        name: { type: "string", example: "Credentials" },
                        type: { type: "string", example: "credentials" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/callback/credentials": {
      post: {
        tags: ["Authentication"],
        summary: "NextAuth Browser Credentials Login",
        description: "Browser NextAuth credentials endpoint. Validates email & password, establishes HTTP-only session cookie for the web frontend.",
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["email", "password", "csrfToken"],
                properties: {
                  email: { type: "string", example: "seller@example.com" },
                  password: { type: "string", example: "SecurePassword123!" },
                  csrfToken: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Logged in and session cookie set" },
          401: { description: "Invalid credentials" }
        }
      }
    },
    "/api/auth/signout": {
      post: {
        tags: ["Authentication"],
        summary: "Sign Out (Web NextAuth)",
        description: "Clears active NextAuth session cookies in the browser.",
        responses: {
          200: { description: "Session cleared successfully" }
        }
      }
    },

    // ==========================================
    // 2. PUBLIC & DISCOVERY APIS
    // ==========================================
    "/api/public/explore": {
      get: {
        tags: ["Public-Discovery"],
        summary: "Explore Hub (Home Screen)",
        description: "Returns trending kitchens, featured meal plans, popular rooms, and promo banners.",
        responses: {
          200: { description: "Explore feed data", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/public/search": {
      get: {
        tags: ["Public-Discovery"],
        summary: "Global Search",
        description: "Search across menu dishes, cuisines, kitchens, and room rentals.",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string", example: "Biryani" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["FOOD", "ROOM", "ALL"], default: "ALL" } },
          { name: "city", in: "query", schema: { type: "string", example: "Pune" } }
        ],
        responses: {
          200: { description: "Search results", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/public/categories": {
      get: {
        tags: ["Public-Discovery"],
        summary: "List Food Categories",
        description: "Retrieves all active food categories and subcategories.",
        responses: {
          200: { description: "Category list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/public/coupons": {
      get: {
        tags: ["Public-Discovery"],
        summary: "Public Promotional Coupons",
        description: "Returns active discount coupons for food and room bookings.",
        responses: {
          200: { description: "Coupons list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/public/meal-plans": {
      get: {
        tags: ["Public-Discovery"],
        summary: "Public Meal Plans",
        description: "Lists active recurring subscription meal plans from all verified kitchens.",
        responses: {
          200: { description: "Meal plans list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/public/rooms": {
      get: {
        tags: ["Public-Discovery"],
        summary: "Discover Rooms & Properties",
        description: "Search available rooms with filters (city, type, price range, furnishing).",
        parameters: [
          { name: "city", in: "query", schema: { type: "string", example: "Pune" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "furnishing", in: "query", schema: { type: "string", enum: ["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"] } }
        ],
        responses: {
          200: { description: "Rooms listing", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/public/rooms/{id}": {
      get: {
        tags: ["Public-Discovery"],
        summary: "Room Details",
        description: "Get comprehensive details for a room listing including amenities, photos, and landlord info.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Room details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/public/rooms/{id}/availability": {
      get: {
        tags: ["Public-Discovery"],
        summary: "Check Room Availability",
        description: "Checks if a room is available for specified check-in and check-out dates.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "startDate", in: "query", required: true, schema: { type: "string", format: "date", example: "2026-10-01" } },
          { name: "endDate", in: "query", required: true, schema: { type: "string", format: "date", example: "2026-10-31" } }
        ],
        responses: {
          200: { description: "Availability result", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/public/shop/{trackingId}": {
      get: {
        tags: ["Public-Discovery"],
        summary: "Storefront Menu & Details",
        description: "Retrieves complete store profile, active dishes, ratings, and address by tracking ID.",
        parameters: [
          { name: "trackingId", in: "path", required: true, schema: { type: "string", example: "SHOP-772910" } }
        ],
        responses: {
          200: { description: "Storefront details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/public/promo-banners": {
      get: {
        tags: ["Public-Discovery"],
        summary: "Promotional Carousel Banners",
        description: "Returns active hero promo banners for the mobile app home screen.",
        responses: {
          200: { description: "Promo banners list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/public/popup-banners": {
      get: {
        tags: ["Public-Discovery"],
        summary: "Popup Modal Banners",
        description: "Returns active splash and modal popup alerts.",
        responses: {
          200: { description: "Popup banners list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },

    // ==========================================
    // 3. CUSTOMER / USER APIS
    // ==========================================
    "/api/user/profile": {
      get: {
        tags: ["Customer-User"],
        summary: "Get User Profile",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "User profile", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      put: {
        tags: ["Customer-User"],
        summary: "Update User Profile",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Aman Sharma" },
                  phone: { type: "string", example: "9876543210" },
                  city: { type: "string", example: "Pune" },
                  pincode: { type: "string", example: "411001" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Updated profile", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/user/dashboard": {
      get: {
        tags: ["Customer-User"],
        summary: "Customer Dashboard Summary",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Dashboard summary", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/user/addresses": {
      get: {
        tags: ["Customer-User"],
        summary: "List Saved Addresses",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Addresses list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      post: {
        tags: ["Customer-User"],
        summary: "Add New Delivery Address",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["addressFlat", "addressArea", "city", "pincode"],
                properties: {
                  addressFlat: { type: "string", example: "Flat 302, Royal Palms" },
                  addressArea: { type: "string", example: "Viman Nagar" },
                  addressLandmark: { type: "string", example: "Near Phoenix Marketcity" },
                  city: { type: "string", example: "Pune" },
                  pincode: { type: "string", example: "411014" },
                  type: { type: "string", enum: ["HOME", "WORK", "OTHER"], default: "HOME" },
                  isDefault: { type: "boolean", default: true }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Address added", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/user/addresses/{id}": {
      put: {
        tags: ["Customer-User"],
        summary: "Update Address",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } }
        },
        responses: {
          200: { description: "Address updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      delete: {
        tags: ["Customer-User"],
        summary: "Delete Address",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Address deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/user/addresses/{id}/default": {
      put: {
        tags: ["Customer-User"],
        summary: "Set Default Address",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Default address updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/user/location": {
      get: {
        tags: ["Customer-User"],
        summary: "Get Current GPS Location",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "User location", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      post: {
        tags: ["Customer-User"],
        summary: "Save GPS Coordinates",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["latitude", "longitude"],
                properties: {
                  latitude: { type: "number", example: 18.5204 },
                  longitude: { type: "number", example: 73.8567 },
                  address: { type: "string", example: "FC Road, Shivajinagar, Pune" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Location saved", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/user/orders": {
      get: {
        tags: ["Customer-User"],
        summary: "Customer Orders History",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Orders list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      post: {
        tags: ["Customer-User"],
        summary: "Place Food Order",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["sellerId", "items", "deliveryAddressId", "paymentMethod"],
                properties: {
                  sellerId: { type: "string", example: "sel_123" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        menuItemId: { type: "string", example: "item_001" },
                        quantity: { type: "integer", example: 2 },
                        price: { type: "number", example: 220 }
                      }
                    }
                  },
                  deliveryAddressId: { type: "string", example: "addr_456" },
                  paymentMethod: { type: "string", enum: ["COD", "ONLINE", "WALLET"], example: "COD" },
                  couponCode: { type: "string", example: "FIRST50" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Order created successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/user/orders/{id}": {
      get: {
        tags: ["Customer-User"],
        summary: "Track Single Order",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Order details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/user/orders/verify": {
      post: {
        tags: ["Customer-User"],
        summary: "Verify Razorpay Payment for Order",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature", "orderId"],
                properties: {
                  razorpay_order_id: { type: "string" },
                  razorpay_payment_id: { type: "string" },
                  razorpay_signature: { type: "string" },
                  orderId: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Payment verified and order confirmed", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/user/orders/{id}/review": {
      post: {
        tags: ["Customer-User"],
        summary: "Review Food Order",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating"],
                properties: {
                  rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
                  review: { type: "string", example: "Delicious authentic biryani, fast delivery!" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Review submitted", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/user/bookings": {
      get: {
        tags: ["Customer-User"],
        summary: "Customer Room Bookings",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Bookings list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      post: {
        tags: ["Customer-User"],
        summary: "Create Room Booking",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["roomId", "startDate", "endDate"],
                properties: {
                  roomId: { type: "string" },
                  startDate: { type: "string", format: "date", example: "2026-10-01" },
                  endDate: { type: "string", format: "date", example: "2026-10-31" },
                  guestsCount: { type: "integer", default: 1 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Booking created", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/user/bookings/{id}/pay": {
      post: {
        tags: ["Customer-User"],
        summary: "Initiate Booking Payment",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Razorpay order initialized", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/user/bookings/{id}/verify": {
      post: {
        tags: ["Customer-User"],
        summary: "Verify Booking Payment",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } }
        },
        responses: {
          200: { description: "Booking confirmed", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },

    // ==========================================
    // 4. SELLER - PROFILE & DASHBOARD
    // ==========================================
    "/api/seller/profile": {
      get: {
        tags: ["Seller-Profile"],
        summary: "Get Merchant Profile",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Seller profile data", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      put: {
        tags: ["Seller-Profile"],
        summary: "Update Merchant Profile",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  businessName: { type: "string", example: "Spice Symphony Cloud Hub" },
                  phone: { type: "string", example: "9876543210" },
                  city: { type: "string", example: "Pune" },
                  pincode: { type: "string", example: "411038" },
                  infoAddress: { type: "string", example: "Kothrud, Pune" },
                  latitude: { type: "number", example: 18.5074 },
                  longitude: { type: "number", example: 73.8077 },
                  isLocationPinned: { type: "boolean", example: true },
                  upiId: { type: "string", example: "merchant@okhdfcbank" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Profile updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/profile/status": {
      get: {
        tags: ["Seller-Profile"],
        summary: "Get Store Online/Offline Switch",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Online status", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      put: {
        tags: ["Seller-Profile"],
        summary: "Toggle Store Online/Offline",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["isOnline"],
                properties: {
                  isOnline: { type: "boolean", example: true }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Online status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/profile/{id}": {
      get: {
        tags: ["Seller-Profile"],
        summary: "Fetch Public Merchant Profile by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Seller details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/dashboard/overview": {
      get: {
        tags: ["Seller-Profile"],
        summary: "Seller Dashboard Analytics Overview",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Dashboard metrics (sales, active orders, ratings)", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/dashboard/status": {
      get: {
        tags: ["Seller-Profile"],
        summary: "Seller Verification & Subscriptions Status",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Active subscriptions, stacked validity dates, category verification status", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/dashboard/offers": {
      get: {
        tags: ["Seller-Profile"],
        summary: "List Store Custom Offers",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Offers list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      post: {
        tags: ["Seller-Profile"],
        summary: "Create Store Custom Offer",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "discountPercentage", "minOrderValue"],
                properties: {
                  title: { type: "string", example: "Flat 20% Off" },
                  discountPercentage: { type: "number", example: 20 },
                  minOrderValue: { type: "number", example: 300 },
                  maxDiscountAmount: { type: "number", example: 60 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Offer created", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/dashboard/offers/{id}": {
      put: {
        tags: ["Seller-Profile"],
        summary: "Update Store Offer",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } }
        },
        responses: {
          200: { description: "Offer updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      delete: {
        tags: ["Seller-Profile"],
        summary: "Delete Store Offer",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Offer deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/revision": {
      get: {
        tags: ["Seller-Profile"],
        summary: "Get Verification Revision Details",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Revision notes and required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      post: {
        tags: ["Seller-Profile"],
        summary: "Resubmit KYC Documents for Revision",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object" } } }
        },
        responses: {
          200: { description: "Documents resubmitted for admin review", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/category-application": {
      post: {
        tags: ["Seller-Profile"],
        summary: "Apply for Additional Business Category",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["category"],
                properties: {
                  category: { type: "string", enum: ["FOOD", "PROPERTY", "BOTH"], example: "PROPERTY" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Application submitted", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },

    // ==========================================
    // 5. SELLER - FOOD & MENU MANAGEMENT
    // ==========================================
    "/api/seller/menu": {
      get: {
        tags: ["Seller-Food-Menu"],
        summary: "List Seller Menu Items",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Menu list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      post: {
        tags: ["Seller-Food-Menu"],
        summary: "Add New Menu Item",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "price", "category"],
                properties: {
                  name: { type: "string", example: "Hyderabadi Chicken Biryani" },
                  description: { type: "string", example: "Aromatic basmati rice cooked with tender spices." },
                  price: { type: "number", example: 280 },
                  category: { type: "string", example: "Biryani" },
                  isVeg: { type: "boolean", example: false },
                  imageUrl: { type: "string", example: "https://example.com/biryani.jpg" },
                  isAvailable: { type: "boolean", default: true }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Menu item created", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/menu/{id}": {
      get: {
        tags: ["Seller-Food-Menu"],
        summary: "Get Single Menu Item",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Menu item details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      put: {
        tags: ["Seller-Food-Menu"],
        summary: "Update Menu Item",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } }
        },
        responses: {
          200: { description: "Menu item updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      delete: {
        tags: ["Seller-Food-Menu"],
        summary: "Delete Menu Item",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Menu item deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/menu/pincodes": {
      get: {
        tags: ["Seller-Food-Menu"],
        summary: "List Serviceable Delivery Pincodes",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Pincodes list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      post: {
        tags: ["Seller-Food-Menu"],
        summary: "Add Serviceable Pincode",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["pincode"],
                properties: {
                  pincode: { type: "string", example: "411038" },
                  areaName: { type: "string", example: "Kothrud" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Pincode added", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/menu/pincodes/{id}": {
      delete: {
        tags: ["Seller-Food-Menu"],
        summary: "Remove Serviceable Pincode",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Pincode removed", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },

    // ==========================================
    // 6. SELLER - MEAL PLANS & SUBSCRIPTIONS
    // ==========================================
    "/api/seller/meal-plans": {
      get: {
        tags: ["Seller-Meal-Plans"],
        summary: "List Seller Meal Plans",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Meal plans list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      post: {
        tags: ["Seller-Meal-Plans"],
        summary: "Create Subscription Meal Plan",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "price", "durationDays"],
                properties: {
                  name: { type: "string", example: "Monthly North Indian Thali" },
                  description: { type: "string", example: "2 Roti, Sabji, Dal, Rice, Salad daily" },
                  price: { type: "number", example: 3600 },
                  durationDays: { type: "integer", example: 30 },
                  mealsPerDay: { type: "integer", default: 1 },
                  isVeg: { type: "boolean", default: true }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Meal plan created", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/meal-plans/{id}": {
      get: {
        tags: ["Seller-Meal-Plans"],
        summary: "Get Meal Plan Details",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Meal plan details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      put: {
        tags: ["Seller-Meal-Plans"],
        summary: "Update Meal Plan",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Meal plan updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      delete: {
        tags: ["Seller-Meal-Plans"],
        summary: "Delete Meal Plan",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Meal plan deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },

    // ==========================================
    // 7. SELLER - ROOMS & PROPERTY
    // ==========================================
    "/api/seller/rooms": {
      get: {
        tags: ["Seller-Rooms"],
        summary: "List Landlord Room Listings",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Rooms list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      post: {
        tags: ["Seller-Rooms"],
        summary: "Create Room Listing",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "monthlyRent", "depositAmount", "city"],
                properties: {
                  title: { type: "string", example: "Spacious 1BHK in Viman Nagar" },
                  description: { type: "string", example: "Fully furnished with high-speed WiFi and power backup." },
                  monthlyRent: { type: "number", example: 18000 },
                  depositAmount: { type: "number", example: 36000 },
                  roomType: { type: "string", enum: ["1BHK", "2BHK", "SINGLE_ROOM", "SHARED"], example: "1BHK" },
                  furnishingStatus: { type: "string", enum: ["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"], example: "FURNISHED" },
                  city: { type: "string", example: "Pune" },
                  pincode: { type: "string", example: "411014" },
                  address: { type: "string", example: "Plot 18, Clover Park, Viman Nagar" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Room listing created", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/rooms/{id}": {
      get: {
        tags: ["Seller-Rooms"],
        summary: "Get Room Details",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Room details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      put: {
        tags: ["Seller-Rooms"],
        summary: "Update Room Listing",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Room updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      delete: {
        tags: ["Seller-Rooms"],
        summary: "Delete Room Listing",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Room deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/seller/rooms/bookings": {
      get: {
        tags: ["Seller-Rooms"],
        summary: "List Tenant Bookings for Landlord",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Bookings list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },

    // ==========================================
    // 8. SELLER - ORDERS & REVIEWS
    // ==========================================
    "/api/seller/orders": {
      get: {
        tags: ["Seller-Orders"],
        summary: "Live Orders & Order History",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] } }
        ],
        responses: {
          200: { description: "Orders list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/orders/{orderId}": {
      get: {
        tags: ["Seller-Orders"],
        summary: "Get Order Details",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Order details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      put: {
        tags: ["Seller-Orders"],
        summary: "Update Order Status",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED", "CANCELLED"] },
                  cancellationReason: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Order status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/seller/orders/{orderId}/assign": {
      post: {
        tags: ["Seller-Orders"],
        summary: "Assign Delivery Rider to Order",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["riderId"],
                properties: {
                  riderId: { type: "string", example: "rdr_102" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Rider assigned", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/reviews": {
      get: {
        tags: ["Seller-Orders"],
        summary: "Customer Reviews for Seller",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Reviews list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/reviews/{id}/reply": {
      post: {
        tags: ["Seller-Orders"],
        summary: "Reply to Customer Review",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reply"],
                properties: {
                  reply: { type: "string", example: "Thank you for the wonderful feedback! Looking forward to serving you again." }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Reply added", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },

    // ==========================================
    // 9. SELLER - DELIVERY FLEET MANAGEMENT
    // ==========================================
    "/api/seller/delivery": {
      get: {
        tags: ["Seller-Delivery"],
        summary: "List In-House Delivery Riders",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Riders roster", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      post: {
        tags: ["Seller-Delivery"],
        summary: "Add In-House Delivery Rider",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "phone", "email", "password"],
                properties: {
                  name: { type: "string", example: "Suresh Patil" },
                  phone: { type: "string", example: "9812345678" },
                  email: { type: "string", example: "suresh.rider@kitchen.com" },
                  password: { type: "string", example: "RiderPass123!" },
                  vehicleNumber: { type: "string", example: "MH-12-AB-1234" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Rider registered", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/delivery/{id}": {
      get: {
        tags: ["Seller-Delivery"],
        summary: "Get Rider Details & Balance",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Rider details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      put: {
        tags: ["Seller-Delivery"],
        summary: "Update Rider Status",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Rider updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/seller/delivery/{id}/collect": {
      post: {
        tags: ["Seller-Delivery"],
        summary: "Collect COD Cash from Rider",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount"],
                properties: {
                  amount: { type: "number", example: 1500 },
                  notes: { type: "string", example: "End of shift cash settlement" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Cash collected and balance adjusted", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/delivery/{id}/adjust": {
      post: {
        tags: ["Seller-Delivery"],
        summary: "Adjust Rider Balance (Incentive / Penalty)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount", "type"],
                properties: {
                  amount: { type: "number", example: 200 },
                  type: { type: "string", enum: ["CREDIT", "DEBIT"], example: "CREDIT" },
                  reason: { type: "string", example: "Fuel allowance" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Balance adjusted", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/delivery/{id}/transactions": {
      get: {
        tags: ["Seller-Delivery"],
        summary: "Rider Cash Ledger History",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Transactions ledger", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },

    // ==========================================
    // 10. SELLER - SUBSCRIPTIONS & BILLING
    // ==========================================
    "/api/seller/subscription/plans": {
      get: {
        tags: ["Seller-Subscriptions"],
        summary: "List Platform Subscription Plans",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "category", in: "query", schema: { type: "string", enum: ["FOOD", "PROPERTY", "BOTH"], example: "FOOD" } }
        ],
        responses: {
          200: { description: "Subscription plans list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/subscription/create-order": {
      post: {
        tags: ["Seller-Subscriptions"],
        summary: "Create Razorpay Subscription Order",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["planId"],
                properties: {
                  planId: { type: "string", example: "plan_food_monthly" },
                  couponCode: { type: "string", example: "GROW20" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Razorpay order initialized", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/subscription/verify": {
      post: {
        tags: ["Seller-Subscriptions"],
        summary: "Verify & Activate Subscription Plan",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature", "planId"],
                properties: {
                  razorpay_order_id: { type: "string" },
                  razorpay_payment_id: { type: "string" },
                  razorpay_signature: { type: "string" },
                  planId: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Subscription activated successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/seller/subscriptions/validate-coupon": {
      post: {
        tags: ["Seller-Subscriptions"],
        summary: "Validate Subscription Coupon",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["couponCode", "planId"],
                properties: {
                  couponCode: { type: "string", example: "SAVE50" },
                  planId: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Coupon validation result", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },

    // ==========================================
    // 11. DELIVERY RIDER APIS
    // ==========================================
    "/api/delivery/profile": {
      get: {
        tags: ["Delivery-Rider"],
        summary: "Rider Profile & Shift Status",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Rider profile", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      put: {
        tags: ["Delivery-Rider"],
        summary: "Update Rider Online / Duty Status",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  isAvailable: { type: "boolean", example: true },
                  currentLatitude: { type: "number", example: 18.5204 },
                  currentLongitude: { type: "number", example: 73.8567 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Rider status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/delivery/orders": {
      get: {
        tags: ["Delivery-Rider"],
        summary: "Assigned Delivery Orders",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["ASSIGNED", "PICKED_UP", "DELIVERED", "ALL"], default: "ALL" } }
        ],
        responses: {
          200: { description: "Assigned orders list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/delivery/orders/{id}": {
      get: {
        tags: ["Delivery-Rider"],
        summary: "Get Delivery Task Details",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Delivery order details with pickup and customer location", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      },
      put: {
        tags: ["Delivery-Rider"],
        summary: "Update Delivery Progress",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED"], example: "DELIVERED" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Delivery status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/delivery/orders/{id}/pay": {
      post: {
        tags: ["Delivery-Rider"],
        summary: "Record Customer COD Collection",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["collectedAmount"],
                properties: {
                  collectedAmount: { type: "number", example: 450 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Cash collection recorded", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },
    "/api/delivery/transactions": {
      get: {
        tags: ["Delivery-Rider"],
        summary: "Rider Earnings & COD Settlement History",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Rider transaction history", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },

    // ==========================================
    // 12. COUPONS & PROMOTIONS
    // ==========================================
    "/api/coupons": {
      get: {
        tags: ["Coupons-Discounts"],
        summary: "List Active Coupons",
        responses: { 200: { description: "Coupons list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } },
      },
      post: {
        tags: ["Coupons-Discounts"],
        summary: "Validate / Apply Coupon to Cart",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code", "cartTotal"],
                properties: {
                  code: { type: "string", example: "FIRST50" },
                  cartTotal: { type: "number", example: 400 }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Calculated discount amount", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/coupons/{id}": {
      get: {
        tags: ["Coupons-Discounts"],
        summary: "Get Coupon Details",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Coupon details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      put: {
        tags: ["Coupons-Discounts"],
        summary: "Update Coupon",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Coupon updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      delete: {
        tags: ["Coupons-Discounts"],
        summary: "Delete Coupon",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Coupon deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },

    // ==========================================
    // 13. REFUNDS & DISPUTES
    // ==========================================
    "/api/refunds": {
      get: {
        tags: ["Refunds-Disputes"],
        summary: "List Refund Requests",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Refund requests", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } },
      },
      post: {
        tags: ["Refunds-Disputes"],
        summary: "Raise Order Refund Request",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["orderId", "reason"],
                properties: {
                  orderId: { type: "string" },
                  reason: { type: "string", example: "Order arrived cold / spilled" }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Refund ticket created", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/refunds/{id}": {
      get: {
        tags: ["Refunds-Disputes"],
        summary: "Get Refund Details",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Refund details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      put: {
        tags: ["Refunds-Disputes"],
        summary: "Update Refund Status",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Refund updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },

    // ==========================================
    // 14. HELPDESK & SUPPORT TICKETS
    // ==========================================
    "/api/tickets": {
      get: {
        tags: ["Support-Tickets"],
        summary: "List User Support Tickets",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Tickets list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } },
      },
      post: {
        tags: ["Support-Tickets"],
        summary: "Create Support Ticket",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["subject", "category", "message"],
                properties: {
                  subject: { type: "string", example: "Issue with order delivery" },
                  category: { type: "string", enum: ["ORDER", "PAYMENT", "ACCOUNT", "GENERAL"], example: "ORDER" },
                  message: { type: "string", example: "Rider did not deliver items." }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Ticket created", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/tickets/{id}": {
      get: {
        tags: ["Support-Tickets"],
        summary: "Get Ticket Conversation Details",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Ticket details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      put: {
        tags: ["Support-Tickets"],
        summary: "Update Ticket Status",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Ticket status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/tickets/{id}/messages": {
      get: {
        tags: ["Support-Tickets"],
        summary: "Get Ticket Messages",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Messages list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      post: {
        tags: ["Support-Tickets"],
        summary: "Send Message in Support Ticket",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string", example: "Providing additional details..." }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Message sent", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },

    // ==========================================
    // 15. FURNITURE INQUIRIES
    // ==========================================
    "/api/furniture/query": {
      post: {
        tags: ["Furniture-Inquiries"],
        summary: "Submit Furniture Rental Enquiry",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "phone", "requirement"],
                properties: {
                  name: { type: "string", example: "Aman Sharma" },
                  phone: { type: "string", example: "9876543210" },
                  email: { type: "string", example: "aman@example.com" },
                  requirement: { type: "string", example: "Need double bed, study table and 2 chairs for 6 months." }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Enquiry logged", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } }
        }
      }
    },

    // ==========================================
    // 16. ADMIN & SUPERADMIN APIS
    // ==========================================
    "/api/admin/dashboard": {
      get: {
        tags: ["Admin-Superadmin"],
        summary: "Operations Admin Dashboard",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Operations dashboard metrics", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/admin/registrations": {
      get: {
        tags: ["Admin-Superadmin"],
        summary: "Pending Seller Registrations Queue",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Pending seller registrations", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/superadmin/dashboard": {
      get: {
        tags: ["Admin-Superadmin"],
        summary: "Superadmin Executive Dashboard",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Platform GMV, active sellers, total riders", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/superadmin/approvals": {
      get: {
        tags: ["Admin-Superadmin"],
        summary: "List Pending Merchant Approvals",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Approvals queue", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/superadmin/approvals/{type}/{id}": {
      put: {
        tags: ["Admin-Superadmin"],
        summary: "Approve / Reject / Request Revision for Seller",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string", enum: ["FOOD", "PROPERTY", "SELLER"] } },
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["APPROVED", "REJECTED", "REVISION"] },
                  note: { type: "string", example: "FSSAI license verified successfully" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Approval status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/superadmin/sellers": {
      get: {
        tags: ["Admin-Superadmin"],
        summary: "List All Merchants on Platform",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Sellers list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/superadmin/sellers/{sellerId}": {
      get: {
        tags: ["Admin-Superadmin"],
        summary: "Get Detailed Seller Account",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "sellerId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Seller details", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      put: {
        tags: ["Admin-Superadmin"],
        summary: "Update / Block / Verify Seller Account",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "sellerId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Seller updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/superadmin/plans": {
      get: {
        tags: ["Admin-Superadmin"],
        summary: "List Platform Subscription Plans",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Plans list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } },
      },
      post: {
        tags: ["Admin-Superadmin"],
        summary: "Create Platform Subscription Plan Tier",
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 201: { description: "Plan created", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/superadmin/plans/{id}": {
      put: {
        tags: ["Admin-Superadmin"],
        summary: "Update Subscription Plan",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Plan updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      delete: {
        tags: ["Admin-Superadmin"],
        summary: "Delete Subscription Plan",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Plan deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/superadmin/settings": {
      get: {
        tags: ["Admin-Superadmin"],
        summary: "Get Global System Settings",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Platform settings", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      },
      put: {
        tags: ["Admin-Superadmin"],
        summary: "Update Global System Settings",
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Settings updated", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/superadmin/users": {
      get: {
        tags: ["Admin-Superadmin"],
        summary: "List All Users",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Users list", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    },
    "/api/superadmin/users/{id}/activity": {
      get: {
        tags: ["Admin-Superadmin"],
        summary: "Get User Activity & Order History",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "User activity ledger", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } } }
      }
    }
  }
};
