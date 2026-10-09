/**
 * Complete OpenAPI 3.0.3 Specification for Neo Cloud Kitchen & Room Rental API
 * Includes full Bearer Token authorization and all 100+ backend endpoints.
 */

export const swaggerSpec = {
  "openapi": "3.0.3",
  "info": {
    "title": "Neo Cloud Kitchen & Room Rental API",
    "version": "1.0.0",
    "description": "\n## 🚀 Mobile & Frontend Developer API Interactive Documentation\n\nWelcome to the **Neo Cloud Kitchen & Room Rental REST API Console**.\n\n### 🔐 How to Test Authorized Endpoints:\n1. First, call **`POST /api/auth/login`** with your credentials (or **`POST /api/auth/register`** to create a new user/seller/rider).\n2. Copy the **`token`** value from the response: `\"eyJhbGciOiJIUzI1NiIsInR5cCI6...\"`.\n3. Click the green **`Authorize 🔓`** button at the top-right of this page.\n4. Paste the token into the **Value** field and click **Authorize**. *(You can paste just the token, or format it as `Bearer <token>`)*.\n5. Click **Close**. All authorized endpoints will now automatically send the `Authorization: Bearer <token>` header with every request!\n    ",
    "contact": {
      "name": "Neo Cloud Kitchen Engineering Team",
      "email": "support@neocloudroom.com"
    }
  },
  "servers": [
    {
      "url": "/",
      "description": "Current Server (Auto-detects Localhost, LAN IP, or Domain)"
    },
    {
      "url": "http://localhost:5000",
      "description": "Localhost Development Server"
    }
  ],
  "tags": [
    {
      "name": "Authentication",
      "description": "Registration and login endpoints for Customers, Sellers, and Riders"
    },
    {
      "name": "Public-Discovery",
      "description": "Public storefront, search, explore, categories, rooms, and banners"
    },
    {
      "name": "Customer-User",
      "description": "User profile, delivery addresses, orders, payments, reviews, and bookings"
    },
    {
      "name": "Seller-Profile",
      "description": "Seller profile, store online/offline switch, overview stats, and offers"
    },
    {
      "name": "Seller-Food-Menu",
      "description": "Dishes, categories, pricing, stock availability, and delivery pincodes"
    },
    {
      "name": "Seller-Meal-Plans",
      "description": "Recurring weekly/monthly meal plans"
    },
    {
      "name": "Seller-Rooms",
      "description": "Room listings, photos, amenities, pricing, and tenant bookings"
    },
    {
      "name": "Seller-Orders",
      "description": "Live order processing, rider assignment, and customer review responses"
    },
    {
      "name": "Seller-Delivery",
      "description": "In-house delivery rider roster, cash collection (COD), and ledger"
    },
    {
      "name": "Seller-Subscriptions",
      "description": "Platform subscription tiers, Razorpay payment verification, and coupons"
    },
    {
      "name": "Seller-Notifications",
      "description": "Real-time order alerts, inventory notifications, system messages, preferences, and counter badges"
    },
    {
      "name": "Delivery-Rider",
      "description": "Rider task dashboard, route details, COD collection, and transactions"
    },
    {
      "name": "Coupons-Discounts",
      "description": "Discount coupon validation and management"
    },
    {
      "name": "Refunds-Disputes",
      "description": "Order cancellation and refund tracking"
    },
    {
      "name": "Support-Tickets",
      "description": "Support tickets and messaging threads"
    },
    {
      "name": "Furniture-Inquiries",
      "description": "Custom furniture rental enquiries"
    },
    {
      "name": "Admin-Superadmin",
      "description": "Platform administration, approvals, categories, sellers, and system settings"
    },
    {
      "name": "Customer-Meal-Subscriptions",
      "description": "Customer recurring meal plan subscriptions, start date options, pause/resume, and address management"
    },
    {
      "name": "App-Feedback",
      "description": "Mobile and web customer app ratings and feedback"
    }
  ],
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Enter your Bearer JWT token from POST /api/auth/login or POST /api/auth/register."
      }
    },
    "schemas": {
      "StandardResponse": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "example": true
          },
          "data": {
            "type": "object"
          },
          "message": {
            "type": "string",
            "example": "Operation successful"
          },
          "statusCode": {
            "type": "integer",
            "example": 200
          }
        }
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "example": false
          },
          "error": {
            "type": "string",
            "example": "Error message description"
          },
          "statusCode": {
            "type": "integer",
            "example": 400
          }
        }
      },
      "LoginRequest": {
        "type": "object",
        "required": [
          "email",
          "password"
        ],
        "properties": {
          "email": {
            "type": "string",
            "format": "email",
            "example": "seller@example.com"
          },
          "password": {
            "type": "string",
            "example": "SecurePassword123!"
          }
        }
      },
      "CustomerRegisterRequest": {
        "type": "object",
        "required": [
          "name",
          "email",
          "password",
          "role"
        ],
        "properties": {
          "name": {
            "type": "string",
            "example": "Aman Sharma"
          },
          "email": {
            "type": "string",
            "format": "email",
            "example": "aman@example.com"
          },
          "phone": {
            "type": "string",
            "example": "9876543210"
          },
          "password": {
            "type": "string",
            "example": "SecurePassword123!"
          },
          "role": {
            "type": "string",
            "enum": [
              "USER",
              "SELLER",
              "DELIVERY"
            ],
            "example": "USER"
          },
          "city": {
            "type": "string",
            "example": "Pune"
          },
          "pincode": {
            "type": "string",
            "example": "411001"
          }
        }
      },
      "SellerRegisterRequest": {
        "type": "object",
        "required": [
          "name",
          "email",
          "password",
          "businessName",
          "sellerType"
        ],
        "properties": {
          "name": {
            "type": "string",
            "example": "Rohan Mehra"
          },
          "email": {
            "type": "string",
            "format": "email",
            "example": "rohan@kitchen.com"
          },
          "phone": {
            "type": "string",
            "example": "9876543210"
          },
          "password": {
            "type": "string",
            "example": "SecurePassword123!"
          },
          "role": {
            "type": "string",
            "example": "SELLER"
          },
          "sellerType": {
            "type": "string",
            "enum": [
              "FOOD",
              "PROPERTY",
              "BOTH"
            ],
            "example": "FOOD"
          },
          "businessName": {
            "type": "string",
            "example": "Spice Symphony Cloud Kitchen"
          },
          "foodType": {
            "type": "string",
            "enum": [
              "BOTH",
              "PURE_VEG",
              "NON_VEG"
            ],
            "example": "BOTH"
          },
          "city": {
            "type": "string",
            "example": "Pune"
          },
          "pincode": {
            "type": "string",
            "example": "411038"
          },
          "addressArea": {
            "type": "string",
            "example": "Kothrud, Pune"
          },
          "addressFlat": {
            "type": "string",
            "example": "Shop 12, Floor 1"
          },
          "latitude": {
            "type": "number",
            "format": "float",
            "example": 18.5074,
            "description": "Accurate GPS Latitude for delivery routing"
          },
          "longitude": {
            "type": "number",
            "format": "float",
            "example": 73.8077,
            "description": "Accurate GPS Longitude for delivery routing"
          },
          "isLocationPinned": {
            "type": "boolean",
            "example": true
          }
        }
      }
    }
  },
  "paths": {
    "/api/auth/login": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "User / Seller / Rider Login",
        "description": "Authenticates user credentials and returns a JWT Bearer token valid for 30 days.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Login successful with JWT token",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "token": {
                          "type": "string",
                          "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        },
                        "user": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string",
                              "example": "usr_12345"
                            },
                            "name": {
                              "type": "string",
                              "example": "Aman Sharma"
                            },
                            "email": {
                              "type": "string",
                              "example": "aman@example.com"
                            },
                            "role": {
                              "type": "string",
                              "example": "USER"
                            }
                          }
                        }
                      }
                    },
                    "message": {
                      "type": "string",
                      "example": "Login successful"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Invalid email or password",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/token-session": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Sync Mobile Token to Web Session",
        "description": "Validates a mobile JWT authentication token and establishes the browser NextAuth session cookie.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "token": {
                    "type": "string",
                    "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Session authenticated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          },
          "401": {
            "description": "Invalid or expired token",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      },
      "get": {
        "tags": [
          "Authentication"
        ],
        "summary": "Verify Token & Session",
        "description": "Validates a mobile JWT authentication token passed in query parameter or Bearer header.",
        "parameters": [
          {
            "name": "token",
            "in": "query",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Session authenticated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          },
          "401": {
            "description": "Invalid or expired token",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/register": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "User / Seller / Rider Registration",
        "description": "Registers a new customer (JSON) or seller/rider with KYC documents and GPS delivery pin coordinates (JSON or multipart/form-data).",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "oneOf": [
                  {
                    "$ref": "#/components/schemas/CustomerRegisterRequest"
                  },
                  {
                    "$ref": "#/components/schemas/SellerRegisterRequest"
                  }
                ]
              }
            },
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "example": "Rohan Mehra"
                  },
                  "email": {
                    "type": "string",
                    "example": "seller@example.com"
                  },
                  "phone": {
                    "type": "string",
                    "example": "9876543210"
                  },
                  "password": {
                    "type": "string",
                    "example": "SecurePassword123!"
                  },
                  "role": {
                    "type": "string",
                    "example": "SELLER"
                  },
                  "sellerType": {
                    "type": "string",
                    "enum": [
                      "FOOD",
                      "PROPERTY",
                      "BOTH"
                    ],
                    "example": "FOOD"
                  },
                  "businessName": {
                    "type": "string",
                    "example": "Spice Symphony Kitchen"
                  },
                  "foodType": {
                    "type": "string",
                    "enum": [
                      "BOTH",
                      "PURE_VEG",
                      "NON_VEG"
                    ],
                    "example": "BOTH"
                  },
                  "city": {
                    "type": "string",
                    "example": "Pune"
                  },
                  "pincode": {
                    "type": "string",
                    "example": "411038"
                  },
                  "addressArea": {
                    "type": "string",
                    "example": "Kothrud, Pune"
                  },
                  "latitude": {
                    "type": "number",
                    "example": 18.5074
                  },
                  "longitude": {
                    "type": "number",
                    "example": 73.8077
                  },
                  "isLocationPinned": {
                    "type": "boolean",
                    "example": true
                  },
                  "adhaarFrontFile": {
                    "type": "string",
                    "format": "binary"
                  },
                  "adhaarBackFile": {
                    "type": "string",
                    "format": "binary"
                  },
                  "fssaiFile": {
                    "type": "string",
                    "format": "binary"
                  },
                  "lightBillFile": {
                    "type": "string",
                    "format": "binary"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Registration successful",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "user": {
                          "type": "object"
                        },
                        "sellerProfile": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string"
                            },
                            "trackingId": {
                              "type": "string",
                              "example": "SHOP-772910"
                            },
                            "businessName": {
                              "type": "string",
                              "example": "Spice Symphony Kitchen"
                            },
                            "latitude": {
                              "type": "number",
                              "example": 18.5074
                            },
                            "longitude": {
                              "type": "number",
                              "example": 73.8077
                            },
                            "isLocationPinned": {
                              "type": "boolean",
                              "example": true
                            },
                            "verificationStatus": {
                              "type": "string",
                              "example": "PENDING"
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
          "400": {
            "description": "Validation error or duplicate user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/session": {
      "get": {
        "tags": [
          "Authentication"
        ],
        "summary": "Get Active Session (Web NextAuth)",
        "description": "Returns active user session when authenticated via NextAuth browser cookie or Bearer token.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Active session object",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "name": {
                          "type": "string"
                        },
                        "email": {
                          "type": "string"
                        },
                        "role": {
                          "type": "string"
                        }
                      }
                    },
                    "expires": {
                      "type": "string",
                      "format": "date-time"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/csrf": {
      "get": {
        "tags": [
          "Authentication"
        ],
        "summary": "Get CSRF Token (Web NextAuth)",
        "description": "Returns the anti-CSRF token required by NextAuth for browser-based form logins.",
        "responses": {
          "200": {
            "description": "CSRF token response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "csrfToken": {
                      "type": "string",
                      "example": "9f8a3b2c1e..."
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/providers": {
      "get": {
        "tags": [
          "Authentication"
        ],
        "summary": "List Auth Providers (Web NextAuth)",
        "description": "Returns configured NextAuth authentication providers (e.g., credentials).",
        "responses": {
          "200": {
            "description": "Providers list",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "credentials": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "example": "credentials"
                        },
                        "name": {
                          "type": "string",
                          "example": "Credentials"
                        },
                        "type": {
                          "type": "string",
                          "example": "credentials"
                        }
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
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "NextAuth Browser Credentials Login",
        "description": "Browser NextAuth credentials endpoint. Validates email & password, establishes HTTP-only session cookie for the web frontend.",
        "requestBody": {
          "required": true,
          "content": {
            "application/x-www-form-urlencoded": {
              "schema": {
                "type": "object",
                "required": [
                  "email",
                  "password",
                  "csrfToken"
                ],
                "properties": {
                  "email": {
                    "type": "string",
                    "example": "seller@example.com"
                  },
                  "password": {
                    "type": "string",
                    "example": "SecurePassword123!"
                  },
                  "csrfToken": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Logged in and session cookie set"
          },
          "401": {
            "description": "Invalid credentials"
          }
        }
      }
    },
    "/api/auth/signout": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Sign Out (Web NextAuth)",
        "description": "Clears active NextAuth session cookies in the browser.",
        "responses": {
          "200": {
            "description": "Session cleared successfully"
          }
        }
      }
    },
    "/api/public/explore": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "Explore Hub (Home Screen)",
        "description": "Returns trending kitchens, featured meal plans, popular rooms, and promo banners.",
        "responses": {
          "200": {
            "description": "Explore feed data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/public/search": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "Global Search",
        "description": "Search across menu dishes, cuisines, kitchens, and room rentals.",
        "parameters": [
          {
            "name": "q",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "example": "Biryani"
            }
          },
          {
            "name": "type",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": [
                "FOOD",
                "ROOM",
                "ALL"
              ],
              "default": "ALL"
            }
          },
          {
            "name": "city",
            "in": "query",
            "schema": {
              "type": "string",
              "example": "Pune"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Search results",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/public/categories": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "List Food Categories",
        "description": "Retrieves all active food categories and subcategories.",
        "responses": {
          "200": {
            "description": "Category list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/public/coupons": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "Public Promotional Coupons",
        "description": "Returns active discount coupons for food and room bookings.",
        "responses": {
          "200": {
            "description": "Coupons list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/public/meal-plans": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "Public Meal Plans",
        "description": "Lists active recurring subscription meal plans from all verified kitchens.",
        "responses": {
          "200": {
            "description": "Meal plans list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/public/rooms": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "Discover Rooms & Properties",
        "description": "Search available rooms with filters (city, type, price range, furnishing).",
        "parameters": [
          {
            "name": "city",
            "in": "query",
            "schema": {
              "type": "string",
              "example": "Pune"
            }
          },
          {
            "name": "minPrice",
            "in": "query",
            "schema": {
              "type": "number"
            }
          },
          {
            "name": "maxPrice",
            "in": "query",
            "schema": {
              "type": "number"
            }
          },
          {
            "name": "furnishing",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": [
                "FURNISHED",
                "SEMI_FURNISHED",
                "UNFURNISHED"
              ]
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Rooms listing",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/public/rooms/{id}": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "Room Details",
        "description": "Get comprehensive details for a room listing including amenities, photos, and landlord info.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Room details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/public/rooms/{id}/availability": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "Check Room Availability",
        "description": "Checks if a room is available for specified check-in and check-out dates.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date",
              "example": "2026-10-01"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date",
              "example": "2026-10-31"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Availability result",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/public/shop/{trackingId}": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "Storefront Menu & Details",
        "description": "Retrieves complete store profile, active dishes, ratings, and address by tracking ID.",
        "parameters": [
          {
            "name": "trackingId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "SHOP-772910"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Storefront details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/public/promo-banners": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "Promotional Carousel Banners",
        "description": "Returns active hero promo banners for the mobile app home screen.",
        "responses": {
          "200": {
            "description": "Promo banners list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/public/popup-banners": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "Popup Modal Banners",
        "description": "Returns active splash and modal popup alerts.",
        "responses": {
          "200": {
            "description": "Popup banners list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/profile": {
      "get": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Get User Profile",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "User profile",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Update User Profile",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "example": "Aman Sharma"
                  },
                  "phone": {
                    "type": "string",
                    "example": "9876543210"
                  },
                  "city": {
                    "type": "string",
                    "example": "Pune"
                  },
                  "pincode": {
                    "type": "string",
                    "example": "411001"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Updated profile",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/dashboard": {
      "get": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Customer Dashboard Summary",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Dashboard summary",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/addresses": {
      "get": {
        "tags": [
          "Customer-User"
        ],
        "summary": "List Saved Addresses",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Addresses list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Add New Delivery Address",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "addressFlat",
                  "addressArea",
                  "city",
                  "pincode"
                ],
                "properties": {
                  "addressFlat": {
                    "type": "string",
                    "example": "Flat 302, Royal Palms"
                  },
                  "addressArea": {
                    "type": "string",
                    "example": "Viman Nagar"
                  },
                  "addressLandmark": {
                    "type": "string",
                    "example": "Near Phoenix Marketcity"
                  },
                  "city": {
                    "type": "string",
                    "example": "Pune"
                  },
                  "pincode": {
                    "type": "string",
                    "example": "411014"
                  },
                  "type": {
                    "type": "string",
                    "enum": [
                      "HOME",
                      "WORK",
                      "OTHER"
                    ],
                    "default": "HOME"
                  },
                  "isDefault": {
                    "type": "boolean",
                    "default": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Address added",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/addresses/{id}": {
      "put": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Update Address",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Address updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Delete Address",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Address deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/addresses/{id}/default": {
      "put": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Set Default Address",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Default address updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Set Default Delivery Address (PATCH)",
        "description": "Sets the selected delivery address as the user's default address for one-click checkout.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "addr_123"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Default address set successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/location": {
      "get": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Get Current GPS Location",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "User location",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Save GPS Coordinates",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "latitude",
                  "longitude"
                ],
                "properties": {
                  "latitude": {
                    "type": "number",
                    "example": 18.5204
                  },
                  "longitude": {
                    "type": "number",
                    "example": 73.8567
                  },
                  "address": {
                    "type": "string",
                    "example": "FC Road, Shivajinagar, Pune"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Location saved",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/orders": {
      "get": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Customer Orders History",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Orders list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Place Food Order",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "sellerId",
                  "items",
                  "deliveryAddressId",
                  "paymentMethod"
                ],
                "properties": {
                  "sellerId": {
                    "type": "string",
                    "example": "sel_123"
                  },
                  "items": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "menuItemId": {
                          "type": "string",
                          "example": "item_001"
                        },
                        "quantity": {
                          "type": "integer",
                          "example": 2
                        },
                        "price": {
                          "type": "number",
                          "example": 220
                        }
                      }
                    }
                  },
                  "deliveryAddress": {
                    "type": "string",
                    "example": "Flat 302, Royal Palms, Pune - 411014"
                  },
                  "customerPhone": {
                    "type": "string",
                    "example": "9876543210"
                  },
                  "paymentMethod": {
                    "type": "string",
                    "enum": [
                      "COD",
                      "ONLINE"
                    ],
                    "example": "ONLINE"
                  },
                  "appliedCouponId": {
                    "type": "string",
                    "example": "cpm_xyz123"
                  },
                  "razorpay_order_id": {
                    "type": "string",
                    "example": "order_Kxyz123",
                    "description": "Required when paymentMethod is ONLINE"
                  },
                  "razorpay_payment_id": {
                    "type": "string",
                    "example": "pay_Kabc456",
                    "description": "Required when paymentMethod is ONLINE"
                  },
                  "razorpay_signature": {
                    "type": "string",
                    "example": "e9a0...32f",
                    "description": "Required when paymentMethod is ONLINE"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Order created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/orders/{id}": {
      "get": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Track Single Order",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Order details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Cancel User Order (Auto-Refund for Paid Orders)",
        "description": "Cancels an order placed by the user if it is in PENDING or PLACED status (before the kitchen begins food preparation). If the cancelled order was paid online, the system automatically creates a refund request in the Superadmin refund management queue with an informative auto-submission message.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "ord_12345"
            },
            "description": "Order ID to cancel"
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "ticketId": {
                    "type": "string",
                    "example": "tkt_9876",
                    "description": "Optional support ticket ID associated with the cancellation"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Order cancelled successfully and auto-refund initiated if paid",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Order cancelled successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "example": "ord_12345"
                        },
                        "status": {
                          "type": "string",
                          "example": "CANCELLED"
                        },
                        "isPaid": {
                          "type": "boolean",
                          "example": true
                        },
                        "refund": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string",
                              "example": "ref_5566"
                            },
                            "amount": {
                              "type": "number",
                              "example": 350
                            },
                            "status": {
                              "type": "string",
                              "example": "PROCESSING"
                            },
                            "reason": {
                              "type": "string",
                              "example": "Order #ord_12345 was cancelled by customer prior to preparation. Auto-submitted for refund processing."
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
          "400": {
            "description": "Order cannot be cancelled (e.g. already preparing or delivered)",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Order not found"
          }
        }
      }
    },
    "/api/user/orders/initiate-payment": {
      "post": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Initiate Razorpay Online Payment for Order",
        "description": "Initializes a Razorpay order before placing the final order in the database. Returns razorpayOrderId and amount.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "totalAmount"
                ],
                "properties": {
                  "totalAmount": {
                    "type": "number",
                    "example": 300
                  },
                  "sellerId": {
                    "type": "string",
                    "example": "sel_123"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Razorpay order initialized",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "razorpayOrderId": {
                          "type": "string",
                          "example": "order_Kxyz123"
                        },
                        "amount": {
                          "type": "number",
                          "example": 30000
                        },
                        "currency": {
                          "type": "string",
                          "example": "INR"
                        },
                        "keyId": {
                          "type": "string",
                          "example": "rzp_test_TX4MPQgJuetMFP"
                        }
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
    "/api/user/orders/verify": {
      "post": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Verify Razorpay Payment for Order",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "razorpay_order_id",
                  "razorpay_payment_id",
                  "razorpay_signature",
                  "orderId"
                ],
                "properties": {
                  "razorpay_order_id": {
                    "type": "string"
                  },
                  "razorpay_payment_id": {
                    "type": "string"
                  },
                  "razorpay_signature": {
                    "type": "string"
                  },
                  "orderId": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Payment verified and order confirmed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/orders/stream": {
      "get": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Live Real-Time Order Stream (Server-Sent Events / SSE)",
        "description": "Establishes a real-time event stream (`text/event-stream`) to receive instant push updates when user orders are accepted, preparing, out for delivery, delivered, or cancelled without polling.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Active SSE stream emitting 'order' and 'connected' events",
            "content": {
              "text/event-stream": {
                "schema": {
                  "type": "string",
                  "example": "event: order\ndata: {\"event\":\"ORDER_UPDATED\",\"orderId\":\"ord_123\",\"status\":\"OUT_FOR_DELIVERY\"}\n\n"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/api/user/orders/{id}/review": {
      "post": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Review Food Order",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "rating"
                ],
                "properties": {
                  "rating": {
                    "type": "number",
                    "minimum": 1,
                    "maximum": 5,
                    "example": 5
                  },
                  "review": {
                    "type": "string",
                    "example": "Delicious authentic biryani, fast delivery!"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Review submitted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "get": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Get Order Review & Ratings",
        "description": "Retrieves submitted overall review, star rating, and individual item ratings for a completed food order.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "ord_12345"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Review details",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "rating": {
                          "type": "number",
                          "example": 5
                        },
                        "comment": {
                          "type": "string",
                          "example": "Amazing food quality and super fast delivery!"
                        },
                        "itemRatings": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "menuItemId": {
                                "type": "string",
                                "example": "item_123"
                              },
                              "rating": {
                                "type": "number",
                                "example": 5
                              },
                              "comment": {
                                "type": "string",
                                "example": "Perfect spicy flavor"
                              }
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
          "404": {
            "description": "Review not found"
          }
        }
      }
    },
    "/api/user/bookings": {
      "get": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Customer Room Bookings",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Bookings list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Create Room Booking",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "roomId",
                  "startDate",
                  "endDate"
                ],
                "properties": {
                  "roomId": {
                    "type": "string"
                  },
                  "startDate": {
                    "type": "string",
                    "format": "date",
                    "example": "2026-10-01"
                  },
                  "endDate": {
                    "type": "string",
                    "format": "date",
                    "example": "2026-10-31"
                  },
                  "guestsCount": {
                    "type": "integer",
                    "default": 1
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Booking created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/bookings/{id}/pay": {
      "post": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Initiate Booking Payment",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Razorpay order initialized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/bookings/{id}/verify": {
      "post": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Verify Booking Payment",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Booking confirmed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/profile": {
      "get": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Get Merchant Profile",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Seller profile data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Update Merchant Profile",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "businessName": {
                    "type": "string",
                    "example": "Spice Symphony Cloud Hub"
                  },
                  "phone": {
                    "type": "string",
                    "example": "9876543210"
                  },
                  "city": {
                    "type": "string",
                    "example": "Pune"
                  },
                  "pincode": {
                    "type": "string",
                    "example": "411038"
                  },
                  "infoAddress": {
                    "type": "string",
                    "example": "Kothrud, Pune"
                  },
                  "latitude": {
                    "type": "number",
                    "example": 18.5074
                  },
                  "longitude": {
                    "type": "number",
                    "example": 73.8077
                  },
                  "isLocationPinned": {
                    "type": "boolean",
                    "example": true
                  },
                  "upiId": {
                    "type": "string",
                    "example": "merchant@okhdfcbank"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Profile updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Initialize Seller Profile (POST)",
        "description": "Initializes a new merchant profile record.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Seller profile initialized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Partial Update Seller Profile (PATCH)",
        "description": "Updates specific merchant profile fields such as contact phone, business address, GPS pin.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Seller profile updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/profile/status": {
      "get": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Get Store Online/Offline Switch",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Online status",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Toggle Store Online/Offline",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "isOnline"
                ],
                "properties": {
                  "isOnline": {
                    "type": "boolean",
                    "example": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Online status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/profile/{id}": {
      "get": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Fetch Public Merchant Profile by ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Seller details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/dashboard/overview": {
      "get": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Seller Dashboard Analytics Overview",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Dashboard metrics (sales, active orders, ratings)",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/dashboard/status": {
      "get": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Seller Verification & Subscriptions Status",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Active subscriptions, stacked validity dates, category verification status",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/dashboard/offers": {
      "get": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "List Store Custom Offers",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Offers list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Create Store Custom Offer",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "title",
                  "discountPercentage",
                  "minOrderValue"
                ],
                "properties": {
                  "title": {
                    "type": "string",
                    "example": "Flat 20% Off"
                  },
                  "discountPercentage": {
                    "type": "number",
                    "example": 20
                  },
                  "minOrderValue": {
                    "type": "number",
                    "example": 300
                  },
                  "maxDiscountAmount": {
                    "type": "number",
                    "example": 60
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Offer created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Update Store Offer (PUT)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Offer updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Delete Store Offer (DELETE)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Offer deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/dashboard/offers/{id}": {
      "put": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Update Store Offer",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Offer updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Delete Store Offer",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Offer deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/reapply": {
      "get": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Get Reapplication & Verification Details",
        "description": "Retrieve the current seller verification status, admin rejection notes/remarks, and existing uploaded documents to display in the mobile reapply screen.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Reapplication details retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Seller application reapply/revision details retrieved successfully."
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "example": "cm123abc456"
                        },
                        "businessName": {
                          "type": "string",
                          "example": "Spice Delight Cloud Kitchen"
                        },
                        "businessCategory": {
                          "type": "string",
                          "enum": [
                            "FOOD",
                            "PROPERTY",
                            "BOTH"
                          ],
                          "example": "FOOD"
                        },
                        "verificationStatus": {
                          "type": "string",
                          "enum": [
                            "PENDING",
                            "APPROVED",
                            "REJECTED",
                            "REVISION"
                          ],
                          "example": "REJECTED"
                        },
                        "verificationNote": {
                          "type": "string",
                          "example": "FSSAI certificate is blurry and light bill is older than 3 months. Please re-upload clear copies."
                        },
                        "foodVerificationStatus": {
                          "type": "string",
                          "enum": [
                            "PENDING",
                            "APPROVED",
                            "REJECTED"
                          ],
                          "example": "REJECTED"
                        },
                        "propertyVerificationStatus": {
                          "type": "string",
                          "enum": [
                            "PENDING",
                            "APPROVED",
                            "REJECTED"
                          ],
                          "example": "PENDING"
                        },
                        "addressLocality": {
                          "type": "string",
                          "example": "Shop 4, Kothrud, Pune - 411038"
                        },
                        "adhaarUrl": {
                          "type": "string",
                          "example": "https://res.cloudinary.com/demo/image/upload/v1/adhaar.jpg"
                        },
                        "fssaiUrl": {
                          "type": "string",
                          "example": "https://res.cloudinary.com/demo/image/upload/v1/fssai.pdf"
                        },
                        "lightBillUrl": {
                          "type": "string",
                          "example": "https://res.cloudinary.com/demo/image/upload/v1/lightbill.jpg"
                        },
                        "passbookUrl": {
                          "type": "string",
                          "example": "https://res.cloudinary.com/demo/image/upload/v1/passbook.jpg"
                        },
                        "kitchenImages": {
                          "type": "array",
                          "items": {
                            "type": "string"
                          },
                          "example": [
                            "https://res.cloudinary.com/demo/image/upload/v1/k1.jpg"
                          ]
                        },
                        "cuisineImages": {
                          "type": "array",
                          "items": {
                            "type": "string"
                          },
                          "example": [
                            "https://res.cloudinary.com/demo/image/upload/v1/c1.jpg"
                          ]
                        },
                        "roomImages": {
                          "type": "array",
                          "items": {
                            "type": "string"
                          },
                          "example": []
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized - SELLER session required"
          },
          "404": {
            "description": "Seller profile not found"
          }
        }
      },
      "post": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Reapply / Resubmit Seller Application (Multipart Form-Data)",
        "description": "Allows a seller whose application was REJECTED or requested for REVISION to re-upload required documents, update address/business name, and re-submit for admin verification.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "businessName": {
                    "type": "string",
                    "description": "Updated Business Name",
                    "example": "Spice Delight Cloud Kitchen"
                  },
                  "businessAddress": {
                    "type": "string",
                    "description": "Updated Business Address",
                    "example": "Shop 4, Green Avenue, Kothrud, Pune"
                  },
                  "adhaarFrontFile": {
                    "type": "string",
                    "format": "binary",
                    "description": "Aadhaar Card Front Photo"
                  },
                  "adhaarBackFile": {
                    "type": "string",
                    "format": "binary",
                    "description": "Aadhaar Card Back Photo"
                  },
                  "adhaarFile": {
                    "type": "string",
                    "format": "binary",
                    "description": "Identity / PAN Card document fallback"
                  },
                  "fssaiFile": {
                    "type": "string",
                    "format": "binary",
                    "description": "FSSAI Certificate (Mandatory for Food)"
                  },
                  "lightBillFile": {
                    "type": "string",
                    "format": "binary",
                    "description": "Electricity / Utility Bill"
                  },
                  "passbookFile": {
                    "type": "string",
                    "format": "binary",
                    "description": "Bank Passbook / Cancelled Cheque"
                  },
                  "kitchenImage_0": {
                    "type": "string",
                    "format": "binary",
                    "description": "Kitchen Photo 1"
                  },
                  "kitchenImage_1": {
                    "type": "string",
                    "format": "binary",
                    "description": "Kitchen Photo 2"
                  },
                  "cuisineImage_0": {
                    "type": "string",
                    "format": "binary",
                    "description": "Cuisine/Dish Photo 1"
                  },
                  "cuisineImage_1": {
                    "type": "string",
                    "format": "binary",
                    "description": "Cuisine/Dish Photo 2"
                  },
                  "roomImage_0": {
                    "type": "string",
                    "format": "binary",
                    "description": "Room/Property Photo 1 (for Property/Both)"
                  },
                  "roomImage_1": {
                    "type": "string",
                    "format": "binary",
                    "description": "Room/Property Photo 2 (for Property/Both)"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Application resubmitted successfully. Verification status set to PENDING.",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Seller application re-submitted successfully! Your application is now under review."
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "example": "cm123abc456"
                        },
                        "businessName": {
                          "type": "string",
                          "example": "Spice Delight Cloud Kitchen"
                        },
                        "verificationStatus": {
                          "type": "string",
                          "example": "PENDING"
                        },
                        "verificationNote": {
                          "type": "string",
                          "nullable": true,
                          "example": null
                        },
                        "foodVerificationStatus": {
                          "type": "string",
                          "example": "PENDING"
                        },
                        "propertyVerificationStatus": {
                          "type": "string",
                          "example": "PENDING"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Profile already approved or invalid parameters"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/api/seller/revision": {
      "get": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Get Verification Revision Details (Alias)",
        "description": "Alias endpoint to retrieve the current seller verification status, admin rejection notes, and existing uploaded documents.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Revision notes and required fields",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Resubmit KYC Documents for Revision (Multipart Form-Data)",
        "description": "Submit updated documents after admin requests revisions or marks application as REJECTED/REVISION.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "businessName": {
                    "type": "string",
                    "example": "Spice Kitchen"
                  },
                  "businessAddress": {
                    "type": "string",
                    "example": "Shop 12, FC Road, Pune"
                  },
                  "adhaarFrontFile": {
                    "type": "string",
                    "format": "binary"
                  },
                  "adhaarBackFile": {
                    "type": "string",
                    "format": "binary"
                  },
                  "fssaiFile": {
                    "type": "string",
                    "format": "binary"
                  },
                  "lightBillFile": {
                    "type": "string",
                    "format": "binary"
                  },
                  "passbookFile": {
                    "type": "string",
                    "format": "binary"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Documents resubmitted for admin review",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/category-application": {
      "post": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Apply for Additional Business Category",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "category"
                ],
                "properties": {
                  "category": {
                    "type": "string",
                    "enum": [
                      "FOOD",
                      "PROPERTY",
                      "BOTH"
                    ],
                    "example": "PROPERTY"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Application submitted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/menu": {
      "get": {
        "tags": [
          "Seller-Food-Menu"
        ],
        "summary": "List Seller Menu Items",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Menu list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Seller-Food-Menu"
        ],
        "summary": "Add New Menu Item",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name",
                  "price",
                  "category"
                ],
                "properties": {
                  "name": {
                    "type": "string",
                    "example": "Hyderabadi Chicken Biryani"
                  },
                  "description": {
                    "type": "string",
                    "example": "Aromatic basmati rice cooked with tender spices."
                  },
                  "price": {
                    "type": "number",
                    "example": 280
                  },
                  "category": {
                    "type": "string",
                    "example": "Biryani"
                  },
                  "isVeg": {
                    "type": "boolean",
                    "example": false
                  },
                  "imageUrl": {
                    "type": "string",
                    "example": "https://example.com/biryani.jpg"
                  },
                  "isAvailable": {
                    "type": "boolean",
                    "default": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Menu item created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/menu/{id}": {
      "get": {
        "tags": [
          "Seller-Food-Menu"
        ],
        "summary": "Get Single Menu Item",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Menu item details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Seller-Food-Menu"
        ],
        "summary": "Update Menu Item",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Menu item updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Seller-Food-Menu"
        ],
        "summary": "Delete Menu Item",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Menu item deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Seller-Food-Menu"
        ],
        "summary": "Fast Toggle Item Stock / Price (PATCH)",
        "description": "Instantly toggle dish in-stock availability (`isAvailable: false`) or quick update price.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "item_001"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "isAvailable": {
                    "type": "boolean",
                    "example": false
                  },
                  "price": {
                    "type": "number",
                    "example": 250
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Menu item updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/menu/pincodes": {
      "get": {
        "tags": [
          "Seller-Food-Menu"
        ],
        "summary": "List Serviceable Delivery Pincodes",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Pincodes list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Seller-Food-Menu"
        ],
        "summary": "Add Serviceable Pincode",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "pincode"
                ],
                "properties": {
                  "pincode": {
                    "type": "string",
                    "example": "411038"
                  },
                  "areaName": {
                    "type": "string",
                    "example": "Kothrud"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Pincode added",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/menu/pincodes/{id}": {
      "delete": {
        "tags": [
          "Seller-Food-Menu"
        ],
        "summary": "Remove Serviceable Pincode",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Pincode removed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/meal-plans": {
      "get": {
        "tags": [
          "Seller-Meal-Plans"
        ],
        "summary": "List Seller Meal Plans",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Meal plans list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Seller-Meal-Plans"
        ],
        "summary": "Create Subscription Meal Plan",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name",
                  "price",
                  "durationDays"
                ],
                "properties": {
                  "name": {
                    "type": "string",
                    "example": "Monthly North Indian Thali"
                  },
                  "description": {
                    "type": "string",
                    "example": "2 Roti, Sabji, Dal, Rice, Salad daily"
                  },
                  "price": {
                    "type": "number",
                    "example": 3600
                  },
                  "durationDays": {
                    "type": "integer",
                    "example": 30
                  },
                  "mealsPerDay": {
                    "type": "integer",
                    "default": 1
                  },
                  "isVeg": {
                    "type": "boolean",
                    "default": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Meal plan created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Seller-Meal-Plans"
        ],
        "summary": "Delete Meal Plan (Query Param ID)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Meal plan deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Seller-Meal-Plans"
        ],
        "summary": "Partial Update Meal Plan (PATCH)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Meal plan updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/meal-plans/{id}": {
      "get": {
        "tags": [
          "Seller-Meal-Plans"
        ],
        "summary": "Get Meal Plan Details",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Meal plan details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Seller-Meal-Plans"
        ],
        "summary": "Update Meal Plan",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Meal plan updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Seller-Meal-Plans"
        ],
        "summary": "Delete Meal Plan (Safe Active Subscriber Check)",
        "description": "Permanently deletes a meal plan. If there are active customer subscriptions on this plan, deletion is blocked and returns 400. Inactivate the plan instead so no new users subscribe.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Meal plan deleted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          },
          "400": {
            "description": "Cannot delete plan because active subscribers exist (must inactivate first)",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "404": {
            "description": "Meal plan not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Seller-Meal-Plans"
        ],
        "summary": "Partial Update Meal Plan by ID (PATCH)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Meal plan updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/meal-plans/{id}/status": {
      "patch": {
        "tags": [
          "Seller-Meal-Plans"
        ],
        "summary": "Activate or Inactivate Meal Subscription Plan",
        "description": "Toggles or sets the meal subscription plan status between 'Live' (active and visible to customers) and 'Inactive' (hidden from customers so no new users can subscribe).",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "enum": [
                      "Live",
                      "Inactive"
                    ],
                    "example": "Inactive"
                  },
                  "isActive": {
                    "type": "boolean",
                    "example": false
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Meal plan status updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Meal subscription plan inactivated successfully. It is now hidden from users."
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "name": {
                          "type": "string"
                        },
                        "status": {
                          "type": "string",
                          "example": "Inactive"
                        },
                        "isActive": {
                          "type": "boolean",
                          "example": false
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid request or Plan ID missing",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "404": {
            "description": "Meal plan not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Seller-Meal-Plans"
        ],
        "summary": "Toggle Meal Plan Status (PUT)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string"
                  },
                  "isActive": {
                    "type": "boolean"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Meal plan status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/rooms": {
      "get": {
        "tags": [
          "Seller-Rooms"
        ],
        "summary": "List Landlord Room Listings",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Rooms list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Seller-Rooms"
        ],
        "summary": "Create Room Listing",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "title",
                  "monthlyRent",
                  "depositAmount",
                  "city"
                ],
                "properties": {
                  "title": {
                    "type": "string",
                    "example": "Spacious 1BHK in Viman Nagar"
                  },
                  "description": {
                    "type": "string",
                    "example": "Fully furnished with high-speed WiFi and power backup."
                  },
                  "monthlyRent": {
                    "type": "number",
                    "example": 18000
                  },
                  "depositAmount": {
                    "type": "number",
                    "example": 36000
                  },
                  "roomType": {
                    "type": "string",
                    "enum": [
                      "1BHK",
                      "2BHK",
                      "SINGLE_ROOM",
                      "SHARED"
                    ],
                    "example": "1BHK"
                  },
                  "furnishingStatus": {
                    "type": "string",
                    "enum": [
                      "FURNISHED",
                      "SEMI_FURNISHED",
                      "UNFURNISHED"
                    ],
                    "example": "FURNISHED"
                  },
                  "city": {
                    "type": "string",
                    "example": "Pune"
                  },
                  "pincode": {
                    "type": "string",
                    "example": "411014"
                  },
                  "address": {
                    "type": "string",
                    "example": "Plot 18, Clover Park, Viman Nagar"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Room listing created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Seller-Rooms"
        ],
        "summary": "Delete Room Listing (DELETE)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Room deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Seller-Rooms"
        ],
        "summary": "Partial Update Room Listing (PATCH)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Room updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/rooms/{id}": {
      "get": {
        "tags": [
          "Seller-Rooms"
        ],
        "summary": "Get Room Details",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Room details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Seller-Rooms"
        ],
        "summary": "Update Room Listing",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Room updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Seller-Rooms"
        ],
        "summary": "Delete Room Listing",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Room deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Seller-Rooms"
        ],
        "summary": "Partial Update Room by ID (PATCH)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Room updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/rooms/bookings": {
      "get": {
        "tags": [
          "Seller-Rooms"
        ],
        "summary": "List Tenant Bookings for Landlord",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Bookings list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Seller-Rooms"
        ],
        "summary": "Update Room Booking Status (PATCH)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "bookingId",
                  "status"
                ],
                "properties": {
                  "bookingId": {
                    "type": "string",
                    "example": "bkg_123"
                  },
                  "status": {
                    "type": "string",
                    "enum": [
                      "CONFIRMED",
                      "CANCELLED",
                      "COMPLETED"
                    ],
                    "example": "CONFIRMED"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Booking status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/orders/stream": {
      "get": {
        "tags": [
          "Seller-Orders"
        ],
        "summary": "Live Real-Time Kitchen Order Stream (Server-Sent Events / SSE)",
        "description": "Establishes a persistent Server-Sent Events stream (`text/event-stream`) to instantly push new customer incoming orders, cancellations, and status transitions to the kitchen without client polling.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Active SSE stream emitting 'order', 'connected', and heartbeat events",
            "content": {
              "text/event-stream": {
                "schema": {
                  "type": "string",
                  "example": "event: order\ndata: {\"event\":\"ORDER_CREATED\",\"order\":{...},\"orderId\":\"ord_abc\",\"status\":\"PENDING\"}\n\n"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized - SELLER role required"
          }
        }
      }
    },
    "/api/seller/orders": {
      "get": {
        "tags": [
          "Seller-Orders"
        ],
        "summary": "Live Orders & Order History",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "status",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": [
                "PENDING",
                "ACCEPTED",
                "PREPARING",
                "READY_FOR_PICKUP",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED"
              ]
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Orders list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/orders/{orderId}": {
      "get": {
        "tags": [
          "Seller-Orders"
        ],
        "summary": "Get Order Details",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "orderId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Order details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Seller-Orders"
        ],
        "summary": "Update Order Status",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "orderId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "status"
                ],
                "properties": {
                  "status": {
                    "type": "string",
                    "enum": [
                      "ACCEPTED",
                      "PREPARING",
                      "READY_FOR_PICKUP",
                      "COMPLETED",
                      "CANCELLED"
                    ]
                  },
                  "cancellationReason": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Order status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Seller-Orders"
        ],
        "summary": "Kitchen Update Order Status (Accept / Reject with Auto-Refund / Prep)",
        "description": "Kitchen updates order milestone: `ACCEPTED`, `PREPARING`, `READY_FOR_PICKUP`, `REJECTED`, `DELIVERED`, `CANCELLED`. If a paid order is rejected, auto-submits a refund request to Superadmin.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "orderId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "ord_123"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "status"
                ],
                "properties": {
                  "status": {
                    "type": "string",
                    "enum": [
                      "ACCEPTED",
                      "PREPARING",
                      "READY_FOR_PICKUP",
                      "REJECTED",
                      "DELIVERED",
                      "CANCELLED"
                    ],
                    "example": "ACCEPTED"
                  },
                  "rejectReason": {
                    "type": "string",
                    "example": "Item out of stock"
                  },
                  "preparationTime": {
                    "type": "integer",
                    "example": 25,
                    "description": "Estimated prep time in minutes"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Order status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/orders/{orderId}/assign": {
      "post": {
        "tags": [
          "Seller-Orders"
        ],
        "summary": "Assign Delivery Rider to Order",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "orderId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "riderId"
                ],
                "properties": {
                  "riderId": {
                    "type": "string",
                    "example": "rdr_102"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Rider assigned",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Seller-Orders"
        ],
        "summary": "Assign Rider to Live Order (PATCH)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "orderId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "ord_123"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "riderId"
                ],
                "properties": {
                  "riderId": {
                    "type": "string",
                    "example": "rdr_456"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Rider assigned to order",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/reviews": {
      "get": {
        "tags": [
          "Seller-Orders"
        ],
        "summary": "Customer Reviews for Seller",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Reviews list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/reviews/{id}/reply": {
      "post": {
        "tags": [
          "Seller-Orders"
        ],
        "summary": "Reply to Customer Review",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "reply"
                ],
                "properties": {
                  "reply": {
                    "type": "string",
                    "example": "Thank you for the wonderful feedback! Looking forward to serving you again."
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Reply added",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/delivery": {
      "get": {
        "tags": [
          "Seller-Delivery"
        ],
        "summary": "List In-House Delivery Riders",
        "description": "Retrieves all delivery agents registered under the authenticated seller, including active duty status, outstanding COD cash balance, vehicle details, and active pending delivery counts.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Roster of delivery agents",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "deliveryPersons": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "id": {
                                "type": "string",
                                "example": "dp_101"
                              },
                              "userId": {
                                "type": "string",
                                "example": "usr_202"
                              },
                              "name": {
                                "type": "string",
                                "example": "Suresh Patil"
                              },
                              "phone": {
                                "type": "string",
                                "example": "9812345678"
                              },
                              "email": {
                                "type": "string",
                                "example": "suresh.rider@kitchen.com"
                              },
                              "vehicleType": {
                                "type": "string",
                                "example": "Motorcycle / Scooter"
                              },
                              "vehicleNumber": {
                                "type": "string",
                                "example": "MH-12-AB-1234"
                              },
                              "isActive": {
                                "type": "boolean",
                                "example": true
                              },
                              "outstandingBalance": {
                                "type": "number",
                                "example": 1250
                              },
                              "pendingDeliveriesCount": {
                                "type": "number",
                                "example": 2
                              },
                              "createdAt": {
                                "type": "string",
                                "format": "date-time"
                              },
                              "updatedAt": {
                                "type": "string",
                                "format": "date-time"
                              }
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
          "401": {
            "description": "Unauthorized - SELLER role required"
          }
        }
      },
      "post": {
        "tags": [
          "Seller-Delivery"
        ],
        "summary": "Add In-House Delivery Rider",
        "description": "Registers a new in-house delivery rider account and creates their linked user credentials.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name",
                  "phone",
                  "email",
                  "password"
                ],
                "properties": {
                  "name": {
                    "type": "string",
                    "example": "Suresh Patil"
                  },
                  "phone": {
                    "type": "string",
                    "example": "9812345678"
                  },
                  "email": {
                    "type": "string",
                    "example": "suresh.rider@kitchen.com"
                  },
                  "password": {
                    "type": "string",
                    "example": "RiderPass123!"
                  },
                  "vehicleType": {
                    "type": "string",
                    "example": "Motorcycle / Scooter"
                  },
                  "vehicleNumber": {
                    "type": "string",
                    "example": "MH-12-AB-1234"
                  },
                  "city": {
                    "type": "string",
                    "example": "Pune"
                  },
                  "pincode": {
                    "type": "string",
                    "example": "411038"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Delivery agent registered successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          },
          "400": {
            "description": "Validation error or invalid phone/email format",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "409": {
            "description": "Email address already registered to another account",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/delivery/{id}": {
      "get": {
        "tags": [
          "Seller-Delivery"
        ],
        "summary": "Get Rider Details & Balance",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Rider details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Seller-Delivery"
        ],
        "summary": "Edit Delivery Rider Details / Toggle Active Status",
        "description": "Updates delivery agent information (name, phone, email, optional new password, vehicle type/number) or toggles their active/inactive duty status.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "example": "Suresh R. Patil"
                  },
                  "phone": {
                    "type": "string",
                    "example": "9812345678"
                  },
                  "email": {
                    "type": "string",
                    "example": "suresh.new@kitchen.com"
                  },
                  "password": {
                    "type": "string",
                    "example": "NewSecret123!"
                  },
                  "vehicleType": {
                    "type": "string",
                    "example": "Electric Scooter"
                  },
                  "vehicleNumber": {
                    "type": "string",
                    "example": "MH-12-XY-9876"
                  },
                  "isActive": {
                    "type": "boolean",
                    "example": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Delivery agent updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input or validation error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "404": {
            "description": "Delivery agent not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "409": {
            "description": "Email already taken by another user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Seller-Delivery"
        ],
        "summary": "Patch Delivery Rider / Toggle Active Status",
        "description": "Partially updates delivery agent attributes or toggles `isActive` status.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "isActive": {
                    "type": "boolean",
                    "example": false
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Delivery agent updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          },
          "404": {
            "description": "Delivery agent not found"
          }
        }
      },
      "delete": {
        "tags": [
          "Seller-Delivery"
        ],
        "summary": "Delete Delivery Rider Account",
        "description": "Permanently deletes the delivery agent account and linked user login. Deletion is strictly blocked if the agent has active pending deliveries or an outstanding COD cash balance.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Delivery agent deleted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Delivery agent Suresh Patil deleted successfully."
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Cannot delete delivery agent due to active pending deliveries or outstanding COD cash balance",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": false
                    },
                    "message": {
                      "type": "string",
                      "example": "Cannot delete delivery agent: agent has active pending deliveries or an outstanding COD balance. Please reassign pending deliveries or settle balance first, or mark the agent as Inactive."
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Delivery agent not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/delivery/{id}/collect": {
      "post": {
        "tags": [
          "Seller-Delivery"
        ],
        "summary": "Collect COD Cash from Delivery Rider",
        "description": "Records cash collected by the seller from the delivery agent, deducting from the agent's outstanding COD balance down to zero. Does not allow adding extra balance beyond platform tracking.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "amount"
                ],
                "properties": {
                  "amount": {
                    "type": "number",
                    "example": 1250
                  },
                  "description": {
                    "type": "string",
                    "example": "Cash handover to owner console"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Cash collected and balance deducted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          },
          "400": {
            "description": "Collection amount exceeds outstanding balance or is invalid"
          }
        }
      }
    },
    "/api/seller/delivery/{id}/transactions": {
      "get": {
        "tags": [
          "Seller-Delivery"
        ],
        "summary": "Rider Cash Ledger History",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Transactions ledger",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/subscription/session": {
      "post": {
        "tags": [
          "Seller-Subscriptions"
        ],
        "summary": "Create Subscription Checkout Session (External Browser Handoff)",
        "description": "Validates the seller token and requested planId, returning the direct web payment checkout URL for launching in an external browser or custom tab.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "planId"
                ],
                "properties": {
                  "planId": {
                    "type": "string",
                    "example": "c4b69d9e-1234-4567-89ab-cdef01234567"
                  },
                  "token": {
                    "type": "string",
                    "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Checkout session generated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Checkout session generated successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "checkoutUrl": {
                          "type": "string",
                          "example": "https://dev.neocloudbites.com/seller/payment?token=...&planId=..."
                        },
                        "plan": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string"
                            },
                            "name": {
                              "type": "string"
                            },
                            "price": {
                              "type": "number"
                            },
                            "durationMonths": {
                              "type": "number"
                            },
                            "category": {
                              "type": "string"
                            }
                          }
                        },
                        "seller": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string"
                            },
                            "businessName": {
                              "type": "string"
                            },
                            "verificationStatus": {
                              "type": "string"
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
          "401": {
            "description": "Invalid or expired authentication token",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "404": {
            "description": "Plan not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/subscription/plans": {
      "get": {
        "tags": [
          "Seller-Subscriptions"
        ],
        "summary": "List Platform Subscription Plans",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "category",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": [
                "FOOD",
                "PROPERTY",
                "BOTH"
              ],
              "example": "FOOD"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Subscription plans list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/subscription/create-order": {
      "post": {
        "tags": [
          "Seller-Subscriptions"
        ],
        "summary": "Create Razorpay Subscription Order",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "planId"
                ],
                "properties": {
                  "planId": {
                    "type": "string",
                    "example": "plan_food_monthly"
                  },
                  "couponCode": {
                    "type": "string",
                    "example": "GROW20"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Razorpay order initialized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/subscription/verify": {
      "post": {
        "tags": [
          "Seller-Subscriptions"
        ],
        "summary": "Verify & Activate Subscription Plan",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "razorpay_order_id",
                  "razorpay_payment_id",
                  "razorpay_signature",
                  "planId"
                ],
                "properties": {
                  "razorpay_order_id": {
                    "type": "string"
                  },
                  "razorpay_payment_id": {
                    "type": "string"
                  },
                  "razorpay_signature": {
                    "type": "string"
                  },
                  "planId": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Subscription activated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/subscriptions/validate-coupon": {
      "post": {
        "tags": [
          "Seller-Subscriptions"
        ],
        "summary": "Validate Subscription Coupon",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "couponCode",
                  "planId"
                ],
                "properties": {
                  "couponCode": {
                    "type": "string",
                    "example": "SAVE50"
                  },
                  "planId": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Coupon validation result",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/notifications": {
      "get": {
        "tags": [
          "Seller-Notifications"
        ],
        "summary": "Get Seller Notifications",
        "description": "Fetch real-time notifications for the authenticated seller including new orders, low stock items, delivery updates, meal subscriptions, customer reviews, and KYC alerts.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "category",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": [
                "all",
                "orders",
                "stock",
                "delivery",
                "bookings",
                "reviews",
                "settlements",
                "system"
              ],
              "default": "all"
            },
            "description": "Filter notifications by category"
          },
          {
            "name": "severity",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": [
                "all",
                "critical",
                "warning",
                "info",
                "success"
              ]
            },
            "description": "Filter notifications by severity level"
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer",
              "default": 60
            },
            "description": "Maximum number of notifications to return"
          }
        ],
        "responses": {
          "200": {
            "description": "Seller notifications payload",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "unreadCount": {
                          "type": "integer",
                          "example": 4
                        },
                        "totalCount": {
                          "type": "integer",
                          "example": 28
                        },
                        "filteredCount": {
                          "type": "integer",
                          "example": 12
                        },
                        "countsByCategory": {
                          "type": "object",
                          "properties": {
                            "all": {
                              "type": "integer",
                              "example": 28
                            },
                            "orders": {
                              "type": "integer",
                              "example": 12
                            },
                            "stock": {
                              "type": "integer",
                              "example": 3
                            },
                            "delivery": {
                              "type": "integer",
                              "example": 5
                            },
                            "bookings": {
                              "type": "integer",
                              "example": 2
                            },
                            "reviews": {
                              "type": "integer",
                              "example": 4
                            },
                            "settlements": {
                              "type": "integer",
                              "example": 1
                            },
                            "system": {
                              "type": "integer",
                              "example": 1
                            }
                          }
                        },
                        "notifications": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "id": {
                                "type": "string",
                                "example": "ord-new-cm8190xyz"
                              },
                              "category": {
                                "type": "string",
                                "enum": [
                                  "orders",
                                  "stock",
                                  "delivery",
                                  "bookings",
                                  "reviews",
                                  "settlements",
                                  "system"
                                ],
                                "example": "orders"
                              },
                              "title": {
                                "type": "string",
                                "example": "New Order Received #ORD-90XYZ"
                              },
                              "message": {
                                "type": "string",
                                "example": "Order for ₹450 (3 items) received from Aman Sharma."
                              },
                              "details": {
                                "type": "string",
                                "example": "Payment: ONLINE • Status: Paid"
                              },
                              "timestamp": {
                                "type": "string",
                                "format": "date-time",
                                "example": "2026-09-26T10:15:00.000Z"
                              },
                              "timeAgo": {
                                "type": "string",
                                "example": "5m ago"
                              },
                              "isRead": {
                                "type": "boolean",
                                "example": false
                              },
                              "severity": {
                                "type": "string",
                                "enum": [
                                  "critical",
                                  "warning",
                                  "info",
                                  "success"
                                ],
                                "example": "success"
                              },
                              "actionLabel": {
                                "type": "string",
                                "example": "View Order"
                              },
                              "actionHref": {
                                "type": "string",
                                "example": "/seller/orders?id=cm8190xyz"
                              },
                              "metadata": {
                                "type": "object"
                              }
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
          "401": {
            "description": "Unauthorized / Missing Bearer token",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Seller-Notifications"
        ],
        "summary": "Mark Notification(s) as Read",
        "description": "Mark a single notification, multiple notifications, or all notifications as read.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string",
                    "example": "ord-new-cm8190xyz",
                    "description": "Single notification ID to mark as read"
                  },
                  "ids": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "example": [
                      "ord-new-1",
                      "stock-2"
                    ],
                    "description": "Multiple IDs to mark as read"
                  },
                  "markAllRead": {
                    "type": "boolean",
                    "example": true,
                    "description": "Set true to mark all seller notifications as read"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Notifications marked as read",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/notifications/count": {
      "get": {
        "tags": [
          "Seller-Notifications"
        ],
        "summary": "Get Notification & Badge Count",
        "description": "Lightweight endpoint optimized for mobile app badge counters, bell icons, and background polling.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Badge counters count summary",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "unreadCount": {
                          "type": "integer",
                          "example": 5
                        },
                        "pendingOrders": {
                          "type": "integer",
                          "example": 3
                        },
                        "lowStockItems": {
                          "type": "integer",
                          "example": 2
                        }
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
    "/api/seller/notifications/preferences": {
      "post": {
        "tags": [
          "Seller-Notifications"
        ],
        "summary": "Save Notification Preferences (POST)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Preferences saved",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Seller-Notifications"
        ],
        "summary": "Update Notification Preferences (PUT)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Preferences updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "get": {
        "tags": [
          "Seller-Notifications"
        ],
        "summary": "Get Notification Preferences (GET)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Preferences data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/notifications/{id}": {
      "patch": {
        "tags": [
          "Seller-Notifications"
        ],
        "summary": "Mark Single Notification as Read",
        "description": "Marks a specific notification ID as read.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "example": "ord-new-cm8190xyz"
          }
        ],
        "responses": {
          "200": {
            "description": "Notification marked read",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Seller-Notifications"
        ],
        "summary": "Dismiss / Delete Notification",
        "description": "Dismisses a notification from the seller's active view.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "example": "ord-new-cm8190xyz"
          }
        ],
        "responses": {
          "200": {
            "description": "Notification dismissed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/delivery/profile": {
      "get": {
        "tags": [
          "Delivery-Rider"
        ],
        "summary": "Rider Profile & Shift Status",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Rider profile",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Delivery-Rider"
        ],
        "summary": "Update Rider Online / Duty Status",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "isAvailable": {
                    "type": "boolean",
                    "example": true
                  },
                  "currentLatitude": {
                    "type": "number",
                    "example": 18.5204
                  },
                  "currentLongitude": {
                    "type": "number",
                    "example": 73.8567
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Rider status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Delivery-Rider"
        ],
        "summary": "Create / Update Delivery Rider Profile",
        "description": "Registers or updates rider duty availability, vehicle number, and phone.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "isOnline": {
                    "type": "boolean",
                    "example": true
                  },
                  "vehicleNumber": {
                    "type": "string",
                    "example": "MH-12-AB-1234"
                  },
                  "phone": {
                    "type": "string",
                    "example": "9876543210"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Rider profile updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/delivery/orders/stream": {
      "get": {
        "tags": [
          "Delivery-Rider"
        ],
        "summary": "Live Real-Time Delivery Task Stream (Server-Sent Events / SSE)",
        "description": "Establishes a real-time event stream (`text/event-stream`) to receive instant push alerts for newly available delivery orders and assigned task status changes without polling.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Active SSE stream emitting 'order' and 'connected' events",
            "content": {
              "text/event-stream": {
                "schema": {
                  "type": "string",
                  "example": "event: order\ndata: {\"event\":\"ORDER_CREATED\",\"orderId\":\"ord_123\",\"deliveryPersonId\":null}\n\n"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized - DELIVERY role required"
          }
        }
      }
    },
    "/api/delivery/orders": {
      "get": {
        "tags": [
          "Delivery-Rider"
        ],
        "summary": "Assigned Delivery Orders",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "status",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": [
                "ASSIGNED",
                "PICKED_UP",
                "DELIVERED",
                "ALL"
              ],
              "default": "ALL"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Assigned orders list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/delivery/orders/{id}": {
      "get": {
        "tags": [
          "Delivery-Rider"
        ],
        "summary": "Get Delivery Task Details",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Delivery order details with pickup and customer location",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Delivery-Rider"
        ],
        "summary": "Update Delivery Progress",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "status"
                ],
                "properties": {
                  "status": {
                    "type": "string",
                    "enum": [
                      "PICKED_UP",
                      "OUT_FOR_DELIVERY",
                      "DELIVERED",
                      "FAILED"
                    ],
                    "example": "DELIVERED"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Delivery status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Delivery-Rider"
        ],
        "summary": "Rider Update Order Delivery Status",
        "description": "Updates order delivery milestone: `PICKED_UP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "ord_12345"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "status"
                ],
                "properties": {
                  "status": {
                    "type": "string",
                    "enum": [
                      "PICKED_UP",
                      "OUT_FOR_DELIVERY",
                      "DELIVERED",
                      "CANCELLED"
                    ],
                    "example": "DELIVERED"
                  },
                  "latitude": {
                    "type": "number",
                    "example": 18.5204
                  },
                  "longitude": {
                    "type": "number",
                    "example": 73.8567
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Order status updated by rider",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/delivery/orders/{id}/pay": {
      "get": {
        "tags": [
          "Delivery-Rider"
        ],
        "summary": "Get Order COD Collection Amount",
        "description": "Returns the Cash On Delivery (COD) amount that must be collected from the customer.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "ord_12345"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "COD collection details",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "orderId": {
                          "type": "string",
                          "example": "ord_12345"
                        },
                        "amountToCollect": {
                          "type": "number",
                          "example": 280
                        },
                        "isPaid": {
                          "type": "boolean",
                          "example": false
                        },
                        "paymentMethod": {
                          "type": "string",
                          "example": "COD"
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
      "post": {
        "tags": [
          "Delivery-Rider"
        ],
        "summary": "Rider Confirm COD Cash Collection",
        "description": "Confirms that the delivery rider has collected cash for a Cash-On-Delivery order upon successful handover.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "ord_12345"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "amountCollected"
                ],
                "properties": {
                  "amountCollected": {
                    "type": "number",
                    "example": 280
                  },
                  "paymentMode": {
                    "type": "string",
                    "enum": [
                      "CASH",
                      "UPI"
                    ],
                    "example": "CASH"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "COD collection confirmed and recorded in rider ledger",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/delivery/transactions": {
      "get": {
        "tags": [
          "Delivery-Rider"
        ],
        "summary": "Rider Earnings & COD Settlement History",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Rider transaction history",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/coupons": {
      "get": {
        "tags": [
          "Coupons-Discounts"
        ],
        "summary": "List Active Coupons",
        "responses": {
          "200": {
            "description": "Coupons list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Coupons-Discounts"
        ],
        "summary": "Validate / Apply Coupon to Cart",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "code",
                  "cartTotal"
                ],
                "properties": {
                  "code": {
                    "type": "string",
                    "example": "FIRST50"
                  },
                  "cartTotal": {
                    "type": "number",
                    "example": 400
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Calculated discount amount",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/coupons/{id}": {
      "get": {
        "tags": [
          "Coupons-Discounts"
        ],
        "summary": "Get Coupon Details",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Coupon details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Coupons-Discounts"
        ],
        "summary": "Update Coupon",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Coupon updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Coupons-Discounts"
        ],
        "summary": "Delete Coupon",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Coupon deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/refunds": {
      "get": {
        "tags": [
          "Refunds-Disputes"
        ],
        "summary": "List Refund Requests",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Refund requests",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Refunds-Disputes"
        ],
        "summary": "Raise Order Refund Request",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "orderId",
                  "reason"
                ],
                "properties": {
                  "orderId": {
                    "type": "string"
                  },
                  "reason": {
                    "type": "string",
                    "example": "Order arrived cold / spilled"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Refund ticket created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/refunds/{id}": {
      "get": {
        "tags": [
          "Refunds-Disputes"
        ],
        "summary": "Get Refund Details",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Refund details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Refunds-Disputes"
        ],
        "summary": "Update Refund Status",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Refund updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Refunds-Disputes"
        ],
        "summary": "Update Refund Request Status (Superadmin / Support)",
        "description": "Updates a refund request status to `APPROVED`, `REJECTED`, or `PROCESSED` with admin remarks and gateway transaction ID.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "ref_12345"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "status"
                ],
                "properties": {
                  "status": {
                    "type": "string",
                    "enum": [
                      "APPROVED",
                      "REJECTED",
                      "PROCESSED"
                    ],
                    "example": "PROCESSED"
                  },
                  "adminNotes": {
                    "type": "string",
                    "example": "Refund processed via Razorpay API."
                  },
                  "transactionId": {
                    "type": "string",
                    "example": "rfnd_Kabc123456"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Refund status updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/tickets": {
      "get": {
        "tags": [
          "Support-Tickets"
        ],
        "summary": "List User Support Tickets",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Tickets list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Support-Tickets"
        ],
        "summary": "Create Support Ticket",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "subject",
                  "category",
                  "message"
                ],
                "properties": {
                  "subject": {
                    "type": "string",
                    "example": "Issue with order delivery"
                  },
                  "category": {
                    "type": "string",
                    "enum": [
                      "ORDER",
                      "PAYMENT",
                      "ACCOUNT",
                      "GENERAL"
                    ],
                    "example": "ORDER"
                  },
                  "message": {
                    "type": "string",
                    "example": "Rider did not deliver items."
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Ticket created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/tickets/{id}": {
      "get": {
        "tags": [
          "Support-Tickets"
        ],
        "summary": "Get Ticket Conversation Details",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Ticket details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Support-Tickets"
        ],
        "summary": "Update Ticket Status",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Ticket status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Support-Tickets"
        ],
        "summary": "Update Support Ticket Status (PATCH)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "tkt_123"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "status"
                ],
                "properties": {
                  "status": {
                    "type": "string",
                    "enum": [
                      "OPEN",
                      "IN_PROGRESS",
                      "RESOLVED",
                      "CLOSED"
                    ],
                    "example": "RESOLVED"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Ticket status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/tickets/{id}/messages": {
      "get": {
        "tags": [
          "Support-Tickets"
        ],
        "summary": "Get Ticket Messages",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Messages list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Support-Tickets"
        ],
        "summary": "Send Message in Support Ticket",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "message"
                ],
                "properties": {
                  "message": {
                    "type": "string",
                    "example": "Providing additional details..."
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Message sent",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/furniture/query": {
      "post": {
        "tags": [
          "Furniture-Inquiries"
        ],
        "summary": "Submit Furniture Rental Enquiry",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name",
                  "phone",
                  "requirement"
                ],
                "properties": {
                  "name": {
                    "type": "string",
                    "example": "Aman Sharma"
                  },
                  "phone": {
                    "type": "string",
                    "example": "9876543210"
                  },
                  "email": {
                    "type": "string",
                    "example": "aman@example.com"
                  },
                  "requirement": {
                    "type": "string",
                    "example": "Need double bed, study table and 2 chairs for 6 months."
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Enquiry logged",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/dashboard": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Operations Admin Dashboard",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Operations dashboard metrics",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/registrations": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Pending Seller Registrations Queue",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Pending seller registrations",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Update Seller Registration Status (Admin / Agent)",
        "description": "Approve, reject, or request revisions for a merchant onboarding KYC application.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "sellerId",
                  "status"
                ],
                "properties": {
                  "sellerId": {
                    "type": "string",
                    "example": "sel_123"
                  },
                  "status": {
                    "type": "string",
                    "enum": [
                      "APPROVED",
                      "REJECTED",
                      "REVISION"
                    ],
                    "example": "APPROVED"
                  },
                  "verificationNote": {
                    "type": "string",
                    "example": "Documents verified successfully"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Seller registration status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/dashboard": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Superadmin Executive Dashboard",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Platform GMV, active sellers, total riders",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/approvals": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List Pending Merchant Approvals",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Approvals queue",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Superadmin Approvals Handler (PUT)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Approval updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/approvals/{type}/{id}": {
      "put": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Approve / Reject / Request Revision for Seller",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "type",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "FOOD",
                "PROPERTY",
                "SELLER"
              ]
            }
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "status"
                ],
                "properties": {
                  "status": {
                    "type": "string",
                    "enum": [
                      "APPROVED",
                      "REJECTED",
                      "REVISION"
                    ]
                  },
                  "note": {
                    "type": "string",
                    "example": "FSSAI license verified successfully"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Approval status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/sellers": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List All Merchants on Platform",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Sellers list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/sellers/{sellerId}": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Get Detailed Seller Account",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "sellerId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Seller details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Update / Block / Verify Seller Account",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "sellerId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Seller updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Delete Merchant Account (Superadmin)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "sellerId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Seller account deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/plans": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List Platform Subscription Plans",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Plans list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Create Platform Subscription Plan Tier",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Plan created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/plans/{id}": {
      "put": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Update Subscription Plan",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Plan updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Delete Subscription Plan",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Plan deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/settings": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Get Global System Settings",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Platform settings",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Update Global System Settings",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Settings updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/users": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List All Users",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Users list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/users/{id}/activity": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Get User Activity & Order History",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "User activity ledger",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/orders/validate-reorder": {
      "post": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Validate Past Order Items for Reordering",
        "description": "Validates whether all dishes from a past order are currently active, in-stock, and available from the kitchen before adding them back to the user's cart.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "orderId"
                ],
                "properties": {
                  "orderId": {
                    "type": "string",
                    "example": "ord_12345",
                    "description": "ID of the past order to reorder"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Reorder validation result",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "isValid": {
                          "type": "boolean",
                          "example": true
                        },
                        "sellerId": {
                          "type": "string",
                          "example": "sel_123"
                        },
                        "sellerName": {
                          "type": "string",
                          "example": "Spice Symphony Kitchen"
                        },
                        "isSellerOnline": {
                          "type": "boolean",
                          "example": true
                        },
                        "availableItems": {
                          "type": "array",
                          "items": {
                            "type": "object"
                          }
                        },
                        "unavailableItems": {
                          "type": "array",
                          "items": {
                            "type": "string"
                          },
                          "example": []
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid order or items unavailable"
          }
        }
      }
    },
    "/api/user/meal-subscriptions": {
      "get": {
        "tags": [
          "Customer-Meal-Subscriptions"
        ],
        "summary": "List User Meal Subscriptions (Supports Multi-Active Plans)",
        "description": "Retrieves all active, paused, and past recurring meal subscriptions belonging to the authenticated customer. Multiple active subscriptions across lunch, dinner, or different kitchens are supported concurrently.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "List of user meal subscriptions",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "string",
                            "example": "sub_12345"
                          },
                          "status": {
                            "type": "string",
                            "enum": [
                              "ACTIVE",
                              "PAUSED",
                              "EXPIRED",
                              "CANCELLED"
                            ],
                            "example": "ACTIVE"
                          },
                          "startDate": {
                            "type": "string",
                            "format": "date-time",
                            "example": "2026-10-01T08:00:00.000Z"
                          },
                          "endDate": {
                            "type": "string",
                            "format": "date-time",
                            "example": "2026-10-31T08:00:00.000Z"
                          },
                          "deliveryAddress": {
                            "type": "string",
                            "example": "Flat 402, Sunshine Apts, Pune"
                          },
                          "customerPhone": {
                            "type": "string",
                            "example": "9876543210"
                          },
                          "plan": {
                            "type": "object",
                            "properties": {
                              "id": {
                                "type": "string",
                                "example": "plan_99"
                              },
                              "name": {
                                "type": "string",
                                "example": "Executive North Indian Thali (Lunch)"
                              },
                              "sellerName": {
                                "type": "string",
                                "example": "Annapurna Kitchen"
                              },
                              "mealTimings": {
                                "type": "array",
                                "items": {
                                  "type": "string"
                                },
                                "example": [
                                  "LUNCH"
                                ]
                              },
                              "tier": {
                                "type": "string",
                                "example": "STANDARD"
                              },
                              "allowPause": {
                                "type": "boolean",
                                "example": true
                              },
                              "pauseBillingPeriod": {
                                "type": "string",
                                "example": "Allowed"
                              }
                            }
                          }
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
      "post": {
        "tags": [
          "Customer-Meal-Subscriptions"
        ],
        "summary": "Subscribe to Meal Plan (With Start Date Selection)",
        "description": "Subscribes the customer to a recurring meal plan. Supports start date preference options: 'Tomorrow', 'Monday', '1st' (1st of next month), 'Today', or a custom ISO start date.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "planId",
                  "deliveryAddress",
                  "customerPhone",
                  "paymentMethod"
                ],
                "properties": {
                  "planId": {
                    "type": "string",
                    "example": "plan_99"
                  },
                  "deliveryAddress": {
                    "type": "string",
                    "example": "Flat 402, Sunshine Apts, Kothrud, Pune - 411038"
                  },
                  "customerPhone": {
                    "type": "string",
                    "example": "9876543210"
                  },
                  "paymentMethod": {
                    "type": "string",
                    "enum": [
                      "COD",
                      "ONLINE"
                    ],
                    "example": "ONLINE"
                  },
                  "startDatePreference": {
                    "type": "string",
                    "enum": [
                      "Tomorrow",
                      "Monday",
                      "1st",
                      "Today",
                      "Custom"
                    ],
                    "example": "Tomorrow",
                    "description": "Start Date choice: Tomorrow, Coming Monday, 1st of next month, Today, or Custom"
                  },
                  "startDate": {
                    "type": "string",
                    "format": "date",
                    "example": "2026-10-01",
                    "description": "Required when startDatePreference is 'Custom' or when passing an explicit date"
                  },
                  "appliedCouponId": {
                    "type": "string",
                    "example": "cpm_sub10"
                  },
                  "razorpay_order_id": {
                    "type": "string",
                    "example": "order_Kxyz123",
                    "description": "Required for ONLINE payment"
                  },
                  "razorpay_payment_id": {
                    "type": "string",
                    "example": "pay_Kabc456",
                    "description": "Required for ONLINE payment"
                  },
                  "razorpay_signature": {
                    "type": "string",
                    "example": "e9a0...32f",
                    "description": "Required for ONLINE payment"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Meal subscription activated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Meal subscription activated successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "example": "sub_12345"
                        },
                        "status": {
                          "type": "string",
                          "example": "ACTIVE"
                        },
                        "startDate": {
                          "type": "string",
                          "format": "date-time",
                          "example": "2026-09-30T08:00:00.000Z"
                        },
                        "endDate": {
                          "type": "string",
                          "format": "date-time",
                          "example": "2026-10-30T08:00:00.000Z"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid plan or validation failure"
          }
        }
      },
      "patch": {
        "tags": [
          "Customer-Meal-Subscriptions"
        ],
        "summary": "Pause, Resume, or Update Delivery Address for Meal Subscription",
        "description": "Allows the customer to pause/resume meal deliveries (enforcing the kitchen partner's pause policy) or update the meal delivery address.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "action",
                  "subscriptionId"
                ],
                "properties": {
                  "action": {
                    "type": "string",
                    "enum": [
                      "PAUSE",
                      "RESUME",
                      "UPDATE_ADDRESS"
                    ],
                    "example": "PAUSE"
                  },
                  "subscriptionId": {
                    "type": "string",
                    "example": "sub_12345"
                  },
                  "deliveryAddress": {
                    "type": "string",
                    "example": "Updated Flat 501, Tower B, Pune",
                    "description": "Required when action is UPDATE_ADDRESS"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Meal subscription updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Subscription paused successfully."
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "example": "sub_12345"
                        },
                        "status": {
                          "type": "string",
                          "enum": [
                            "ACTIVE",
                            "PAUSED"
                          ],
                          "example": "PAUSED"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Pausing not allowed by kitchen policy or invalid action",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/user/meal-subscriptions/initiate-payment": {
      "post": {
        "tags": [
          "Customer-Meal-Subscriptions"
        ],
        "summary": "Initiate Razorpay Online Payment for Meal Subscription",
        "description": "Creates a Razorpay order for purchasing a recurring meal plan subscription before final activation.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "planId",
                  "amount"
                ],
                "properties": {
                  "planId": {
                    "type": "string",
                    "example": "plan_99"
                  },
                  "amount": {
                    "type": "number",
                    "example": 2400
                  },
                  "durationDays": {
                    "type": "integer",
                    "example": 30
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Razorpay order initialized for meal subscription",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "razorpayOrderId": {
                          "type": "string",
                          "example": "order_Mxyz789"
                        },
                        "amount": {
                          "type": "number",
                          "example": 240000
                        },
                        "currency": {
                          "type": "string",
                          "example": "INR"
                        },
                        "keyId": {
                          "type": "string",
                          "example": "rzp_test_TX4MPQgJuetMFP"
                        }
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
    "/api/user/location/default": {
      "get": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Get Default Saved Delivery Location Coordinates",
        "description": "Fetches user's active default GPS coordinates and address for nearest kitchen proximity search.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Default location data",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "latitude": {
                          "type": "number",
                          "example": 18.5204
                        },
                        "longitude": {
                          "type": "number",
                          "example": 73.8567
                        },
                        "address": {
                          "type": "string",
                          "example": "FC Road, Shivajinagar, Pune"
                        }
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
    "/api/user/rate-app": {
      "get": {
        "tags": [
          "App-Feedback"
        ],
        "summary": "Get User Mobile App Rating & Feedback",
        "description": "Fetches the current user's submitted mobile app star rating and review feedback.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "User app rating details",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "rating": {
                          "type": "number",
                          "example": 5
                        },
                        "feedback": {
                          "type": "string",
                          "example": "Super smooth food ordering experience!"
                        },
                        "platform": {
                          "type": "string",
                          "example": "ANDROID"
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
      "post": {
        "tags": [
          "App-Feedback"
        ],
        "summary": "Submit Mobile App Star Rating & Feedback",
        "description": "Submits or updates the customer's mobile app satisfaction rating (1-5 stars) and feedback comments.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "rating"
                ],
                "properties": {
                  "rating": {
                    "type": "number",
                    "minimum": 1,
                    "maximum": 5,
                    "example": 5
                  },
                  "feedback": {
                    "type": "string",
                    "example": "Great UI, love the live order tracking!"
                  },
                  "appVersion": {
                    "type": "string",
                    "example": "1.2.0"
                  },
                  "platform": {
                    "type": "string",
                    "enum": [
                      "ANDROID",
                      "IOS",
                      "WEB"
                    ],
                    "example": "ANDROID"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "App rating submitted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/forgot-password": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Forgot Password Request",
        "description": "Sends a secure password reset link or token to the user's registered email address.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "email"
                ],
                "properties": {
                  "email": {
                    "type": "string",
                    "format": "email",
                    "example": "user@example.com"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Password reset instructions sent to your email.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/reset-password": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Reset Password with Token",
        "description": "Resets the account password using the valid reset token received via email.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "token",
                  "newPassword"
                ],
                "properties": {
                  "token": {
                    "type": "string",
                    "example": "rst_tok_abc123"
                  },
                  "newPassword": {
                    "type": "string",
                    "example": "NewSecurePassword123!"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Password reset successfully. You can now login with your new password.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/coupons/validate": {
      "get": {
        "tags": [
          "Coupons-Discounts"
        ],
        "summary": "Validate Coupon Code (Query Param)",
        "description": "Validates a promo discount coupon against order total and category requirements.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "code",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "example": "WELCOME50"
            }
          },
          {
            "name": "orderTotal",
            "in": "query",
            "required": true,
            "schema": {
              "type": "number",
              "example": 350
            }
          },
          {
            "name": "sellerId",
            "in": "query",
            "schema": {
              "type": "string",
              "example": "sel_123"
            }
          },
          {
            "name": "type",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": [
                "FOOD",
                "ROOM",
                "SUBSCRIPTION"
              ],
              "default": "FOOD"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Coupon validation result",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "valid": {
                          "type": "boolean",
                          "example": true
                        },
                        "discountAmount": {
                          "type": "number",
                          "example": 50
                        },
                        "finalTotal": {
                          "type": "number",
                          "example": 300
                        },
                        "couponId": {
                          "type": "string",
                          "example": "cpm_123"
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
      "post": {
        "tags": [
          "Coupons-Discounts"
        ],
        "summary": "Validate Coupon Code (JSON Body)",
        "description": "Validates a promo discount coupon code in checkout cart.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "code",
                  "orderTotal"
                ],
                "properties": {
                  "code": {
                    "type": "string",
                    "example": "FLAT100"
                  },
                  "orderTotal": {
                    "type": "number",
                    "example": 500
                  },
                  "sellerId": {
                    "type": "string",
                    "example": "sel_123"
                  },
                  "type": {
                    "type": "string",
                    "enum": [
                      "FOOD",
                      "ROOM",
                      "SUBSCRIPTION"
                    ],
                    "example": "FOOD"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Coupon validation result",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "valid": {
                          "type": "boolean",
                          "example": true
                        },
                        "discountAmount": {
                          "type": "number",
                          "example": 100
                        },
                        "finalTotal": {
                          "type": "number",
                          "example": 400
                        },
                        "couponId": {
                          "type": "string",
                          "example": "cpm_456"
                        }
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
    "/api/seller/meal-plans/status": {
      "put": {
        "tags": [
          "Seller-Meal-Plans"
        ],
        "summary": "Bulk Toggle Seller Meal Plans Service (PUT)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "isEnabled": {
                    "type": "boolean"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Meal plans service status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "Seller-Meal-Plans"
        ],
        "summary": "Bulk Toggle Seller Meal Plans Service (PATCH)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "isEnabled": {
                    "type": "boolean"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Meal plans service status updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/delivery/{id}/adjust": {
      "post": {
        "tags": [
          "Seller-Delivery"
        ],
        "summary": "Adjust Rider Ledger Balance (Credit / Settlement)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "example": "rdr_123"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "amount",
                  "type"
                ],
                "properties": {
                  "amount": {
                    "type": "number",
                    "example": 500
                  },
                  "type": {
                    "type": "string",
                    "enum": [
                      "CREDIT",
                      "DEBIT",
                      "SETTLEMENT"
                    ],
                    "example": "SETTLEMENT"
                  },
                  "description": {
                    "type": "string",
                    "example": "Cash settled for evening deliveries"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Ledger balance adjusted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/banners": {
      "delete": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Delete Promo Banner (Admin)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Banner deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/banners/sellers": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Get Sellers for Banner Association",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Sellers list for banner targeting",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/delivery": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Admin Delivery Fleet Overview",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Fleet status",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/popup-banners": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List Modal Popup Banners",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Popup banners",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Create Modal Popup Banner",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Popup banner created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/popup-banners/{id}": {
      "put": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Update Popup Banner",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Popup banner updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Delete Popup Banner",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Popup banner deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/admins": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List Sub-Admins",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Admins list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Create Sub-Admin",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Admin created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/admins/{adminId}": {
      "put": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Update Sub-Admin",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "adminId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Admin updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Delete Sub-Admin",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "adminId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Admin deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/categories": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List Store Categories",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Categories list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Create Store Category",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Category created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/categories/{categoryId}": {
      "delete": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Delete Category",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "categoryId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Category deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/coupons": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List All Platform Coupons",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Coupons list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Create Platform Coupon",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Coupon created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/coupons/{couponId}": {
      "delete": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Delete Coupon",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "couponId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Coupon deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/dashboard/available-sellers": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List Available Verified Sellers for Admin Dashboard",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Available sellers",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/food-categories": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List Food Categories (Admin)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Food categories",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Create Food Category (Admin)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Food category created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/food-categories/{id}": {
      "patch": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Update Food Category",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Food category updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Delete Food Category",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Food category deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/food-subcategories": {
      "post": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Create Food Subcategory",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Food subcategory created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/food-subcategories/{id}": {
      "patch": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Update Food Subcategory",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Food subcategory updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Delete Food Subcategory",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Food subcategory deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/promo-banners": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List Promotional Hero Banners (Admin)",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Promo banners",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Create Promotional Hero Banner",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Promo banner created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/promo-banners/{id}": {
      "patch": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Update Promotional Hero Banner",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Promo banner updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Delete Promotional Hero Banner",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Promo banner deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/stats": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Get Platform Analytics & Revenue Metrics",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Analytics stats",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/subscriptions": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List Platform Merchant Subscriptions",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Merchant subscription records",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/subscriptions/coupons": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List Merchant Subscription Coupons",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Subscription coupons",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Create Merchant Subscription Coupon",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Subscription coupon created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/superadmin/subscriptions/coupons/{id}": {
      "put": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Update Subscription Coupon",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Coupon updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Delete Subscription Coupon",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Coupon deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StandardResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/check-email": {
      "get": {
        "tags": [
          "Authentication"
        ],
        "summary": "Check Email Availability (Query)",
        "description": "Checks if an email address is already in use by an active account via query parameter.",
        "parameters": [
          {
            "name": "email",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "email",
              "example": "user@example.com"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Availability result",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "available": {
                          "type": "boolean",
                          "example": true
                        },
                        "exists": {
                          "type": "boolean",
                          "example": false
                        },
                        "email": {
                          "type": "string",
                          "example": "user@example.com"
                        }
                      }
                    },
                    "message": {
                      "type": "string",
                      "example": "Email is available and verified."
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Check Email Availability (JSON Body)",
        "description": "Checks if an email address is already in use by an active account via JSON payload.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "email"
                ],
                "properties": {
                  "email": {
                    "type": "string",
                    "format": "email",
                    "example": "user@example.com"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Availability result",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "available": {
                          "type": "boolean",
                          "example": true
                        },
                        "exists": {
                          "type": "boolean",
                          "example": false
                        },
                        "email": {
                          "type": "string",
                          "example": "user@example.com"
                        }
                      }
                    },
                    "message": {
                      "type": "string",
                      "example": "Email is available and verified."
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/check-phone": {
      "get": {
        "tags": [
          "Authentication"
        ],
        "summary": "Check Mobile Phone Availability (Query)",
        "description": "Checks if a 10-digit mobile phone number is already registered via query parameter.",
        "parameters": [
          {
            "name": "phone",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "example": "9876543210"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Availability result",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "available": {
                          "type": "boolean",
                          "example": true
                        },
                        "exists": {
                          "type": "boolean",
                          "example": false
                        },
                        "phone": {
                          "type": "string",
                          "example": "9876543210"
                        }
                      }
                    },
                    "message": {
                      "type": "string",
                      "example": "Mobile number is available and verified."
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Check Mobile Phone Availability (JSON Body)",
        "description": "Checks if a 10-digit mobile phone number is already registered via JSON payload.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "phone"
                ],
                "properties": {
                  "phone": {
                    "type": "string",
                    "example": "9876543210"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Availability result",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "available": {
                          "type": "boolean",
                          "example": true
                        },
                        "exists": {
                          "type": "boolean",
                          "example": false
                        },
                        "phone": {
                          "type": "string",
                          "example": "9876543210"
                        }
                      }
                    },
                    "message": {
                      "type": "string",
                      "example": "Mobile number is available and verified."
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/user/delete-account": {
      "get": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Get Account Deletion Status",
        "description": "Retrieves the user's account deletion status, soft delete timestamp, and scheduled permanent deletion date.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Account deletion status",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "isSoftDeleted": {
                          "type": "boolean",
                          "example": false
                        },
                        "isPermanentlyDeleted": {
                          "type": "boolean",
                          "example": false
                        },
                        "deletedAt": {
                          "type": "string",
                          "format": "date-time",
                          "nullable": true
                        },
                        "scheduledPermanentDeletionDate": {
                          "type": "string",
                          "format": "date-time",
                          "nullable": true
                        },
                        "isExpired": {
                          "type": "boolean",
                          "example": false
                        },
                        "gracePeriodConfig": {
                          "type": "object",
                          "properties": {
                            "days": {
                              "type": "number",
                              "example": 30
                            },
                            "hours": {
                              "type": "number",
                              "example": 0
                            },
                            "minutes": {
                              "type": "number",
                              "example": 0
                            }
                          }
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
      "post": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Request User Account Deletion",
        "description": "Soft deletes the user account with a configurable grace period (default 30 days). If the user logs in before expiry, deletion is cancelled.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "password": {
                    "type": "string",
                    "description": "Optional password verification"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Account deletion scheduled successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Account deletion requested. Your account is scheduled for permanent deletion in 30 days."
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "deletedAt": {
                          "type": "string",
                          "format": "date-time"
                        },
                        "scheduledDeletionDate": {
                          "type": "string",
                          "format": "date-time"
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
      "delete": {
        "tags": [
          "Customer-User"
        ],
        "summary": "Delete User Account",
        "description": "Alias for POST /api/user/delete-account.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Account deletion scheduled successfully"
          }
        }
      }
    },
    "/api/seller/delete-account": {
      "get": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Get Seller Account Deletion Status",
        "description": "Retrieves the seller's account deletion status, store online status, and scheduled permanent deletion date.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Seller account deletion status",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "isSoftDeleted": {
                          "type": "boolean",
                          "example": false
                        },
                        "isPermanentlyDeleted": {
                          "type": "boolean",
                          "example": false
                        },
                        "isOnline": {
                          "type": "boolean",
                          "example": false
                        },
                        "deletedAt": {
                          "type": "string",
                          "format": "date-time",
                          "nullable": true
                        },
                        "scheduledPermanentDeletionDate": {
                          "type": "string",
                          "format": "date-time",
                          "nullable": true
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
      "post": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Request Seller Account Deletion",
        "description": "Soft deletes the seller account and takes the kitchen offline. Enters a configurable grace period (default 30 days) and cancels if seller logs back in.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "password": {
                    "type": "string",
                    "description": "Optional password verification"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Seller account deletion scheduled successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Seller account deletion requested. Kitchen has been taken offline."
                    }
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Delete Seller Account",
        "description": "Alias for POST /api/seller/delete-account.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Seller account deletion scheduled successfully"
          }
        }
      }
    },
    "/api/cron/account-deletion": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Execute Account Deletion Cron Job",
        "description": "Scans soft-deleted accounts and anonymizes personal details for any accounts whose grace period has expired without removing relational order history.",
        "parameters": [
          {
            "name": "secret",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            },
            "description": "Optional cron secret key if CRON_SECRET is configured in environment."
          }
        ],
        "responses": {
          "200": {
            "description": "Processed expired account deletions",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Processed 0 expired account deletions."
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "scanned": {
                          "type": "number",
                          "example": 2
                        },
                        "processedCount": {
                          "type": "number",
                          "example": 1
                        },
                        "processedUserIds": {
                          "type": "array",
                          "items": {
                            "type": "string"
                          }
                        },
                        "timestamp": {
                          "type": "string",
                          "format": "date-time"
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
      "post": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Trigger Account Deletion Cron Job",
        "description": "Alias for GET /api/cron/account-deletion for automated webhooks.",
        "responses": {
          "200": {
            "description": "Processed expired account deletions"
          }
        }
      }
    },
    "/api/public/coupons/validate": {
      "post": {
        "tags": [
          "Coupons-Discounts"
        ],
        "summary": "Validate Coupon For Cart",
        "description": "Validates a coupon code against current cart items, total amount, and seller requirements, returning calculated discount.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "code",
                  "cartTotal"
                ],
                "properties": {
                  "code": {
                    "type": "string",
                    "example": "FLAT200"
                  },
                  "cartTotal": {
                    "type": "number",
                    "example": 350
                  },
                  "sellerId": {
                    "type": "string",
                    "nullable": true
                  },
                  "items": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Validation result and discount details",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "valid": {
                          "type": "boolean",
                          "example": true
                        },
                        "discountAmount": {
                          "type": "number",
                          "example": 200
                        },
                        "finalTotal": {
                          "type": "number",
                          "example": 150
                        },
                        "coupon": {
                          "type": "object"
                        }
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
    "/api/public/reels": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "Get Curated Public Reels",
        "description": "Returns active curated video reels with linked dishes and kitchens for the mobile/web explore feed.",
        "responses": {
          "200": {
            "description": "List of curated reels",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "reels": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "id": {
                                "type": "string"
                              },
                              "mediaUrl": {
                                "type": "string"
                              },
                              "caption": {
                                "type": "string"
                              },
                              "permalink": {
                                "type": "string"
                              },
                              "seller": {
                                "type": "object"
                              },
                              "foodItem": {
                                "type": "object"
                              }
                            }
                          }
                        }
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
    "/api/public/settings": {
      "get": {
        "tags": [
          "Public-Discovery"
        ],
        "summary": "Get Public System Settings",
        "description": "Retrieves public application configurations such as app brand, default city, operational settings, and features.",
        "responses": {
          "200": {
            "description": "Public system settings",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/seller/export-data": {
      "get": {
        "tags": [
          "Seller-Profile"
        ],
        "summary": "Export Seller Business Data",
        "description": "Exports complete kitchen business profile, dish inventory, and historical orders in JSON/CSV format for archival.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Exported business data",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object"
                    },
                    "message": {
                      "type": "string",
                      "example": "Seller business data exported successfully"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/reels": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "List Administrative Reels",
        "description": "Retrieves all Instagram reels for administrative curation and kitchen tagging.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "required": false,
            "schema": {
              "type": "number",
              "example": 1
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "number",
              "example": 20
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Administrative reels list",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/reels/{id}": {
      "patch": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Update Admin Reel Curation",
        "description": "Updates linked seller, food item, active visibility status, or display order for a reel.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "sellerId": {
                    "type": "string",
                    "nullable": true
                  },
                  "foodItemId": {
                    "type": "string",
                    "nullable": true
                  },
                  "isActive": {
                    "type": "boolean",
                    "example": true
                  },
                  "displayOrder": {
                    "type": "number",
                    "example": 1
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Reel updated successfully"
          }
        }
      },
      "delete": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Delete Admin Reel",
        "description": "Removes a reel from the platform.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Reel deleted successfully"
          }
        }
      }
    },
    "/api/admin/reels/sellers-and-dishes": {
      "get": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Get Sellers and Dishes for Reel Tagging",
        "description": "Retrieves the roster of active verified kitchens and dishes for tagging in reels.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Sellers and dishes list",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/reels/sync": {
      "post": {
        "tags": [
          "Admin-Superadmin"
        ],
        "summary": "Sync Instagram Reels",
        "description": "Triggers Instagram Graph API sync to pull new reels from the brand's connected Instagram account.",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Sync completed successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Instagram reels synced successfully."
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
