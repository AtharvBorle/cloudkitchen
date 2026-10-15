import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../src/lib/swagger-spec';

const spec = JSON.parse(JSON.stringify(swaggerSpec));

// 1. Ensure Tags
const existingTags = new Set(spec.tags.map((t: any) => t.name));

const newTags = [
  {
    name: "Customer-Notifications",
    description: "Customer notification center, unread counters, preferences, and dismissals"
  },
  {
    name: "Documentation",
    description: "Interactive OpenAPI specification and developer documentation"
  }
];

for (const t of newTags) {
  if (!existingTags.has(t.name)) {
    spec.tags.push(t);
  }
}

// 2. Add /api/seller/notifications DELETE method if missing
if (spec.paths["/api/seller/notifications"]) {
  if (!spec.paths["/api/seller/notifications"].delete) {
    spec.paths["/api/seller/notifications"].delete = {
      tags: ["Seller-Notifications"],
      summary: "Clear All Seller Notifications",
      description: "Permanently clears all active notifications for the authenticated seller.",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "All notifications cleared permanently",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "All notifications cleared permanently" },
                  cleared: { type: "boolean", example: true },
                  clearedAt: { type: "string", example: "2026-10-15T05:00:00.000Z" }
                }
              }
            }
          }
        },
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    };
  }
}

