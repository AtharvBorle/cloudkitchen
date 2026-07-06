import { Prisma } from "@prisma/client";

export async function handleCodOrderDelivered(tx: Prisma.TransactionClient, orderId: string) {
    const order = await tx.order.findUnique({
        where: { id: orderId }
    });
    
    if (!order) return;

    if (order.paymentMethod === "COD" && order.deliveryPersonId) {
        // Check if COD collection transaction already exists for this order to prevent double count
        const existingTx = await tx.deliveryTransaction.findFirst({
            where: {
                orderId: order.id,
                type: "COD_COLLECTION"
            }
        });

        if (!existingTx) {
            // Update delivery person's outstanding balance
            await tx.deliveryPerson.update({
                where: { id: order.deliveryPersonId },
                data: {
                    outstandingBalance: { increment: order.totalAmount }
                }
            });

            // Create DeliveryTransaction
            await tx.deliveryTransaction.create({
                data: {
                    deliveryPersonId: order.deliveryPersonId,
                    type: "COD_COLLECTION",
                    amount: order.totalAmount,
                    orderId: order.id,
                    description: `COD Cash collected from customer for Order #${order.id.slice(0, 8)}`,
                    status: "COMPLETED"
                }
            });
        }
    }
}
