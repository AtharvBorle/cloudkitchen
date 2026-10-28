export interface TaxCalculatorItem {
    id?: string;
    foodItemId?: string;
    name: string;
    quantity: number;
    price: number;
    discountPercentage?: number | null;
    discountAmount?: number | null;
    hsn?: string;
    sku?: string;
    addonsTotal?: number;
    selectedAddons?: any[];
}

export interface TaxBreakdownItem {
    id: string;
    name: string;
    hsn: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    grossAmount: number;
    discountAmount: number;
    taxableValue: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    totalAmount: number;
    selectedAddons?: any[];
}

export interface TaxCalculationResult {
    taxMode: "TAX_INCLUSIVE" | "TAX_EXCLUSIVE";
    productTaxRate: number;
    deliveryTaxRate: number;
    items: TaxBreakdownItem[];
    productGross: number;
    productDiscount: number;
    productTaxable: number;
    productGst: number;
    productCgst: number;
    productSgst: number;
    productTotal: number;
    deliveryGross: number;
    deliveryTaxable: number;
    deliveryGst: number;
    deliveryCgst: number;
    deliverySgst: number;
    deliveryTotal: number;
    grandTotal: number;
}

export interface CalculateTaxParams {
    items: TaxCalculatorItem[];
    sellerTaxMode?: "TAX_INCLUSIVE" | "TAX_EXCLUSIVE" | string;
    productTaxRate?: number;
    deliveryTaxRate?: number;
    deliveryCharge?: number;
    orderCouponDiscount?: number;
    eligibleItemIds?: string[];
}

export function cleanNumericPrice(val: any, defaultVal = 0): number {
    if (typeof val === "number") return isNaN(val) ? defaultVal : val;
    if (!val) return defaultVal;
    const s = String(val).trim().toLowerCase();
    if (s === "free" || s === "null" || s === "undefined") return 0;
    const cleaned = s.replace(/[^0-9.-]/g, "").trim();
    if (!cleaned) return defaultVal;
    const num = parseFloat(cleaned);
    return isNaN(num) ? defaultVal : num;
}

