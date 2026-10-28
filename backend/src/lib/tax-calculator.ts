export interface TaxCalculatorItem {
    id?: string;
    foodItemId?: string;
    name: string;
    quantity: number;
    price: number;
    discountPercentage?: number | null;
    discountAmount?: number | null;
    hsn?: string;
    addonsTotal?: number;
    selectedAddons?: any[];
}

export interface TaxBreakdownItem {
    id: string;
    name: string;
    hsn: string;
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
