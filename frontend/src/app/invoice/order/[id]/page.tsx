"use client";

import { useEffect, useState, use } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { Loader2, AlertCircle } from "lucide-react";
import UnifiedInvoiceView from "@/components/common/UnifiedInvoiceView";

export default function CustomerOrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<any | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        const fetchOrder = async () => {
            try {
                // Fetch order details
                let res = await fetchApi(`/api/user/orders/${id}`);
                if (!res.ok) {
                    res = await fetchApi(`/api/seller/orders/${id}`);
                }
                const resData = await res.json();
                if (res.ok) {
                    const fetchedOrder = resData.data?.order || resData.order || resData.data || resData;
                    const st = (fetchedOrder?.status || "").toUpperCase();
                    const isDeliveredOrCompleted = st === "DELIVERED" || st === "COMPLETED";
                    if (st === "CANCELLED" || st === "REJECTED") {
                        setError("Invoices cannot be generated for cancelled or rejected orders.");
                    } else if (!isDeliveredOrCompleted) {
                        setError("Invoices are only generated and accessible after the order has been successfully delivered or completed.");
                    } else {
                        setOrder(fetchedOrder);
                    }
                } else {
                    setError(resData.message || "Failed to retrieve invoice details.");
                }
            } catch (err) {
                console.error("Error fetching customer invoice:", err);
                setError("An error occurred while loading the invoice.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC', gap: '15px' }}>
                <Loader2 className="animate-spin" size={40} color="#DC2626" />
                <span style={{ fontSize: '1rem', color: '#64748B', fontWeight: '500' }}>Loading Customer Invoice...</span>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '440px', width: '100%' }}>
                    <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 15px' }} />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1E293B', marginBottom: '10px' }}>Error Loading Invoice</h2>
                    <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '20px' }}>{error || "Invoice not found or access is restricted."}</p>
                    <button onClick={() => window.close()} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#1E293B', color: 'white', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                        Close Window
                    </button>
                </div>
            </div>
        );
    }

    return <UnifiedInvoiceView order={order} isSellerView={false} />;
}
