/**
 * Utility to convert the full Seller Business Data payload into a clean, Excel / CSV compatible spreadsheet.
 */

function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function convertBusinessDataToCSV(data: any): string {
  const rows: string[] = [];

  const addLine = (...cells: any[]) => {
    rows.push(cells.map(escapeCsvCell).join(","));
  };

  const addBlank = () => {
    rows.push("");
  };

  // Section 1: Header / Metadata
  addLine("=== BUSINESS DATA EXPORT ===");
  addLine("Exported At", data?.metadata?.exportedAt || new Date().toISOString());
  addLine("Platform", data?.metadata?.platform || "Neo Cloud Kitchen Business Operations Console");
  addLine("Business ID", data?.metadata?.businessId || "");
  addLine("Tracking ID", data?.metadata?.trackingId || "");
  addLine("Business Name", data?.metadata?.businessName || "");
  addBlank();

  // Section 2: Business Profile
  const profile = data?.businessProfile || {};
  addLine("=== BUSINESS PROFILE ===");
  addLine("Business / Kitchen Name", profile.businessName || "");
  addLine("Owner Name", profile.ownerName || "");
  addLine("Email Address", profile.email || "");
  addLine("Phone Number", profile.phone || "");
  addLine("City", profile.city || "");
  addLine("Address", `${profile.addressFlat ? profile.addressFlat + ", " : ""}${profile.addressLocality || ""}`);
  addLine("Pincode", profile.pincode || "");
  addLine("Business Category", profile.businessCategory || "");
  addLine("Food Type", profile.foodType || "");
  addLine("Store Online Status", profile.isOnline ? "Online" : "Offline");
  addLine("Verification Status", profile.verificationStatus || "");
  addLine("Joined Date", profile.joinedDate ? new Date(profile.joinedDate).toLocaleString() : "");
  addBlank();

  // Section 3: Summary Metrics
  const ordersData = data?.ordersAndSales || {};
  const reviewsData = data?.customerReviews || {};
  const menuData = data?.foodMenu || {};
  const offersData = data?.promotionalOffers || {};
  addLine("=== BUSINESS PERFORMANCE SUMMARY ===");
  addLine("Total Food Menu Items", menuData.totalItems ?? 0);
  addLine("Total Orders Placed", ordersData.totalOrders ?? 0);
  addLine("Delivered Orders", ordersData.deliveredOrders ?? 0);
  addLine("Total Revenue (INR)", ordersData.totalRevenue ?? 0);
  addLine("Customer Reviews Count", reviewsData.totalReviews ?? 0);
  addLine("Average Customer Rating", `${reviewsData.averageRating ?? 0} / 5.0`);
  addLine("Active Promotional Coupons", offersData.totalCoupons ?? 0);
  addBlank();

  // Section 4: Food Menu Items
  const foodItems = menuData.items || [];
  addLine("=== FOOD MENU CATALOG ===");
  addLine("Item Name", "Price (INR)", "Food Type", "Availability", "Stock Quantity", "Open Time", "Close Time", "Delivery Pincodes", "Description");
  if (foodItems.length > 0) {
    foodItems.forEach((item: any) => {
      addLine(
        item.name || "",
        item.price ?? 0,
        item.itemType || "VEG",
        item.isAvailable ? "Available" : "Unavailable",
        item.stockQuantity === -1 ? "Unlimited" : (item.stockQuantity ?? "N/A"),
        item.openTime || "N/A",
        item.closeTime || "N/A",
        item.deliveryPincodes || "All",
        item.description || ""
      );
    });
  } else {
    addLine("No food items registered in menu catalog");
  }
  addBlank();

  // Section 5: Orders & Sales
  const orders = ordersData.orders || [];
  addLine("=== ORDERS AND SALES RECORDS ===");
  addLine("Order ID", "Date", "Status", "Total Amount (INR)", "Payment Status", "Payment Method", "Delivery Address", "Items Summary");
  if (orders.length > 0) {
    orders.forEach((o: any) => {
      const itemsSummary = Array.isArray(o.items)
        ? o.items.map((i: any) => `${i.name || i.title || "Item"} x${i.quantity || 1}`).join("; ")
        : String(o.items || "");
      addLine(
        o.orderId || "",
        o.orderDate ? new Date(o.orderDate).toLocaleString() : "",
        o.status || "",
        o.totalAmount ?? 0,
        o.isPaid ? "Paid" : "Pending",
        o.paymentMethod || "COD",
        o.deliveryAddress || "",
        itemsSummary
      );
    });
  } else {
    addLine("No order history found");
  }
  addBlank();

  // Section 6: Promotional Offers & Coupons
  const coupons = offersData.coupons || [];
  addLine("=== PROMOTIONAL OFFERS & COUPONS ===");
  addLine("Coupon Code", "Description", "Discount Type", "Discount", "Min Cart Value (INR)", "Max Discount (INR)", "Usage Limit", "Status", "Valid Until");
  if (coupons.length > 0) {
    coupons.forEach((c: any) => {
      const discountVal = c.discountType === "PERCENTAGE" 
        ? `${c.discountPercentage || 0}%` 
        : `INR ${c.discountAmount || 0}`;
      addLine(
        c.code || "",
        c.description || "",
        c.discountType || "",
        discountVal,
        c.minimumCartValue ?? 0,
        c.maxDiscountAmount ?? "No Cap",
        c.usageLimit ?? "Unlimited",
        c.isActive ? "Active" : "Inactive",
        c.noExpiry ? "Never Expires" : (c.validUntil ? new Date(c.validUntil).toLocaleDateString() : "N/A")
      );
    });
  } else {
    addLine("No coupons configured");
  }
  addBlank();

  // Section 7: Customer Reviews
  const reviews = reviewsData.reviews || [];
  addLine("=== CUSTOMER REVIEWS & RATINGS ===");
  addLine("Review ID", "Rating", "Review Comment", "Date");
  if (reviews.length > 0) {
    reviews.forEach((r: any) => {
      addLine(
        r.id || "",
        `${r.rating || 0} / 5`,
        r.comment || "",
        r.createdAt ? new Date(r.createdAt).toLocaleString() : ""
      );
    });
  } else {
    addLine("No customer reviews recorded");
  }
  addBlank();

  // Section 8: Subscriptions
  const subscriptions = data?.subscriptions || [];
  addLine("=== SUBSCRIPTIONS & PLATFORM PLANS ===");
  addLine("Subscription ID", "Plan Name", "Category", "Amount Paid (INR)", "Status", "Valid Until", "Date");
  if (subscriptions.length > 0) {
    subscriptions.forEach((s: any) => {
      addLine(
        s.id || "",
        s.planName || "Standard Plan",
        s.category || "BOTH",
        s.amountPaid ?? 0,
        s.status || "ACTIVE",
        s.validUntil ? new Date(s.validUntil).toLocaleDateString() : "N/A",
        s.createdAt ? new Date(s.createdAt).toLocaleString() : ""
      );
    });
  } else {
    addLine("No active subscription records found");
  }

  // Prepend UTF-8 BOM so Excel opens with correct character encoding
  return "\uFEFF" + rows.join("\r\n");
}
