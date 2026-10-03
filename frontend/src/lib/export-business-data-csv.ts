/**
 * Utility to convert the full Seller Business Data payload into a clean, Excel / CSV compatible spreadsheet.
 * Ensures zero #ERROR! formula injection errors and no undefined values.
 */

function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value).trim();
  if (str === "undefined" || str === "null" || str === "NaN") {
    return '""';
  }

  // Prevent Spreadsheet Formula Injection (which causes #ERROR! in Excel / Google Sheets)
  // If string starts with '=', '+', '-', or '@' and is not a valid number:
  if (/^[=\+\-@]/.test(str) && isNaN(Number(str))) {
    str = str.replace(/^[=\+\-@\s]+/, "").trim();
  }

  return `"${str.replace(/"/g, '""')}"`;
}

function formatDate(dateVal: any): string {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function formatDateShort(dateVal: any): string {
  if (!dateVal) return "N/A";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
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
  addLine("BUSINESS DATA EXPORT");
  addLine("Exported At", data?.metadata?.exportedAt || new Date().toISOString());
  addLine("Platform", data?.metadata?.platform || "Neo Cloud Kitchen Business Operations Console");
  addLine("Business ID", data?.metadata?.businessId || "");
  addLine("Tracking ID", data?.metadata?.trackingId || "");
  addLine("Business Name", data?.metadata?.businessName || "");
  addBlank();

  // Section 2: Business Profile
  const profile = data?.businessProfile || {};
  const fullAddress = [profile.addressFlat, profile.addressLocality]
    .filter((part) => Boolean(part && String(part).trim() && String(part) !== "undefined" && String(part) !== "null"))
    .join(", ");

  addLine("BUSINESS PROFILE");
  addLine("Business / Kitchen Name", profile.businessName || "");
  addLine("Owner Name", profile.ownerName || "");
  addLine("Email Address", profile.email || "");
  addLine("Phone Number", profile.phone || "");
  addLine("City", profile.city || "");
  addLine("Address", fullAddress || "");
  addLine("Pincode", profile.pincode || "");
  addLine("Business Category", profile.businessCategory || "FOOD");
  addLine("Food Type", profile.foodType || "BOTH");
  addLine("Store Online Status", profile.isOnline ? "Online" : "Offline");
  addLine("Verification Status", profile.verificationStatus || "APPROVED");
  addLine("Joined Date", formatDate(profile.joinedDate));
  addBlank();

  // Section 3: Summary Metrics
  const ordersData = data?.ordersAndSales || {};
  const reviewsData = data?.customerReviews || {};
  const menuData = data?.foodMenu || {};
  const offersData = data?.promotionalOffers || {};

  addLine("BUSINESS PERFORMANCE SUMMARY");
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
  addLine("FOOD MENU CATALOG");
  addLine("Item Name", "Price (INR)", "Food Type", "Availability", "Stock Quantity", "Open Time", "Close Time", "Delivery Pincodes", "Description");
  if (foodItems.length > 0) {
    foodItems.forEach((item: any) => {
      let stockDisplay = "N/A";
      if (item.stockQuantity !== undefined && item.stockQuantity !== null) {
        stockDisplay = item.stockQuantity === -1 ? "Unlimited" : String(item.stockQuantity);
      }

      addLine(
        item.name || "",
        item.price !== undefined && item.price !== null ? item.price : 0,
        item.itemType || "VEG",
        item.isAvailable ? "Available" : "Unavailable",
        stockDisplay,
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
  addLine("ORDERS AND SALES RECORDS");
  addLine("Order ID", "Date", "Status", "Total Amount (INR)", "Payment Status", "Payment Method", "Delivery Address", "Items Summary");
  if (orders.length > 0) {
    orders.forEach((o: any) => {
      let itemsSummary = "";
      if (Array.isArray(o.items)) {
        itemsSummary = o.items
          .map((i: any) => `${i.name || i.title || "Item"} x${i.quantity || 1}`)
          .join("; ");
      } else if (o.items && typeof o.items === "string") {
        try {
          const parsed = JSON.parse(o.items);
          if (Array.isArray(parsed)) {
            itemsSummary = parsed
              .map((i: any) => `${i.name || i.title || "Item"} x${i.quantity || 1}`)
              .join("; ");
          } else {
            itemsSummary = o.items;
          }
        } catch {
          itemsSummary = o.items;
        }
      }

      addLine(
        o.orderId || "",
        formatDate(o.orderDate),
        o.status || "",
        o.totalAmount !== undefined && o.totalAmount !== null ? o.totalAmount : 0,
        o.isPaid ? "Paid" : "Pending",
        o.paymentMethod || "COD",
        o.deliveryAddress || "",
        itemsSummary || "N/A"
      );
    });
  } else {
    addLine("No order history found");
  }
  addBlank();

  // Section 6: Promotional Offers & Coupons
  const coupons = offersData.coupons || [];
  addLine("PROMOTIONAL OFFERS AND COUPONS");
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
        c.minimumCartValue !== undefined && c.minimumCartValue !== null ? c.minimumCartValue : 0,
        c.maxDiscountAmount !== undefined && c.maxDiscountAmount !== null ? c.maxDiscountAmount : "No Cap",
        c.usageLimit !== undefined && c.usageLimit !== null ? c.usageLimit : "Unlimited",
        c.isActive ? "Active" : "Inactive",
        c.noExpiry ? "Never Expires" : formatDateShort(c.validUntil)
      );
    });
  } else {
    addLine("No coupons configured");
  }
  addBlank();

  // Section 7: Customer Reviews
  const reviews = reviewsData.reviews || [];
  addLine("CUSTOMER REVIEWS AND RATINGS");
  addLine("Review ID", "Rating", "Review Comment", "Date");
  if (reviews.length > 0) {
    reviews.forEach((r: any) => {
      addLine(
        r.id || "",
        `${r.rating !== undefined && r.rating !== null ? r.rating : 0} / 5`,
        r.comment || "",
        formatDate(r.createdAt)
      );
    });
  } else {
    addLine("No customer reviews recorded");
  }
  addBlank();

  // Section 8: Subscriptions
  const subscriptions = data?.subscriptions || [];
  addLine("SUBSCRIPTIONS AND PLATFORM PLANS");
  addLine("Subscription ID", "Plan Name", "Category", "Amount Paid (INR)", "Status", "Valid Until", "Date");
  if (subscriptions.length > 0) {
    subscriptions.forEach((s: any) => {
      addLine(
        s.id || "",
        s.planName || "Standard Plan",
        s.category || "BOTH",
        s.amountPaid !== undefined && s.amountPaid !== null ? s.amountPaid : 0,
        s.status || "ACTIVE",
        formatDateShort(s.validUntil),
        formatDate(s.createdAt)
      );
    });
  } else {
    addLine("No active subscription records found");
  }

  // Prepend UTF-8 BOM so Excel/Sheets opens with proper UTF-8 character encoding
  return "\uFEFF" + rows.join("\r\n");
}
