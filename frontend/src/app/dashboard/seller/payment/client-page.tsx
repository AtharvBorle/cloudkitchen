"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import Script from "next/script";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function SellerPaymentClient({ plans, statusData }: { plans: any[]; statusData: any }) {
    const searchParams = useSearchParams();
    const queryPlanId = searchParams.get("planId");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string>(queryPlanId || (plans.length > 0 ? plans[0].id : ""));
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponError, setCouponError] = useState("");

    useEffect(() => {
        if (!selectedPlanId && plans.length > 0) {
            setSelectedPlanId(plans[0].id);
        }
    }, [plans, selectedPlanId]);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setCouponError("");
        setAppliedCoupon(null);

        try {
            const res = await fetchApi("/api/seller/subscriptions/validate-coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: couponCode, planId: selectedPlanId })
            });
            const data = await res.json();

            if (res.ok && data.valid) {
                setAppliedCoupon(data);
            } else {
                setCouponError(data.message || "Invalid coupon");
            }
        } catch (error) {
            setCouponError("Failed to validate coupon");
        }
    };

    const handlePayment = async () => {
        setIsLoading(true);

        try {
            if (!selectedPlanId) {
                alert("Please select a plan to continue.");
                setIsLoading(false);
                return;
            }

            const orderRes = await fetchApi("/api/seller/subscription/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId: selectedPlanId, couponCode: appliedCoupon ? couponCode : undefined })
            });
            const orderData = await orderRes.json();

            if (!orderRes.ok) {
                alert(orderData.message || "Failed to create order");
                setIsLoading(false);
                return;
            }

            // Using the amount from the order creation response since it factors in coupons safely on the backend
            const finalAmount = orderData.amount;

            const options = {
                key: orderData.key,
                amount: finalAmount * 100,
                currency: "INR",
                name: "Cloud Kitchen Setup",
                description: "Monthly Vendor Subscription",
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    const verifyRes = await fetchApi("/api/seller/subscription/verify", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            amountPaid: orderData.amount
                        }),
                    });

                    if (verifyRes.ok) {
                        alert("Subscription activated successfully!");
                        window.location.href = "/dashboard/seller";
                    } else {
                        const verifyData = await verifyRes.json();
                        alert(verifyData.message || "Payment verification failed.");
                    }
                },
                theme: {
                    color: "#F16F68",
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on("payment.failed", function (response: any) {
                alert("Payment cancelled or failed");
            });
            rzp.open();

        } catch (error) {
            console.error("Payment error:", error);
            alert("Payment gateway error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f8fafc", padding: "1.25rem" }}>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <div style={{ backgroundColor: "white", padding: "2rem 1.25rem", borderRadius: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.06)", maxWidth: "500px", width: "100%", border: "1px solid #e2e8f0" }}>

                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.5rem" }}>
                    <Link href="/dashboard/seller" style={{ display: "flex", alignItems: "center", gap: "5px", color: "#F16F68", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600" }}>
                        ← Back to Dashboard
                    </Link>
                </div>

                <div style={{ textAlign: "center" }}>
                    <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                        <ShieldCheck size={36} color="#16a34a" />
                    </div>

                    <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", marginBottom: "0.5rem", letterSpacing: "-0.5px" }}>Choose Your Plan</h1>
                    <p style={{ color: "#64748b", marginBottom: "2rem", fontSize: "1rem", lineHeight: "1.5" }}>
                        Select a plan to subscribe or upgrade your cloud store.
                    </p>
                </div>

                {statusData?.hasActiveSub && (() => {
                    const activeSubs = statusData.activeSubs || [];
                    const foodSubs = activeSubs.filter((s: any) => s.plan?.category === 'FOOD' || s.plan?.category === 'BOTH');
                    const foodExpiry = foodSubs.length > 0 
                        ? new Date(Math.max(...foodSubs.map((s: any) => new Date(s.validUntil).getTime()))) 
                        : null;
                    const propertySubs = activeSubs.filter((s: any) => s.plan?.category === 'PROPERTY' || s.plan?.category === 'BOTH');
                    const propertyExpiry = propertySubs.length > 0 
                        ? new Date(Math.max(...propertySubs.map((s: any) => new Date(s.validUntil).getTime()))) 
                        : null;

                    const getStackedSubs = (subsList: any[]) => {
                        const sorted = [...subsList].sort((a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime());
                        return sorted.map((sub, index) => {
                            const expiry = new Date(sub.validUntil);
                            let start = new Date(sub.createdAt);
                            if (index > 0) {
                                start = new Date(sorted[index - 1].validUntil);
                            }
                            return {
                                ...sub,
                                startDate: start,
                                endDate: expiry
                            };
                        });
                    };

                    return (
                        <div style={{ 
                            backgroundColor: "#f0fdf4", 
                            border: "1px solid #bbf7d0", 
                            borderRadius: "18px", 
                            padding: "1.25rem", 
                            marginBottom: "1.5rem",
                            textAlign: "left"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontWeight: "800", marginBottom: "12px", fontSize: "0.95rem" }}>
                                <ShieldCheck size={18} /> Active Subscriptions
                            </div>
                            
                            {foodExpiry && (() => {
                                const stackedFood = getStackedSubs(foodSubs);
                                return (
                                    <div style={{ marginBottom: propertyExpiry ? "1.5rem" : "0", borderBottom: propertyExpiry ? "1px dashed #bbf7d0" : "none", paddingBottom: propertyExpiry ? "1.5rem" : "0" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", marginBottom: "8px" }}>
                                            <div>
                                                <span style={{ fontSize: "0.95rem", color: "#1e293b", display: "block" }}>Food Services</span>
                                                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{stackedFood.length} plan{stackedFood.length > 1 ? 's' : ''} active/stacked</span>
                                            </div>
                                            <span style={{ fontSize: "0.75rem", backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold", alignSelf: "flex-start" }}>FOOD</span>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "10px 0" }}>
                                            {stackedFood.map((sub: any, idx: number) => (
                                                <div key={sub.id} style={{ fontSize: '0.8rem', color: '#4A5568', backgroundColor: 'white', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', marginBottom: '2px', color: '#2D3748' }}>
                                                        <span>{idx + 1}. {sub.plan?.name || "Subscription Plan"}</span>
                                                        <span style={{ color: '#16a34a' }}>₹{sub.amount || sub.plan?.price}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: '#718096' }}>
                                                        Purchased: {new Date(sub.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: '#4A5568', marginTop: '2px', fontWeight: '500' }}>
                                                        Validity: {sub.startDate.toLocaleDateString()} - {sub.endDate.toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "bold", color: "#1e293b", borderTop: "1px solid #dcfce7", paddingTop: "8px" }}>
                                            <span>Final Expiry:</span>
                                            <span style={{ color: "#15803d" }}>{foodExpiry.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {propertyExpiry && (() => {
                                const stackedProperty = getStackedSubs(propertySubs);
                                return (
                                    <div style={{ marginTop: foodExpiry ? "1.5rem" : "0" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", marginBottom: "8px" }}>
                                            <div>
                                                <span style={{ fontSize: "0.95rem", color: "#1e293b", display: "block" }}>Property Bookings</span>
                                                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{stackedProperty.length} plan{stackedProperty.length > 1 ? 's' : ''} active/stacked</span>
                                            </div>
                                            <span style={{ fontSize: "0.75rem", backgroundColor: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold", alignSelf: "flex-start" }}>PROPERTY</span>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "10px 0" }}>
                                            {stackedProperty.map((sub: any, idx: number) => (
                                                <div key={sub.id} style={{ fontSize: '0.8rem', color: '#4A5568', backgroundColor: 'white', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', marginBottom: '2px', color: '#2D3748' }}>
                                                        <span>{idx + 1}. {sub.plan?.name || "Subscription Plan"}</span>
                                                        <span style={{ color: '#3B82F6' }}>₹{sub.amount || sub.plan?.price}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: '#718096' }}>
                                                        Purchased: {new Date(sub.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: '#4A5568', marginTop: '2px', fontWeight: '500' }}>
                                                        Validity: {sub.startDate.toLocaleDateString()} - {sub.endDate.toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "bold", color: "#1e293b", borderTop: "1px solid #dbeafe", paddingTop: "8px" }}>
                                            <span>Final Expiry:</span>
                                            <span style={{ color: "#1e40af" }}>{propertyExpiry.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    );
                })()}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "2rem" }}>
                    {plans.length === 0 ? (
                        <p style={{ color: "#64748b" }}>No plans available. Please contact support.</p>
                    ) : (
                        plans.map((plan) => (
                            <div
                                key={plan.id}
                                onClick={() => {
                                    setSelectedPlanId(plan.id);
                                    setAppliedCoupon(null);
                                    setCouponError("");
                                }}
                                style={{
                                    backgroundColor: selectedPlanId === plan.id ? "#fff0ef" : "white",
                                    padding: "1.25rem",
                                    borderRadius: "18px",
                                    border: selectedPlanId === plan.id ? "2px solid var(--primary)" : "1px solid #F1F5F9",
                                    cursor: "pointer",
                                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    textAlign: "left",
                                    boxShadow: selectedPlanId === plan.id ? "0 10px 20px rgba(241, 111, 104, 0.1)" : "none"
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{
                                            width: "22px", height: "22px", borderRadius: "50%",
                                            border: selectedPlanId === plan.id ? "7px solid var(--primary)" : "2px solid #E2E8F0",
                                            backgroundColor: "white",
                                            flexShrink: 0
                                        }} />
                                        <span style={{ fontWeight: "800", color: selectedPlanId === plan.id ? "var(--primary)" : "#1E293B", fontSize: "1.1rem" }}>{plan.name}</span>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "#0f172a", lineHeight: 1 }}>₹{plan.price}</div>
                                        <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px" }}>{plan.durationMonths}mo</div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {plan.features.map((feature: string, idx: number) => (
                                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "0.85rem", backgroundColor: "#F8FAFC", padding: "4px 10px", borderRadius: "20px" }}>
                                            <CheckCircle2 size={12} color="#10b981" /> {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Coupon Code Section */}
                {plans.length > 0 && (
                    <div style={{ marginBottom: "2rem", textAlign: "left", padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                        <div style={{ fontWeight: "700", marginBottom: "10px", color: "#334155", fontSize: "0.95rem" }}>Have a Coupon Code?</div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => {
                                    setCouponCode(e.target.value);
                                    setAppliedCoupon(null);
                                    setCouponError("");
                                }}
                                disabled={appliedCoupon !== null}
                                placeholder="Enter code here"
                                style={{
                                    flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1",
                                    outline: "none", fontSize: "1rem", textTransform: "uppercase"
                                }}
                            />
                            {appliedCoupon ? (
                                <button
                                    onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                                    style={{ padding: "0 15px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}
                                >
                                    Remove
                                </button>
                            ) : (
                                <button
                                    onClick={handleApplyCoupon}
                                    style={{ padding: "0 20px", backgroundColor: "#334155", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}
                                >
                                    Apply
                                </button>
                            )}
                        </div>
                        {couponError && <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "8px", fontWeight: "600" }}>{couponError}</div>}

                        {appliedCoupon && (
                            <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#dcfce7", borderRadius: "8px", border: "1px solid #86efac", color: "#166534" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "0.9rem" }}>Original Price:</span>
                                    <span style={{ textDecoration: "line-through", color: "#64748b" }}>₹{appliedCoupon.originalPrice}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "0.9rem", color: "#15803d", fontWeight: "bold" }}>Discount Applied:</span>
                                    <span style={{ color: "#15803d", fontWeight: "bold" }}>-₹{appliedCoupon.discount}</span>
                                </div>
                                <hr style={{ borderColor: "#86efac", margin: "8px 0" }} />
                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "900", fontSize: "1.1rem" }}>
                                    <span>New Total:</span>
                                    <span>₹{appliedCoupon.finalPrice}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={handlePayment}
                    disabled={isLoading || plans.length === 0}
                    style={{
                        width: "100%",
                        padding: "16px",
                        backgroundColor: "var(--primary)",
                        color: "white",
                        borderRadius: "12px",
                        fontSize: "1.1rem",
                        fontWeight: "700",
                        border: "none",
                        cursor: isLoading || plans.length === 0 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        boxShadow: isLoading || plans.length === 0 ? "none" : "0 4px 15px rgba(241, 111, 104, 0.3)",
                        opacity: isLoading || plans.length === 0 ? 0.7 : 1
                    }}
                >
                    {isLoading ? "Connecting to secure gateway..." : (
                        <>
                            Proceed to Payment <Zap size={20} />
                        </>
                    )}
                </button>
                <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#94a3b8" }}>
                    Secure payments processed via Razorpay.
                </p>
            </div>
        </div>
    );
}
