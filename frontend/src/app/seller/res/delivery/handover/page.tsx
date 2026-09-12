"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ResponsiveCashHandover from "@/components/seller/delivery/responsive/ResponsiveCashHandover";
import { fetchApi } from "@/lib/fetch-api";

function CashHandoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const riderId = searchParams.get("riderId");

  const [rider, setRider] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function loadRiderAndTransactions() {
      try {
        const res = await fetchApi("/api/seller/delivery");
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.deliveryPersons || data.deliveryPersons || data.data || [];
          if (Array.isArray(list) && list.length > 0) {
            const found = riderId
              ? list.find((r: any) => r.id === riderId) || list[0]
              : list[0];
            if (found) {
              setRider(found);

              // Fetch transactions for this rider
              try {
                const txRes = await fetchApi(`/api/seller/delivery/${found.id}/transactions`);
                if (txRes.ok) {
                  const txData = await txRes.json();
                  const txList = txData.data?.transactions || txData.transactions || txData.data || [];
                  if (Array.isArray(txList)) {
                    setTransactions(txList);
                  }
                }
              } catch (txErr) {
                console.error("Failed to load rider transactions:", txErr);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load delivery person details:", err);
      }
    }
    loadRiderAndTransactions();
  }, [riderId]);

  const handleConfirmReceipt = async () => {
    if (!rider || !rider.id) return;
    try {
      const amount = rider.outstandingBalance || 0;
      if (amount > 0) {
        await fetchApi(`/api/seller/delivery/${rider.id}/collect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            description: "Mobile cash handover confirmed by seller",
          }),
        });
      }
      router.push("/seller/delivery/riders");
    } catch (err) {
      console.error("Failed to collect cash:", err);
    }
  };

  const cashOrders = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      if (!rider || !rider.outstandingBalance) return [];
      return [
        {
          id: "1",
          orderNumber: "#COD-101",
          customerName: "Order Delivery",
          amount: `₹${(rider.outstandingBalance || 0).toLocaleString("en-IN")}`,
        },
      ];
    }
    const collectionTxs = transactions.filter(
      (tx: any) => tx.type !== "SETTLEMENT" && (tx.amount > 0 || tx.orderId)
    );
    if (collectionTxs.length === 0) {
      return [
        {
          id: "1",
          orderNumber: "#COD-101",
          customerName: "Pending Deliveries",
          amount: `₹${(rider?.outstandingBalance || 0).toLocaleString("en-IN")}`,
        },
      ];
    }
    return collectionTxs.map((tx: any, idx: number) => {
      const amt = Math.abs(tx.amount || 0);
      const orderNum = tx.order?.orderNumber
        ? `#${tx.order.orderNumber}`
        : tx.description?.match(/#[A-Za-z0-9-]+/)?.[0] || `#ORD-${idx + 101}`;
      const custName =
        tx.order?.customerName ||
        tx.description?.replace(/^Cash Collected from #[^\s]+ \(/, "").replace(/\)$/, "") ||
        "Customer";
      return {
        id: tx.id || String(idx),
        orderNumber: orderNum,
        customerName: custName,
        amount: `₹${amt.toLocaleString("en-IN")}`,
      };
    });
  }, [transactions, rider]);

  return (
    <ResponsiveCashHandover
      riderName={rider?.name || "Rider"}
      riderInitials={
        rider?.name
          ? rider.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "RD"
      }
      totalCash={`₹${(rider?.outstandingBalance || 0).toLocaleString("en-IN")}`}
      ordersCount={cashOrders.length}
      orders={cashOrders}
      onConfirmReceipt={handleConfirmReceipt}
      onBack={() => router.push("/seller/delivery/riders")}
    />
  );
}

export default function ResponsiveCashHandoverPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24, textAlign: "center", color: "#64748B" }}>
          Loading Cash Handover...
        </div>
      }
    >
      <CashHandoverContent />
    </Suspense>
  );
}