// 3. New Paths to Add
const newPaths: Record<string, any> = {
  "/api/user/notifications": {
    get: {
      tags: ["Customer-Notifications"],
      summary: "Get Customer Notifications",
      description: "Fetch real-time notifications for the authenticated customer including live order status updates, meal subscription deliveries, room bookings, coupons, and support messages.",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "category",
          in: "query",
          description: "Filter notifications by category (all, orders, subscriptions, bookings, offers, support, system, unread)",
          schema: {
            type: "string",
            enum: ["all", "orders", "subscriptions", "bookings", "offers", "support", "system", "unread"],
            default: "all"
          }
        },
        {
          name: "severity",
          in: "query",
          description: "Filter by severity level",
          schema: {
            type: "string",
            enum: ["all", "info", "success", "warning", "critical"],
            default: "all"
          }
        },
        {
          name: "unreadOnly",
          in: "query",
          description: "When true, returns only unread notifications",
          schema: { type: "boolean", default: false }
        },
        {
          name: "limit",
          in: "query",
          description: "Maximum number of notifications to return",
          schema: { type: "integer", default: 50 }
        }
      ],
      responses: {
        200: {
          description: "Customer notifications list with unread counter and category metrics",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Customer notifications fetched successfully" },
                  data: {
                    type: "object",
                    properties: {
                      unreadCount: { type: "integer", example: 3 },
                      totalCount: { type: "integer", example: 12 },
                      filteredCount: { type: "integer", example: 12 },
                      countsByCategory: {
                        type: "object",
                        properties: {
                          all: { type: "integer", example: 12 },
                          orders: { type: "integer", example: 5 },
                          subscriptions: { type: "integer", example: 4 },
                          bookings: { type: "integer", example: 1 },
                          offers: { type: "integer", example: 2 },
                          support: { type: "integer", example: 0 },
                          system: { type: "integer", example: 0 }
                        }
                      },
                      notifications: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "user-ord-cm8190-delivered" },
                            category: { type: "string", example: "orders" },
                            title: { type: "string", example: "Order Delivered! - #A1B2C3" },
                            message: { type: "string", example: "Your meal from Royal Kitchen was delivered successfully. Enjoy your food!" },
                            details: { type: "string", example: "Total: ₹380 • Payment: Online (PAID)" },
                            timestamp: { type: "string", example: "2026-10-15T10:30:00.000Z" },
                            timeAgo: { type: "string", example: "25m ago" },
                            isRead: { type: "boolean", example: false },
                            severity: { type: "string", enum: ["info", "success", "warning", "critical"], example: "success" },
                            actionLabel: { type: "string", example: "View Order" },
                            actionHref: { type: "string", example: "/orders" }
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
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    },
    patch: {
      tags: ["Customer-Notifications"],
      summary: "Mark All Customer Notifications as Read",
      description: "Marks all current notifications as read for the authenticated customer.",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "All notifications marked as read",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "All customer notifications marked as read" },
                  data: {
                    type: "object",
                    properties: {
                      count: { type: "integer", example: 12 }
                    }
                  }
                }
              }
            }
          }
        },
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    },
    delete: {
      tags: ["Customer-Notifications"],
      summary: "Clear All Customer Notifications",
      description: "Permanently clears all active notifications for the authenticated customer.",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "All notifications cleared permanently",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "All customer notifications cleared permanently" },
                  data: {
                    type: "object",
                    properties: {
                      cleared: { type: "boolean", example: true },
                      clearedAt: { type: "string", example: "2026-10-15T10:45:00.000Z" }
                    }
                  }
                }
              }
            }
          }
        },
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    }
  },

  "/api/user/notifications/count": {
    get: {
      tags: ["Customer-Notifications"],
      summary: "Get Customer Unread Notification Count",
      description: "Returns the unread notification badge counter and category breakdown for the customer header/navigation.",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Unread count summary",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Customer unread notification count fetched successfully" },
                  data: {
                    type: "object",
                    properties: {
                      unreadCount: { type: "integer", example: 3 },
                      totalCount: { type: "integer", example: 12 },
                      countsByCategory: {
                        type: "object",
                        properties: {
                          all: { type: "integer", example: 12 },
                          orders: { type: "integer", example: 5 },
                          subscriptions: { type: "integer", example: 4 },
                          bookings: { type: "integer", example: 1 },
                          offers: { type: "integer", example: 2 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    }
  },

  "/api/user/notifications/{id}": {
    patch: {
      tags: ["Customer-Notifications"],
      summary: "Mark Single Customer Notification as Read / Unread",
      description: "Marks a specific customer notification as read or unread.",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Notification ID",
          schema: { type: "string" },
          example: "user-ord-cm8190-delivered"
        }
      ],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                isRead: { type: "boolean", default: true }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: "Notification read state updated",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Notification marked as read" },
                  data: {
                    type: "object",
                    properties: {
                      notificationId: { type: "string", example: "user-ord-cm8190-delivered" },
                      isRead: { type: "boolean", example: true }
                    }
                  }
                }
              }
            }
          }
        },
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    },
    delete: {
      tags: ["Customer-Notifications"],
      summary: "Dismiss / Delete Single Customer Notification",
      description: "Permanently removes a specific notification from the customer's view.",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Notification ID",
          schema: { type: "string" },
          example: "user-ord-cm8190-delivered"
        }
      ],
      responses: {
        200: {
          description: "Notification dismissed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Notification dismissed successfully" },
                  data: {
                    type: "object",
                    properties: {
                      notificationId: { type: "string", example: "user-ord-cm8190-delivered" },
                      dismissed: { type: "boolean", example: true }
                    }
                  }
                }
              }
            }
          }
        },
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    }
  },

  "/api/user/notifications/preferences": {
    get: {
      tags: ["Customer-Notifications"],
      summary: "Get Customer Notification Preferences",
      description: "Fetches user notification channel and alert preferences.",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Customer notification preferences",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Customer notification preferences fetched successfully" },
                  data: {
                    type: "object",
                    properties: {
                      orderUpdates: { type: "boolean", example: true },
                      promoOffers: { type: "boolean", example: true },
                      newMenu: { type: "boolean", example: true },
                      deliveryAlerts: { type: "boolean", example: true },
                      pushEnabled: { type: "boolean", example: true },
                      emailEnabled: { type: "boolean", example: true },
                      smsEnabled: { type: "boolean", example: true }
                    }
                  }
                }
              }
            }
          }
        },
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    },
    put: {
      tags: ["Customer-Notifications"],
      summary: "Update Customer Notification Preferences",
      description: "Updates user notification channels (push, email, SMS) and alert categories.",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                orderUpdates: { type: "boolean", example: true },
                promoOffers: { type: "boolean", example: true },
                newMenu: { type: "boolean", example: true },
                deliveryAlerts: { type: "boolean", example: true },
                pushEnabled: { type: "boolean", example: true },
                emailEnabled: { type: "boolean", example: true },
                smsEnabled: { type: "boolean", example: true }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: "Preferences updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Customer notification preferences updated successfully" },
                  data: {
                    type: "object",
                    properties: {
                      preferences: {
                        type: "object",
                        properties: {
                          orderUpdates: { type: "boolean" },
                          promoOffers: { type: "boolean" },
                          newMenu: { type: "boolean" },
                          deliveryAlerts: { type: "boolean" },
                          pushEnabled: { type: "boolean" },
                          emailEnabled: { type: "boolean" },
                          smsEnabled: { type: "boolean" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    }
  },

  "/api/public/meal-plans/slots": {
    get: {
      tags: ["Public-Discovery", "Seller-Meal-Plans"],
      summary: "Get Predefined Platform Meal Slots",
      description: "Returns the 6 standardized platform meal slots (Breakfast, Morning Meal, Lunch, Evening Snack, Dinner, Late-Night Snack) and centrally configured delivery timing windows.",
      responses: {
        200: {
          description: "List of standardized meal slots",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Predefined meal slots fetched successfully" },
                  data: {
                    type: "object",
                    properties: {
                      slots: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "breakfast" },
                            name: { type: "string", example: "Breakfast" },
                            subtitle: { type: "string", example: "Morning breakfast / Nasta" },
                            defaultTimeRange: { type: "string", example: "07:30 AM – 09:30 AM" },
                            order: { type: "integer", example: 1 },
                            isActive: { type: "boolean", example: true }
                          }
                        }
                      },
                      total: { type: "integer", example: 6 }
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

  "/api/seller/meal-plans/deliveries": {
    get: {
      tags: ["Seller-Meal-Plans"],
      summary: "Get Seller Meal Subscription Deliveries",
      description: "Fetches scheduled meal deliveries for the seller for a specific date, with optional slot filtering (breakfast, morning_meal, lunch, evening_snack, dinner, late_night_snack) and slot delivery counters.",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "date",
          in: "query",
          description: "Scheduled date in YYYY-MM-DD format (defaults to today)",
          schema: { type: "string", example: "2026-10-15" }
        },
        {
          name: "slotId",
          in: "query",
          description: "Meal slot filter ID (breakfast, morning_meal, lunch, evening_snack, dinner, late_night_snack) or 'all'",
          schema: { type: "string", default: "all", example: "lunch" }
        },
        {
          name: "status",
          in: "query",
          description: "Delivery status filter (PENDING, DELIVERED, NOT_DELIVERED, SKIPPED_PAUSED)",
          schema: { type: "string" }
        },
        {
          name: "search",
          in: "query",
          description: "Search keyword matching customer name, phone, address, or subscription ID",
          schema: { type: "string" }
        }
      ],
      responses: {
        200: {
          description: "Deliveries list with slot breakdown counts",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Meal subscription deliveries fetched successfully" },
                  data: {
                    type: "object",
                    properties: {
                      date: { type: "string", example: "2026-10-15" },
                      slotId: { type: "string", example: "all" },
                      totalDeliveries: { type: "integer", example: 14 },
                      slotCounts: {
                        type: "object",
                        properties: {
                          all: { type: "integer", example: 14 },
                          breakfast: { type: "integer", example: 5 },
                          morning_meal: { type: "integer", example: 2 },
                          lunch: { type: "integer", example: 4 },
                          evening_snack: { type: "integer", example: 1 },
                          dinner: { type: "integer", example: 2 },
                          late_night_snack: { type: "integer", example: 0 }
                        }
                      },
                      deliveries: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "del_123" },
                            subscriptionId: { type: "string" },
                            slotId: { type: "string", example: "lunch" },
                            slotName: { type: "string", example: "Lunch" },
                            scheduledTime: { type: "string", example: "12:30 PM – 02:00 PM" },
                            status: { type: "string", example: "PENDING" },
                            scheduledDate: { type: "string", example: "2026-10-15" },
                            subscription: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                tier: { type: "string", example: "Bronze" },
                                deliveryAddress: { type: "string" },
                                contactPhone: { type: "string" },
                                user: {
                                  type: "object",
                                  properties: {
                                    id: { type: "string" },
                                    name: { type: "string", example: "Rahul Sharma" },
                                    phone: { type: "string", example: "9876543210" }
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
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    }
  },

  "/api/seller/meal-plans/delivery-status": {
    post: {
      tags: ["Seller-Meal-Plans"],
      summary: "Update Meal Slot Delivery Status",
      description: "Marks a scheduled meal subscription delivery occurrence as DELIVERED, NOT_DELIVERED, PENDING, or SKIPPED_PAUSED.",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["subscriptionId", "date", "status"],
              properties: {
                subscriptionId: { type: "string", example: "sub_12345" },
                date: { type: "string", example: "2026-10-15" },
                slotId: { type: "string", example: "lunch" },
                status: {
                  type: "string",
                  enum: ["PENDING", "DELIVERED", "NOT_DELIVERED", "SKIPPED_PAUSED"],
                  example: "DELIVERED"
                },
                note: { type: "string", example: "Handed over to recipient" }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: "Delivery status updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Meal delivery status updated successfully" },
                  data: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      delivery: { type: "object" }
                    }
                  }
                }
              }
            }
          }
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    },
    patch: {
      tags: ["Seller-Meal-Plans"],
      summary: "Update Meal Slot Delivery Status (PATCH)",
      description: "Alias to POST /api/seller/meal-plans/delivery-status",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["subscriptionId", "date", "status"],
              properties: {
                subscriptionId: { type: "string" },
                date: { type: "string" },
                slotId: { type: "string" },
                status: { type: "string" },
                note: { type: "string" }
              }
            }
          }
        }
      },
      responses: {
        200: { description: "Delivery status updated successfully" }
      }
    },
    put: {
      tags: ["Seller-Meal-Plans"],
      summary: "Update Meal Slot Delivery Status (PUT)",
      description: "Alias to POST /api/seller/meal-plans/delivery-status",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["subscriptionId", "date", "status"],
              properties: {
                subscriptionId: { type: "string" },
                date: { type: "string" },
                slotId: { type: "string" },
                status: { type: "string" },
                note: { type: "string" }
              }
            }
          }
        }
      },
      responses: {
        200: { description: "Delivery status updated successfully" }
      }
    }
  },

  "/api/seller/meal-plans/timings": {
    get: {
      tags: ["Seller-Meal-Plans"],
      summary: "Get Meal Subscription Delivery Timings",
      description: "Fetches current configured delivery windows for all standardized meal slots.",
      responses: {
        200: {
          description: "Timings configuration",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Meal subscription timings fetched successfully" },
                  data: {
                    type: "object",
                    properties: {
                      slots: { type: "array", items: { type: "object" } },
                      total: { type: "integer", example: 6 }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    put: {
      tags: ["Seller-Meal-Plans"],
      summary: "Update Central Meal Slot Delivery Timings",
      description: "Updates delivery time windows for meal slots. Accepts single slot timing ({ slotId, defaultTimeRange }) or dictionary ({ timings: { [slotId]: timeRange } }).",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                slotId: { type: "string", example: "breakfast" },
                defaultTimeRange: { type: "string", example: "07:30 AM – 09:30 AM" },
                timings: {
                  type: "object",
                  additionalProperties: { type: "string" },
                  example: {
                    breakfast: "07:30 AM – 09:30 AM",
                    lunch: "12:30 PM – 02:00 PM"
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: "Timings updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Meal subscription timings updated successfully." },
                  data: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      timings: { type: "object" }
                    }
                  }
                }
              }
            }
          }
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    },
    patch: {
      tags: ["Seller-Meal-Plans"],
      summary: "Update Central Meal Slot Delivery Timings (PATCH)",
      description: "Alias to PUT /api/seller/meal-plans/timings",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                slotId: { type: "string" },
                defaultTimeRange: { type: "string" }
              }
            }
          }
        }
      },
      responses: {
        200: { description: "Timings updated successfully" }
      }
    },
    post: {
      tags: ["Seller-Meal-Plans"],
      summary: "Update Central Meal Slot Delivery Timings (POST)",
      description: "Alias to PUT /api/seller/meal-plans/timings",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                slotId: { type: "string" },
                defaultTimeRange: { type: "string" }
              }
            }
          }
        }
      },
      responses: {
        200: { description: "Timings updated successfully" }
      }
    }
  },

  "/api/public/live/stream": {
    get: {
      tags: ["Public-Discovery"],
      summary: "Public Real-Time Live Shop Event Stream (SSE)",
      description: "Server-Sent Events (SSE) stream for public live kitchen statuses, order broadcasts, and item availability.",
      parameters: [
        {
          name: "sellerId",
          in: "query",
          description: "Optional seller ID filter",
          schema: { type: "string" }
        }
      ],
      responses: {
        200: {
          description: "Event stream connection established",
          content: {
            "text/event-stream": {
              schema: { type: "string", example: "event: connected\ndata: {\"connected\":true}" }
            }
          }
        }
      }
    }
  },

  "/api/categories": {
    get: {
      tags: ["Public-Discovery"],
      summary: "Public Categories Discovery (Root Alias)",
      description: "Fetches food categories, subcategories, and active category trees for customer discovery.",
      responses: {
        200: {
          description: "Categories list",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Categories fetched successfully" },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string", example: "Indian Thali" },
                        slug: { type: "string", example: "indian-thali" }
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

  "/api/explore": {
    get: {
      tags: ["Public-Discovery"],
      summary: "Public Explore Page Discovery (Root Alias)",
      description: "Aggregates featured cloud kitchens, top dishes, active banners, and room listings for mobile and web explore screens.",
      responses: {
        200: {
          description: "Explore composite data",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Explore data fetched successfully" },
                  data: {
                    type: "object",
                    properties: {
                      sellers: { type: "array", items: { type: "object" } },
                      dishes: { type: "array", items: { type: "object" } },
                      rooms: { type: "array", items: { type: "object" } },
                      banners: { type: "array", items: { type: "object" } }
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

  "/api/meal-plans": {
    get: {
      tags: ["Public-Discovery", "Customer-Meal-Subscriptions"],
      summary: "Public Active Meal Plans (Root Alias)",
      description: "Fetches active recurring seller meal subscription plans available for customer subscription.",
      responses: {
        200: {
          description: "Public meal plans list",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Meal plans fetched successfully" },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string", example: "Student Saver Plan" },
                        tier: { type: "string", example: "Bronze" },
                        weeklyPrice: { type: "string", example: "₹899" },
                        monthlyPrice: { type: "string", example: "₹3499" },
                        duration: { type: "string", example: "1 Month" },
                        features: { type: "array", items: { type: "string" } }
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

  "/api/promo-banners": {
    get: {
      tags: ["Public-Discovery"],
      summary: "Public Home Promo Banners (Root Alias)",
      description: "Returns currently active promotional and advertising banners displayed on mobile and desktop home feeds.",
      responses: {
        200: {
          description: "Active promo banners list",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Promo banners fetched successfully" },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string", example: "Flat 20% Off Weekend Feast" },
                        imageUrl: { type: "string" },
                        linkUrl: { type: "string" },
                        isActive: { type: "boolean", example: true }
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

  "/api/search": {
    get: {
      tags: ["Public-Discovery"],
      summary: "Public Global Search (Root Alias)",
      description: "Performs instant fuzzy search across food dishes, cloud kitchen restaurants, and room rental listings.",
      parameters: [
        {
          name: "q",
          in: "query",
          description: "Keyword or dish name to search",
          schema: { type: "string", example: "paneer" }
        },
        {
          name: "category",
          in: "query",
          description: "Category ID filter",
          schema: { type: "string" }
        }
      ],
      responses: {
        200: {
          description: "Search results",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      dishes: { type: "array", items: { type: "object" } },
                      sellers: { type: "array", items: { type: "object" } },
                      rooms: { type: "array", items: { type: "object" } }
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

  "/api/docs": {
    get: {
      tags: ["Documentation"],
      summary: "Get OpenAPI 3.0.3 Specification JSON",
      description: "Returns the complete, live OpenAPI 3.0.3 specification JSON used by Swagger UI.",
      responses: {
        200: {
          description: "OpenAPI specification JSON object",
          content: {
            "application/json": {
              schema: { type: "object" }
            }
          }
        }
      }
    }
  }
};

// Merge into spec.paths
for (const [p, def] of Object.entries(newPaths)) {
  spec.paths[p] = def;
}

// Write back to backend/src/lib/swagger-spec.ts
const targetFile = path.join(__dirname, '../src/lib/swagger-spec.ts');
const fileContent = `/**
 * Complete OpenAPI 3.0.3 Specification for Neo Cloud Kitchen & Room Rental API
 * Includes full Bearer Token authorization and all 160+ backend endpoints.
 */

export const swaggerSpec = ${JSON.stringify(spec, null, 2)};
`;

fs.writeFileSync(targetFile, fileContent, 'utf8');
console.log('Successfully updated swagger-spec.ts!');
console.log('Total paths now in Swagger spec:', Object.keys(spec.paths).length);
