# 📱 Neo Cloud Kitchen & Room Rental — Mobile API Documentation

> **Target Audience:** Mobile Application Developers (Flutter, React Native, iOS/Swift, Android/Kotlin)  
> **Backend Architecture:** RESTful HTTP APIs with JSON Payloads & Multipart Document Uploads  
> **Authentication:** Bearer Token (JWT) in HTTP `Authorization` Header  
> **Base URL (Development):** `http://localhost:5000` (or local network IP e.g. `http://192.168.1.X:5000`)  
> **Base URL (Production):** `https://api.yourdomain.com`

---

## 📑 Table of Contents
1. [General API Standards & Headers](#1-general-api-standards--headers)
2. [Authentication & Onboarding APIs](#2-authentication--onboarding-apis)
3. [Public & Discovery APIs (Home, Explore, Search, Storefront)](#3-public--discovery-apis)
4. [Customer / User APIs (Orders, Addresses, Bookings, Subscriptions)](#4-customer--user-apis)
5. [Seller / Kitchen & Property Console APIs](#5-seller--merchant-console-apis)
6. [Delivery Rider Mobile APIs](#6-delivery-rider-mobile-apis)
7. [Helpdesk & Support Ticketing APIs](#7-helpdesk--support-ticketing-apis)
8. [Refunds & Order Cancellation APIs](#8-refunds--cancellation-apis)
9. [Coupons & Promotional Engine APIs](#9-coupons--promotions-apis)
10. [Error Codes & Troubleshooting](#10-error-codes--troubleshooting)

---

## 1. General API Standards & Headers

### Request Headers
For authenticated requests, send the JWT token returned from login:
```http
Authorization: Bearer <JWT_TOKEN_HERE>
Content-Type: application/json
Accept: application/json
```

For file / image upload endpoints (e.g., KYC, Menu Images, Room Photos):
```http
Authorization: Bearer <JWT_TOKEN_HERE>
Content-Type: multipart/form-data
```

### Standard Response Format
Every API response returns a consistent JSON schema:

#### Success Response (`200 OK` / `201 Created`):
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "statusCode": 200
}
```

#### Error Response (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Server Error`):
```json
{
  "success": false,
  "error": "Detailed error message explanation",
  "statusCode": 400
}
```

### User Roles & Mobile App Personas
- **`USER`**: Customers purchasing food, buying meal subscriptions, and booking rooms.
- **`SELLER`**: Cloud kitchen owners & property landlords managing menus, orders, meal plans, rooms, and in-house riders.
- **`DELIVERY`**: Delivery personnel managing order pickups, drop-offs, and cash collection (COD).
- **`AGENT` / `ADMIN`**: Field operations and store verification staff.
- **`SUPERADMIN`**: Platform administrators.

---

## 2. Authentication & Onboarding APIs

### 2.1 User / Seller / Rider Registration
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public
- **Content-Type:** `application/json` (or `multipart/form-data` when uploading documents)
- **Purpose:** Onboards new customers, food/room sellers, or delivery agents.

#### JSON Body (Customer Registration):
```json
{
  "name": "Aman Sharma",
  "email": "aman@example.com",
  "phone": "9876543210",
  "password": "SecurePassword123!",
  "role": "USER",
  "city": "Pune",
  "pincode": "411001"
}
```

#### Multipart/Form-Data Body (Seller Registration with KYC Documents):
| Field | Type | Description |
|---|---|---|
| `name` / `ownerName` | String | Owner's full name |
| `email` | String | Account email |
| `phone` | String | 10-digit mobile number |
| `password` | String | Password |
| `role` | String | `"SELLER"` |
| `sellerType` | String | `"FOOD"`, `"PROPERTY"`, or `"BOTH"` |
| `businessCategory` | String | `"FOOD"`, `"PROPERTY"`, or `"BOTH"` |
| `foodType` | String | `"VEG"`, `"NON_VEG"`, or `"BOTH"` |
| `businessName` | String | Name of the Cloud Kitchen or Residency |
| `city` | String | City name |
| `pincode` | String | 6-digit postal code |
| `addressFlat` | String | Shop/House/Flat Number |
| `addressArea` | String | Street / Locality |
| `addressLandmark` | String | Nearby landmark |
| `latitude` | Float / String | Accurate GPS Latitude for delivery routing (e.g. `18.5204`) |
| `longitude` | Float / String | Accurate GPS Longitude for delivery routing (e.g. `73.8567`) |
| `isLocationPinned` | Boolean / String | `true` if pinned accurately on map |
| `adhaarFrontFile` | File | Aadhaar Front photo |
| `adhaarBackFile` | File | Aadhaar Back photo |
| `fssaiFile` | File | FSSAI Food License certificate |
| `lightBillFile` | File | Electricity / Utility Bill |
| `passbookFile` | File | Bank Passbook / Cancelled Cheque |
| `kitchenImage_0` ... `3` | File | Photos of kitchen premise (up to 4) |
| `cuisineImage_0` ... `3` | File | Photos of signature dishes (up to 4) |
| `roomImage_0` ... `3` | File | Photos of rooms/properties (up to 4) |

#### Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_948194",
      "email": "seller@example.com",
      "name": "Rohan Mehra",
      "role": "SELLER"
    },
    "sellerProfile": {
      "id": "sel_39103",
      "trackingId": "SHOP-A87X2Y",
      "businessName": "Spice Symphony Cloud Kitchen",
      "verificationStatus": "PENDING",
      "latitude": 18.520432,
      "longitude": 73.856743,
      "isLocationPinned": true
    }
  },
  "message": "Registration successful",
  "statusCode": 201
}
```

---

### 2.2 User / Seller / Rider Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Content-Type:** `application/json`
- **Purpose:** Authenticates any user persona and returns a JWT session token (30-day validity).

#### Request Body:
```json
{
  "email": "aman@example.com",
  "password": "SecurePassword123!"
}
```

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzcl85NDgxOTQiLCJlbWFpbCI6ImFtYW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsIm5hbWUiOiJBbWFuIFNoYXJtYSIsImlhdCI6MTc4OTU2MjQyMiwiZXhwIjoxNzkxOTYyNDIyfQ...",
    "user": {
      "id": "usr_948194",
      "name": "Aman Sharma",
      "email": "aman@example.com",
      "role": "USER"
    }
  },
  "message": "Login successful",
  "statusCode": 200
}
```

---

## 3. Public & Discovery APIs

These APIs are publicly accessible without authentication. Used for home screen feeds, category browsing, searching, and viewing restaurant menus / room listings.

### 3.1 Explore & Home Feed
- **Endpoint:** `GET /api/public/explore`
- **Query Params (Optional):**
  - `lat`: User latitude (e.g. `18.5204`)
  - `lng`: User longitude (e.g. `73.8567`)
  - `city`: Filter by city (e.g. `Pune`)
  - `pincode`: Filter by deliverable pincode (e.g. `411001`)
- **Purpose:** Fetches data for the Customer App Home Screen (Promo Banners, Featured Kitchens, Top Rated Dishes, Trending Rooms, Categories).

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "banners": [
      {
        "id": "ban_1",
        "title": "50% OFF First Food Order",
        "imageUrl": "https://res.cloudinary.com/neo/banner1.jpg",
        "linkUrl": "/explore"
      }
    ],
    "categories": [
      {
        "id": "cat_food_1",
        "name": "North Indian Meals",
        "imageUrl": "https://res.cloudinary.com/neo/north_indian.jpg"
      }
    ],
    "featuredKitchens": [
      {
        "id": "sel_39103",
        "trackingId": "SHOP-A87X2Y",
        "businessName": "Annapurna Tiffins",
        "foodType": "VEG",
        "rating": 4.8,
        "reviewCount": 124,
        "bannerImageUrl": "https://res.cloudinary.com/neo/kitchen_banner.jpg",
        "addressLocality": "Kothrud, Pune",
        "isOnline": true
      }
    ],
    "featuredRooms": [
      {
        "id": "room_101",
        "title": "Luxury Single Occupancy Room near IT Park",
        "monthlyRent": 8500,
        "sharingType": "Single",
        "city": "Pune",
        "images": ["https://res.cloudinary.com/neo/room1.jpg"]
      }
    ]
  },
  "statusCode": 200
}
```

---

### 3.2 Global Search
- **Endpoint:** `GET /api/public/search`
- **Query Params:**
  - `q`: Search keyword (e.g. `Paneer Thali`, `Single Room`, `Annapurna`)
  - `type`: Filter type (`FOOD`, `PROPERTY`, `ALL`)
  - `pincode`: Pincode filter (e.g. `411001`)
  - `vegOnly`: `true` or `false`
- **Purpose:** Autocomplete and full search for dishes, restaurants, and rooms.

---

### 3.3 Kitchen / Storefront Details
- **Endpoint:** `GET /api/public/shop/[trackingId]`
- **Example:** `GET /api/public/shop/SHOP-A87X2Y`
- **Purpose:** Fetches complete details of a specific cloud kitchen: operating hours, food menu categorized, active meal subscription plans, customer reviews, ratings, and active discount coupons.

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "kitchen": {
      "id": "sel_39103",
      "trackingId": "SHOP-A87X2Y",
      "businessName": "Annapurna Cloud Kitchen",
      "addressFlat": "Shop 4, Greenfield Heights",
      "addressLocality": "Baner",
      "city": "Pune",
      "isOnline": true,
      "foodType": "BOTH",
      "bannerImageUrl": "https://res.cloudinary.com/neo/banner.jpg"
    },
    "menuItems": [
      {
        "id": "item_1",
        "name": "Special Veg Thali",
        "description": "2 Sabzi, 4 Butter Rotis, Dal Tadka, Jeera Rice, Salad, Gulab Jamun",
        "price": 180.00,
        "itemType": "VEG",
        "imageUrl": "https://res.cloudinary.com/neo/thali.jpg",
        "isAvailable": true,
        "categoryName": "Thalis & Combos"
      }
    ],
    "mealPlans": [
      {
        "id": "plan_1",
        "name": "Weekly Lunch Executive Plan",
        "tier": "Gold",
        "weeklyPrice": "₹699",
        "monthlyPrice": "₹2699",
        "duration": "1 Week",
        "features": [
          "7 Days Daily Hot Lunch",
          "Includes Paneer / Special Sabzi on Weekends",
          "Free Sweet Dish"
        ]
      }
    ],
    "reviews": [
      {
        "id": "rev_1",
        "userName": "Pooja K.",
        "rating": 5,
        "comment": "Homely taste and prompt delivery!",
        "createdAt": "2026-09-10T12:00:00Z",
        "reply": "Thank you for the wonderful review Pooja!"
      }
    ]
  },
  "statusCode": 200
}
```

---

### 3.4 Public Rooms & Coliving Listings
- **Endpoint:** `GET /api/public/rooms`
- **Query Params:**
  - `city`: `Pune`, `Mumbai`, etc.
  - `minRent`: `5000`
  - `maxRent`: `20000`
  - `sharingType`: `Single`, `Double`, `Triple`, `Flat`
  - `gender`: `Boys`, `Girls`, `Unisex`
- **Purpose:** Lists available rooms with pricing, photos, and amenities.

---

### 3.5 Single Room Details & Availability Check
- **Get Room Details:** `GET /api/public/rooms/[id]`
- **Check Availability:** `GET /api/public/rooms/[id]/availability?checkIn=2026-10-01&checkOut=2026-11-01`
- **Purpose:** Shows room deposit, notice period, amenities, location, and validates booking date availability.

---

### 3.6 Promotional Carousels & Pop-up Banners
- **Promo Banners:** `GET /api/public/promo-banners`
- **Pop-up Banners:** `GET /api/public/popup-banners`
- **Coupons:** `GET /api/public/coupons`

---

## 4. Customer / User APIs

> **Authentication Required:** Send `Authorization: Bearer <token>` in headers.

### 4.1 Customer Profile & Saved Addresses
- **Get Profile:** `GET /api/user/profile`
- **Update Profile:** `PUT /api/user/profile` (body: `name`, `phone`, `city`, `pincode`)
- **Get Saved Addresses:** `GET /api/user/addresses`
- **Add Address:** `POST /api/user/addresses`
- **Update Address:** `PUT /api/user/addresses/[id]`
- **Delete Address:** `DELETE /api/user/addresses/[id]`
- **Set Default Address:** `PATCH /api/user/addresses/[id]/default`

#### Add Address Request Body:
```json
{
  "type": "HOME",
  "flat": "Flat 402, Building B",
  "area": "Green Glen Layout, Bellandur",
  "landmark": "Near Central Mall",
  "city": "Bengaluru",
  "pincode": "560103",
  "latitude": 12.9279,
  "longitude": 77.6760,
  "isDefault": true
}
```

---

### 4.2 Food Checkout & Online Payment (Razorpay)
Food checkout follows a secure 2-step flow:
1. **Create Order** (`POST /api/user/orders`): Generates backend order record + Razorpay Order ID.
2. **Verify Payment** (`POST /api/user/orders/verify`): Verifies payment signature and triggers order to kitchen.

#### Step 1: Create Order (`POST /api/user/orders`)
```json
{
  "sellerId": "sel_39103",
  "addressId": "addr_901",
  "paymentMethod": "RAZORPAY",
  "couponCode": "WELCOME50",
  "deliveryInstructions": "Please don't ring bell, leave at security.",
  "items": [
    {
      "foodItemId": "item_1",
      "name": "Special Veg Thali",
      "price": 180.00,
      "quantity": 2
    },
    {
      "foodItemId": "item_4",
      "name": "Fresh Sweet Lassi",
      "price": 50.00,
      "quantity": 1
    }
  ]
}
```

#### Step 1 Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "orderId": "ord_8829104",
    "totalAmount": 410.00,
    "discountAmount": 50.00,
    "deliveryFee": 30.00,
    "taxAmount": 20.00,
    "finalAmount": 410.00,
    "currency": "INR",
    "razorpayOrderId": "order_NX8391kxk291",
    "razorpayKey": "rzp_test_YourKeyHere"
  },
  "statusCode": 200
}
```

#### Step 2: Verify Payment Signature (`POST /api/user/orders/verify`)
*(Called after the mobile Razorpay SDK returns payment success)*
```json
{
  "orderId": "ord_8829104",
  "razorpay_payment_id": "pay_NX839219kxm",
  "razorpay_order_id": "order_NX8391kxk291",
  "razorpay_signature": "9a8f7c9e0b1d3..."
}
```

#### Step 2 Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "orderId": "ord_8829104",
    "status": "PAID",
    "message": "Payment verified and order sent to kitchen."
  },
  "statusCode": 200
}
```

---

### 4.3 Customer Order Tracking & History
- **List All Orders:** `GET /api/user/orders`
- **Get Order Details:** `GET /api/user/orders/[id]`
- **Submit Review:** `POST /api/user/orders/[id]/review`

#### Order Details Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "id": "ord_8829104",
    "status": "OUT_FOR_DELIVERY",
    "totalAmount": 410.00,
    "createdAt": "2026-09-16T17:30:00Z",
    "kitchen": {
      "businessName": "Annapurna Cloud Kitchen",
      "phone": "9811223344"
    },
    "deliveryAgent": {
      "name": "Suresh Patil",
      "phone": "9988776655",
      "vehicleNumber": "MH 12 AB 1234"
    },
    "items": [
      { "name": "Special Veg Thali", "quantity": 2, "price": 180.00 }
    ],
    "deliveryAddress": {
      "flat": "Flat 402, Building B",
      "area": "Green Glen Layout",
      "city": "Bengaluru"
    }
  },
  "statusCode": 200
}
```

---

### 4.4 Room Booking Flow
- **Request Booking:** `POST /api/user/bookings`
- **Initialize Payment:** `POST /api/user/bookings/[id]/pay`
- **Verify Payment:** `POST /api/user/bookings/[id]/verify`
- **List User Bookings:** `GET /api/user/bookings`

---

## 5. Seller / Merchant Console APIs

> **Authentication Required:** Send `Authorization: Bearer <token>` with `role: "SELLER"`.

### 5.1 Seller Dashboard Status & Metrics
- **Get Operating Status:** `GET /api/seller/dashboard/status`
- **Toggle Online/Offline:** `PATCH /api/seller/profile/status` (body: `{"isOnline": true}`)
- **Dashboard Overview Metrics:** `GET /api/seller/dashboard/overview`
  - Returns Today's Sales, Active Orders Count, Pending Food Preparations, Active Subscribers count.

---

### 5.2 Kitchen Food Menu Management
- **List Menu Items:** `GET /api/seller/menu`
- **Add Menu Item:** `POST /api/seller/menu` (Multipart or JSON)
- **Update Menu Item:** `PUT /api/seller/menu/[id]`
- **Delete Menu Item:** `DELETE /api/seller/menu/[id]`
- **Serviceable Pincodes:** `GET /api/seller/menu/pincodes` / `POST /api/seller/menu/pincodes`

#### Add Menu Item Request Body:
```json
{
  "name": "Paneer Butter Masala",
  "description": "Rich tomato butter gravy with cottage cheese cubes",
  "price": 220.00,
  "itemType": "VEG",
  "isAvailable": true,
  "foodCategoryId": "cat_curries",
  "imageUrl": "https://res.cloudinary.com/neo/pbm.jpg",
  "availableDays": "Mon,Tue,Wed,Thu,Fri,Sat,Sun"
}
```

---

### 5.3 Meal Subscription Plan Management
- **List Meal Plans:** `GET /api/seller/meal-plans`
- **Create Meal Plan:** `POST /api/seller/meal-plans`
- **Update Meal Plan:** `PUT /api/seller/meal-plans/[id]`
- **Delete / Archive Meal Plan:** `DELETE /api/seller/meal-plans/[id]`

#### Create Meal Plan Request Body:
```json
{
  "name": "Gold Executive Thali",
  "tier": "Gold",
  "weeklyPrice": "599",
  "monthlyPrice": "2399",
  "quarterlyPrice": "6499",
  "yearlyPrice": "24999",
  "duration": "1 Month",
  "features": [
    "7 Meals per week (Daily Lunch)",
    "1 Paneer Special + 1 Dal Tadka + Rice",
    "Salad, Pickle, Papad & Sweet"
  ],
  "mealTimings": [
    "Breakfast: 7:30 AM – 9:30 AM",
    "Lunch: 12:30 PM – 2:00 PM",
    "Dinner: 8:00 PM – 9:30 PM"
  ],
  "allowCancel": true,
  "pauseBillingPeriod": "30 Days",
  "status": "Live"
}
```

---

### 5.4 Seller Order Management (Kitchen Display System)
- **List Live Orders:** `GET /api/seller/orders` (Filter by status: `PENDING`, `PREPARING`, `READY_FOR_PICKUP`, `DELIVERED`, `CANCELLED`)
- **Update Order State:** `PATCH /api/seller/orders/[orderId]`
  - Body: `{"status": "PREPARING"}` or `{"status": "READY_FOR_PICKUP"}`
- **Assign Delivery Agent / Rider:** `POST /api/seller/orders/[orderId]/assign`
  - Body: `{"deliveryPersonId": "dlv_1092"}`

---

### 5.5 Seller Delivery Rider Management & Cash Handover
- **List Kitchen Delivery Riders:** `GET /api/seller/delivery`
- **Add / Register Rider:** `POST /api/seller/delivery`
- **Rider Details & Pending Cash:** `GET /api/seller/delivery/[id]`
- **Collect / Settle Cash with Rider:** `POST /api/seller/delivery/[id]/collect`
  - Body: `{"amount": 1450.00, "notes": "Evening cash settlement"}`
- **Manual Balance Adjustments:** `POST /api/seller/delivery/[id]/adjust`
- **Transaction History:** `GET /api/seller/delivery/[id]/transactions`

---

### 5.6 Seller Property / Room Management (For Room Sellers)
- **List Rooms:** `GET /api/seller/rooms`
- **Add Room:** `POST /api/seller/rooms`
- **Update Room:** `PUT /api/seller/rooms/[id]`
- **Delete Room:** `DELETE /api/seller/rooms/[id]`
- **Tenant Bookings:** `GET /api/seller/rooms/bookings`

---

### 5.7 Seller Platform Subscription & Tier Upgrades
- **List Platform Subscription Tiers:** `GET /api/seller/subscription/plans`
- **Create Subscription Order:** `POST /api/seller/subscription/create-order`
  - Body: `{"planId": "PLAN_FOOD_PRO", "cycle": "Monthly"}`
- **Verify Subscription Payment:** `POST /api/seller/subscription/verify`
- **Category Upgrade Application (Food -> Both):** `POST /api/seller/category-application`

---

## 6. Delivery Rider Mobile APIs

> **Authentication Required:** Send `Authorization: Bearer <token>` with `role: "DELIVERY"`.

### 6.1 Rider Profile & Live Status
- **Get Profile & Cash in Hand:** `GET /api/delivery/profile`
- **Toggle Online/Offline Duty:** `PATCH /api/delivery/profile` (body: `{"isAvailable": true}`)

#### Profile Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "id": "dlv_1092",
    "name": "Suresh Patil",
    "phone": "9988776655",
    "vehicleNumber": "MH 12 AB 1234",
    "isAvailable": true,
    "cashInHand": 1450.00,
    "todayDeliveriesCount": 8,
    "kitchenName": "Annapurna Cloud Kitchen"
  },
  "statusCode": 200
}
```

