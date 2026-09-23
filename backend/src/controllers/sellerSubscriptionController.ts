import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Razorpay from "razorpay";
import crypto from "crypto";
import { ApiError } from "@/lib/api-error";

export const createSubscriptionOrder = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to purchase a subscription.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile could not be found. Please complete your registration.", 404);
    }

    if (sellerProfile.verificationStatus !== "APPROVED") {
        throw new ApiError("Your seller profile must be approved by admin before purchasing a subscription.", 403);
    }

    const body = await req.json();
    const { planId, couponCode } = body;

    if (!planId) {
        throw new ApiError("Subscription Plan ID is required.", 400);
    }

    let priceAmount = 0;
    let plan: any = null;
    try {
        plan = await db.subscriptionPlan.findUnique({
            where: { id: planId }
        });
        if (plan) {
            priceAmount = plan.price;
        } else {
            throw new ApiError("The selected subscription plan could not be found.", 404);
        }
    } catch (e: any) {
        if (e instanceof ApiError) throw e;
        console.error("Could not fetch plan pricing details:", e);
        throw new ApiError("Unable to load plan details. Please try again.", 500);
    }

    // Coupon Validation Logic securely on the backend
    if (couponCode) {
        const coupon = await db.subscriptionCoupon.findUnique({
            where: { code: couponCode.toUpperCase() }
        });

        if (!coupon) {
            throw new ApiError("The entered coupon code is invalid.", 404);
        }

        if (!coupon.isActive) {
            throw new ApiError("This coupon code has expired or is no longer active.", 400);
        }

        if (coupon.planId && coupon.planId !== planId) {
            throw new ApiError("This coupon is not applicable to the selected subscription plan.", 400);
        }

        const isCategoryMatch = 
            !coupon.category || 
            coupon.category === "BOTH" || 
            plan.category === "BOTH" || 
            coupon.category === plan.category;

        if (!isCategoryMatch) {
            throw new ApiError(`This coupon is only valid for ${coupon.category} subscription plans.`, 400);
        }

        if (coupon.maxUsage > 0 && coupon.currentUsage >= coupon.maxUsage) {
            throw new ApiError("This coupon has reached its maximum usage limit.", 400);
        }

        let discount = 0;
        if (coupon.discountPercentage) {
            discount = (priceAmount * coupon.discountPercentage) / 100;
        } else if (coupon.discountAmount) {
            discount = coupon.discountAmount;
        }

        // Apply discount ensuring we don't drop below 0
        discount = Math.min(discount, priceAmount);
        priceAmount = Math.max(0, priceAmount - discount);
    }

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || "",
        key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });

    const receiptId = `r_${sellerProfile.id.substring(0, 8)}_${Date.now()}`.substring(0, 39);
    const options = {
        amount: Math.round(priceAmount * 100),
        currency: "INR",
        receipt: receiptId,
        notes: { planId: planId, couponCode: couponCode ? couponCode.toUpperCase() : "" }
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
        throw new ApiError("Failed to initiate payment gateway order. Please try again.", 500);
    }

    return {
        orderId: order.id,
        amount: priceAmount,
        key: process.env.RAZORPAY_KEY_ID
    };
};

export const verifySubscriptionPayment = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to verify your subscription payment.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amountPaid } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError("Payment verification details are incomplete.", 400);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile could not be found.", 404);
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError("Payment signature verification failed. Please try again.", 400);
    }

    const razorpay = new (require("razorpay"))({
        key_id: process.env.RAZORPAY_KEY_ID || "",
        key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const planId = order?.notes?.planId;
    const couponCode = order?.notes?.couponCode;

    if (!planId) {
        throw new ApiError("Invalid payment format: Subscription Plan ID missing.", 400);
    }

    const plan = await db.subscriptionPlan.findUnique({
        where: { id: planId }
    });
    if (!plan) {
        throw new ApiError("The requested subscription plan is no longer available.", 404);
    }

    const durationMonths = plan.durationMonths || 1;
    const planCategory = plan.category || "BOTH";

    // Find the latest active subscription for the same category to stack/extend validity
    const latestActiveSub = await db.subscription.findFirst({
        where: {
            sellerId: sellerProfile.id,
            status: "ACTIVE",
            validUntil: {
                gt: new Date()
            },
            plan: {
                category: {
                    in: planCategory === "BOTH" ? ["FOOD", "PROPERTY", "BOTH"] : [planCategory, "BOTH"]
                }
            }
        },
        orderBy: {
            validUntil: "desc"
        }
    });

    const baseDate = latestActiveSub ? new Date(latestActiveSub.validUntil) : new Date();
    const validUntil = new Date(baseDate);
    validUntil.setMonth(validUntil.getMonth() + durationMonths);

    const newSubscription = await (db as any).subscription.create({
        data: {
            sellerId: sellerProfile.id,
            planId: planId,
            status: "ACTIVE",
            amount: parseFloat(amountPaid) || plan.price,
            validUntil: validUntil,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            appliedCoupon: couponCode || null
        }
    });

    // Update seller businessCategory and verification statuses if applicable
    let targetCategory = sellerProfile.businessCategory;

    if (planCategory === "BOTH") {
        targetCategory = "BOTH";
    } else if (planCategory === "FOOD" && sellerProfile.businessCategory === "PROPERTY") {
        targetCategory = "BOTH";
    } else if (planCategory === "PROPERTY" && sellerProfile.businessCategory === "FOOD") {
        targetCategory = "BOTH";
    }

    const updateData: any = {};
    if (targetCategory !== sellerProfile.businessCategory) {
        updateData.businessCategory = targetCategory;
    }

    if (sellerProfile.verificationStatus === "APPROVED") {
        if ((planCategory === "FOOD" || planCategory === "BOTH") && sellerProfile.foodVerificationStatus !== "APPROVED") {
            updateData.foodVerificationStatus = "APPROVED";
        }
        if ((planCategory === "PROPERTY" || planCategory === "BOTH") && sellerProfile.propertyVerificationStatus !== "APPROVED") {
            updateData.propertyVerificationStatus = "APPROVED";
        }
    }

    if (Object.keys(updateData).length > 0) {
        await db.sellerProfile.update({
            where: { id: sellerProfile.id },
            data: updateData
        });
    }

    // If a coupon was used, safely increment its usage count
    if (couponCode) {
        try {
            await db.subscriptionCoupon.update({
                where: { code: couponCode.toUpperCase() },
                data: { currentUsage: { increment: 1 } }
            });
        } catch (e) {
            console.error("Failed to increment coupon usage:", e);
        }
    }

    return { subscription: newSubscription };
};