export function round2(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function calculateOrderTax(params: CalculateTaxParams): TaxCalculationResult {
    const taxMode: "TAX_INCLUSIVE" | "TAX_EXCLUSIVE" =
        params.sellerTaxMode === "TAX_EXCLUSIVE" ? "TAX_EXCLUSIVE" : "TAX_INCLUSIVE";

    const productTaxRate = typeof params.productTaxRate === "number" && !isNaN(params.productTaxRate)
        ? params.productTaxRate
        : 5.0;

    const deliveryTaxRate = typeof params.deliveryTaxRate === "number" && !isNaN(params.deliveryTaxRate)
        ? params.deliveryTaxRate
        : 18.0;

    const rawDeliveryCharge = typeof params.deliveryCharge === "number" && !isNaN(params.deliveryCharge)
        ? Math.max(0, params.deliveryCharge)
        : 0.0;

    const items = params.items || [];
    const cgstRate = round2(productTaxRate / 2);
    const sgstRate = round2(productTaxRate - cgstRate);

    // 1. Compute gross for each item and direct item discounts
    interface TempItem {
        raw: TaxCalculatorItem;
        gross: number;
        directDiscount: number;
        eligibleForCoupon: boolean;
        allocatedCouponDiscount: number;
    }

    const eligibleIdsSet = params.eligibleItemIds && params.eligibleItemIds.length > 0
        ? new Set(params.eligibleItemIds.map(id => String(id).toLowerCase()))
        : null;

    let totalEligibleGross = 0;
    const tempItems: TempItem[] = items.map((it) => {
        const qty = Math.max(1, cleanNumericPrice(it.quantity || (it as any).qty, 1));
        let price = cleanNumericPrice(it.price || (it as any).unitPrice, 0);
        if (price === 0) {
            const totalVal = cleanNumericPrice((it as any).total || (it as any).lineTotal, 0);
            if (totalVal > 0) price = Math.round((totalVal / qty) * 100) / 100;
        }
        if (price === 0) {
            const base = cleanNumericPrice((it as any).basePrice, 0);
            const addons = cleanNumericPrice((it as any).addonsTotal || (it as any).addonsSubtotal, 0);
            if (base + addons > 0) price = base + addons;
        }
        const gross = round2(price * qty);

        let directDisc = 0;
        if (it.discountPercentage && it.discountPercentage > 0) {
            directDisc = round2(gross * (it.discountPercentage / 100));
        } else if (it.discountAmount && it.discountAmount > 0) {
            directDisc = round2(Math.min(gross, it.discountAmount));
        }

        const rawItemId = String(it.foodItemId || it.id || "").toLowerCase();
        const isEligible = eligibleIdsSet ? eligibleIdsSet.has(rawItemId) : true;

        if (isEligible) {
            totalEligibleGross += gross;
        }

        return {
            raw: it,
            gross,
            directDiscount: directDisc,
            eligibleForCoupon: isEligible,
            allocatedCouponDiscount: 0,
        };
    });

    // 2. Proportionally allocate order coupon discount across eligible items
    const rawCouponDiscount = Math.max(0, Number(params.orderCouponDiscount) || 0);
    const effectiveCouponDiscount = Math.min(rawCouponDiscount, totalEligibleGross);

    if (effectiveCouponDiscount > 0 && totalEligibleGross > 0) {
        let allocatedSum = 0;
        const eligibleItems = tempItems.filter(t => t.eligibleForCoupon);

        eligibleItems.forEach((t, idx) => {
            if (idx === eligibleItems.length - 1) {
                // Last eligible item gets remainder to avoid rounding mismatch
                t.allocatedCouponDiscount = round2(effectiveCouponDiscount - allocatedSum);
            } else {
                const share = round2(effectiveCouponDiscount * (t.gross / totalEligibleGross));
                t.allocatedCouponDiscount = share;
                allocatedSum = round2(allocatedSum + share);
            }
        });
    }

    // 3. Calculate taxable values and GST for each item
    const pRateDecimal = productTaxRate / 100;
    const breakdownItems: TaxBreakdownItem[] = tempItems.map((t, index) => {
        const totalDiscount = round2(t.directDiscount + t.allocatedCouponDiscount);
        const finalDiscountedAmount = Math.max(0, round2(t.gross - totalDiscount));

        let taxableValue = 0;
        let gst = 0;
        let cgst = 0;
        let sgst = 0;
        let total = 0;

        if (taxMode === "TAX_INCLUSIVE") {
            taxableValue = round2(finalDiscountedAmount / (1 + pRateDecimal));
            gst = round2(finalDiscountedAmount - taxableValue);
            cgst = round2(gst / 2);
            sgst = round2(gst - cgst);
            total = finalDiscountedAmount;
        } else {
            // TAX_EXCLUSIVE
            taxableValue = finalDiscountedAmount;
            gst = round2(taxableValue * pRateDecimal);
            cgst = round2(gst / 2);
            sgst = round2(gst - cgst);
            total = round2(taxableValue + gst);
        }

        return {
            id: String(t.raw.id || t.raw.foodItemId || `item-${index + 1}`),
            name: t.raw.name || "Food Item",
            hsn: t.raw.hsn || "996331", // Restaurant services standard SAC code
            sku: t.raw.sku,
            quantity: Math.max(1, Number(t.raw.quantity) || 1),
            unitPrice: Number(t.raw.price) || 0,
            grossAmount: t.gross,
            discountAmount: totalDiscount,
            taxableValue,
            cgstRate,
            cgstAmount: cgst,
            sgstRate,
            sgstAmount: sgst,
            totalAmount: total,
            selectedAddons: t.raw.selectedAddons,
        };
    });

    // 4. Summarize Product Totals
    const productGross = round2(breakdownItems.reduce((acc, it) => acc + it.grossAmount, 0));
    const productDiscount = round2(breakdownItems.reduce((acc, it) => acc + it.discountAmount, 0));
    const productTaxable = round2(breakdownItems.reduce((acc, it) => acc + it.taxableValue, 0));
    const productCgst = round2(breakdownItems.reduce((acc, it) => acc + it.cgstAmount, 0));
    const productSgst = round2(breakdownItems.reduce((acc, it) => acc + it.sgstAmount, 0));
    const productGst = round2(productCgst + productSgst);
    const productTotal = round2(breakdownItems.reduce((acc, it) => acc + it.totalAmount, 0));

    // 5. Delivery Calculations
    const dRateDecimal = deliveryTaxRate / 100;
    const deliveryCgstRate = round2(deliveryTaxRate / 2);
    const deliverySgstRate = round2(deliveryTaxRate - deliveryCgstRate);

    let deliveryGross = rawDeliveryCharge;
    let deliveryTaxable = 0;
    let deliveryGst = 0;
    let deliveryCgst = 0;
    let deliverySgst = 0;
    let deliveryTotal = 0;

    if (rawDeliveryCharge > 0) {
        if (taxMode === "TAX_INCLUSIVE") {
            deliveryTotal = rawDeliveryCharge;
            deliveryTaxable = round2(rawDeliveryCharge / (1 + dRateDecimal));
            deliveryGst = round2(rawDeliveryCharge - deliveryTaxable);
            deliveryCgst = round2(deliveryGst / 2);
            deliverySgst = round2(deliveryGst - deliveryCgst);
        } else {
            // TAX_EXCLUSIVE
            deliveryTaxable = rawDeliveryCharge;
            deliveryGst = round2(deliveryTaxable * dRateDecimal);
            deliveryCgst = round2(deliveryGst / 2);
            deliverySgst = round2(deliveryGst - deliveryCgst);
            deliveryTotal = round2(deliveryTaxable + deliveryGst);
        }
    }

    const grandTotal = round2(productTotal + deliveryTotal);

    return {
        taxMode,
        productTaxRate,
        deliveryTaxRate,
        items: breakdownItems,
        productGross,
        productDiscount,
        productTaxable,
        productGst,
        productCgst,
        productSgst,
        productTotal,
        deliveryGross,
        deliveryTaxable,
        deliveryGst,
        deliveryCgst,
        deliverySgst,
        deliveryTotal,
        grandTotal,
    };
}

/**
 * Authoritative single engine to calculate order breakdown and invoice math.
 * Standardizes breakdown calculation across:
 * - User Checkout & Cart
 * - Customer Invoices
 * - Seller Tax Invoices
 * - User & Seller Order Details & Dashboards
 */
export function getOrderBreakdown(order: any): TaxCalculationResult {
    if (!order) {
        return calculateOrderTax({ items: [] });
    }

    // 1. Authoritative check: If order has taxBreakdown stored from checkout, use it directly!
    const rawBreakdown = order.taxBreakdown || order.rawOrder?.taxBreakdown;
    if (rawBreakdown) {
        try {
            const parsed = typeof rawBreakdown === "string" ? JSON.parse(rawBreakdown) : rawBreakdown;
            if (
                parsed &&
                typeof parsed.grandTotal === "number" &&
                Array.isArray(parsed.items) &&
                parsed.items.length > 0
            ) {
                if (typeof parsed.productGross !== "number") {
                    parsed.productGross = round2(parsed.items.reduce((acc: number, it: any) => acc + (Number(it.grossAmount) || 0), 0));
                }
                return parsed;
            }
        } catch {}
    }

    // 2. Failsafe calculation using order items and fields matching checkout/cart
    let rawItems: any[] = [];
    try {
        const itemSource = order.rawOrder?.items || order.items || order.rawItems;
        if (typeof itemSource === "string") {
            rawItems = JSON.parse(itemSource);
        } else if (Array.isArray(itemSource)) {
            rawItems = itemSource;
        }
    } catch {
        rawItems = [];
    }

    let sellerTaxMode = order.taxMode || order.rawOrder?.taxMode || order.seller?.taxMode;
    const pTaxRate = cleanNumericPrice(order.productTaxRate || order.rawOrder?.productTaxRate, 5.0);
    const dTaxRate = cleanNumericPrice(order.deliveryTaxRate || order.rawOrder?.deliveryTaxRate, 18.0);

    let dCharge = 0;
    if (typeof order.deliveryCharge === "number") {
        dCharge = order.deliveryCharge;
    } else if (typeof order.rawOrder?.deliveryCharge === "number") {
        dCharge = order.rawOrder.deliveryCharge;
    } else if (order.deliveryFee !== undefined && order.deliveryFee !== null) {
        dCharge = cleanNumericPrice(order.deliveryFee, 0);
    } else if (typeof order.seller?.deliveryCharge === "number") {
        dCharge = order.seller.deliveryCharge;
    }

    let couponDiscount = cleanNumericPrice(
        order.discount ||
        order.rawOrder?.discount ||
        order.couponDiscount ||
        order.productDiscount ||
        order.appliedCoupon?.discountAmount ||
        order.billBreakdown?.discount,
        0
    );

    const mappedItems: TaxCalculatorItem[] = rawItems.map((it: any) => {
        const qty = Math.max(1, cleanNumericPrice(it.quantity || it.qty, 1));
        let price = cleanNumericPrice(it.price || it.unitPrice, 0);
        if (price === 0) {
            const totalVal = cleanNumericPrice(it.total || it.lineTotal, 0);
            if (totalVal > 0) price = Math.round((totalVal / qty) * 100) / 100;
        }
        if (price === 0) {
            const base = cleanNumericPrice(it.basePrice, 0);
            const addons = cleanNumericPrice(it.addonsTotal || it.addonsSubtotal, 0);
            if (base + addons > 0) price = base + addons;
        }
        return {
            id: it.id || it.foodItemId,
            foodItemId: it.foodItemId || it.id,
            name: it.name || "Food Item",
            quantity: qty,
            price: price,
            discountAmount: cleanNumericPrice(it.discountAmount, 0),
            addonsTotal: cleanNumericPrice(it.addonsTotal || it.addonsSubtotal, 0),
            selectedAddons: it.selectedAddons || it.addons || [],
            hsn: it.hsn || "996331",
            sku: it.sku,
        };
    });

    const totalItemGross = mappedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    if (totalItemGross === 0) {
        const fallbackSubtotal = cleanNumericPrice(
            order.subtotal ||
            order.billBreakdown?.itemTotal ||
            order.productGross ||
            (order.totalAmount !== undefined && order.totalAmount !== null ? order.totalAmount : undefined) ||
            order.total ||
            order.grandTotal,
            0
        );

        if (fallbackSubtotal > 0) {
            mappedItems.push({
                id: "item-1",
                name: order.dishName || "Ordered Food Item",
                quantity: 1,
                price: fallbackSubtotal,
                discountAmount: 0,
                addonsTotal: 0,
                selectedAddons: [],
                hsn: "996331",
            });
        }
    }

    if (couponDiscount === 0 && order.appliedCoupon?.discountPercentage && totalItemGross > 0) {
        couponDiscount = round2((totalItemGross * order.appliedCoupon.discountPercentage) / 100);
    }

    // Intelligent auto-detection: If taxMode was not explicitly supplied, compare with stored total
    if (!sellerTaxMode) {
        const storedTotal = cleanNumericPrice(order.totalAmount || order.grandTotal || order.total, 0);
        if (storedTotal > 0) {
            const netProd = Math.max(0, totalItemGross - couponDiscount);
            const exclEst = round2(round2(netProd * (1 + pTaxRate / 100)) + round2(dCharge * (1 + dTaxRate / 100)));
            const inclEst = round2(netProd + dCharge);
            if (Math.abs(storedTotal - exclEst) < Math.abs(storedTotal - inclEst)) {
                sellerTaxMode = "TAX_EXCLUSIVE";
            } else {
                sellerTaxMode = "TAX_INCLUSIVE";
            }
        } else {
            sellerTaxMode = "TAX_INCLUSIVE";
        }
    }

    return calculateOrderTax({
        items: mappedItems,
        sellerTaxMode,
        productTaxRate: pTaxRate,
        deliveryTaxRate: dTaxRate,
        deliveryCharge: dCharge,
        orderCouponDiscount: couponDiscount,
    });
}

export const getTaxCalculationForOrder = getOrderBreakdown;