---

### 6.2 Assigned Delivery Orders
- **List Assigned Deliveries:** `GET /api/delivery/orders`
- **Update Delivery Progress:** `PATCH /api/delivery/orders/[id]`
  - Body: `{"status": "PICKED_UP"}` | `{"status": "OUT_FOR_DELIVERY"}` | `{"status": "DELIVERED"}`
- **Record COD Cash Collection:** `POST /api/delivery/orders/[id]/pay`
  - Body: `{"amount": 410.00, "paymentMode": "CASH"}`
- **Rider Cash Ledger History:** `GET /api/delivery/transactions`

---

## 7. Helpdesk & Support Ticketing APIs

- **List User Tickets:** `GET /api/tickets`
- **Create Support Ticket:** `POST /api/tickets`
  - Body: `{"subject": "Delay in delivery", "category": "ORDER", "orderId": "ord_8829104", "message": "The order is 30 mins late."}`
- **Get Ticket Thread:** `GET /api/tickets/[id]`
- **Send Reply Message:** `POST /api/tickets/[id]/messages`
  - Body: `{"message": "Thank you, rider has reached now."}`

---

## 8. Refunds & Cancellation APIs

- **List User Refunds:** `GET /api/refunds`
- **Request Order Refund:** `POST /api/refunds`
  - Body: `{"orderId": "ord_8829104", "reason": "Damaged food package", "amount": 180.00}`
- **Refund Status:** `GET /api/refunds/[id]`

---

## 9. Coupons & Promotions APIs

- **List Active Coupons:** `GET /api/coupons`
- **Validate Coupon on Cart:** `GET /api/coupons/[id]?cartValue=400`
- **Response:**
```json
{
  "success": true,
  "data": {
    "code": "WELCOME50",
    "discountType": "PERCENTAGE",
    "discountValue": 20,
    "maxDiscount": 50,
    "minOrderAmount": 199,
    "calculatedDiscount": 50.00
  },
  "statusCode": 200
}
```

---

## 10. Error Codes & Troubleshooting

| HTTP Status | Error Message / Code | Common Cause | Action for Mobile Client |
|---|---|---|---|
| `400` | `Email and password are required` | Empty input fields | Validate before API call |
| `401` | `Invalid credentials` | Incorrect password or email | Show login error toast |
| `401` | `Unauthorized` / `Token expired` | Missing or expired JWT token | Redirect to Login Screen |
| `403` | `Role mismatch` | Trying to log into User app with Seller account | Alert user to use Seller app |
| `404` | `Resource not found` | Invalid item, room, or order ID | Check entity existence |
| `409` | `User already exists` | Phone or email registered | Suggest password reset / login |
| `500` | `Internal Server Error` | Database or unhandled error | Display retry alert |

---

## 💡 Mobile Integration Checklist for Developers

1. **Token Persistence**: Store the `token` in `EncryptedSharedPreferences` (Android) / `Keychain` (iOS) / `flutter_secure_storage`.
2. **Global Network Interceptor**: Add a 401 interceptor in Axios / Dio / Alamofire to auto-clear session and redirect to `/login` if token expires.
3. **Razorpay SDK Integration**:
   - Use the returned `razorpayOrderId` and `razorpayKey` to trigger native Razorpay Checkout.
   - On success callback, always call `POST /api/user/orders/verify` to confirm backend persistence.
4. **Offline Resilience**: Cache menu items and user profile using SQLite / Room / Hive for faster app startup.
5. **Real-time Order Updates**: Poll `GET /api/user/orders/[id]` every 15 seconds during active delivery or connect to WebSocket status events.
