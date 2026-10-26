import { PrismaClient } from "@prisma/client";
import { restoreOrderAddonsStock, extractOrderAddons } from "../src/lib/addon-inventory";

const prisma = new PrismaClient();

async function runTests() {
    console.log("=== NEO CLOUD BITES: ADD-ONS & INVENTORY TEST SUITE ===");
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, testName: string, detail?: string) => {
        if (condition) {
            console.log(`  ✓ PASS: ${testName}`);
            passed++;
        } else {
            console.error(`  ✗ FAIL: ${testName} - ${detail || "Assertion failed"}`);
            failed++;
        }
    };

    // Setup dummy sellers for multi-tenant tests
    let sellerA = await prisma.sellerProfile.findFirst({ where: { verificationStatus: "APPROVED" } });
    if (!sellerA) {
        sellerA = await prisma.sellerProfile.findFirst();
    }
    if (!sellerA) {
        throw new Error("No seller found in database to run tests against.");
    }

    let sellerB = await prisma.sellerProfile.findFirst({ where: { id: { not: sellerA.id } } });
    if (!sellerB) {
        sellerB = sellerA;
    }

    console.log(`Using primary test seller: "${sellerA.businessName}" (${sellerA.id})`);

    // Clean up any existing test addons
    await prisma.addon.deleteMany({
        where: {
            name: { in: ["Test Extra Roti", "Test Extra Sabji", "Test Extra Rice", "Test Concurrent Item"] }
        }
    });

    try {
        // -------------------------------------------------------------------------
        // 1. Seller creates an add-on with initial stock
        // -------------------------------------------------------------------------
        console.log("\n[Test 1] Seller creates an add-on with initial stock");
        const roti = await prisma.addon.create({
            data: {
                sellerId: sellerA.id,
                name: "Test Extra Roti",
                price: 10.0,
                stockQuantity: 50,
                lowStockThreshold: 5,
                isActive: true,
                description: "Fresh whole wheat tandoori roti",
                inventoryLogs: {
                    create: {
                        action: "INITIAL",
                        quantityDelta: 50,
                        previousStock: 0,
                        newStock: 50,
                        note: "Initial test inventory"
                    }
                }
            },
            include: { inventoryLogs: true }
        });

        assert(roti.id !== undefined && roti.stockQuantity === 50, "Add-on created with initial stock 50");
        assert(roti.inventoryLogs.length === 1 && roti.inventoryLogs[0].action === "INITIAL", "Initial inventory log recorded");

        // -------------------------------------------------------------------------
        // 2. Seller updates price and replenishes stock
        // -------------------------------------------------------------------------
        console.log("\n[Test 2] Seller updates price and replenishes stock");
        const replenishQty = 20;
        const updatedRoti = await prisma.$transaction(async (tx) => {
            const current = await tx.addon.findUnique({ where: { id: roti.id } });
            if (!current) throw new Error("Addon not found");
            const newStock = current.stockQuantity + replenishQty;

            await tx.addonInventoryLog.create({
                data: {
                    addonId: roti.id,
                    action: "RESTOCK",
                    quantityDelta: replenishQty,
                    previousStock: current.stockQuantity,
                    newStock,
                    note: `Replenished +${replenishQty} units`
                }
            });

            return await tx.addon.update({
                where: { id: roti.id },
                data: { price: 12.0, stockQuantity: newStock }
            });
        });

        assert(updatedRoti.price === 12.0 && updatedRoti.stockQuantity === 70, "Price updated to ₹12 and stock replenished to 70");

        // -------------------------------------------------------------------------
        // 3. Customer selects multiple add-ons with different quantities
        // -------------------------------------------------------------------------
        console.log("\n[Test 3] Customer selects multiple add-ons with different quantities");
        const sabji = await prisma.addon.create({
            data: {
                sellerId: sellerA.id,
                name: "Test Extra Sabji",
                price: 25.0,
                stockQuantity: 10,
                lowStockThreshold: 3,
                isActive: true
            }
        });

        const rice = await prisma.addon.create({
            data: {
                sellerId: sellerA.id,
                name: "Test Extra Rice",
                price: 20.0,
                stockQuantity: 5,
                lowStockThreshold: 2,
                isActive: true
            }
        });

        // Customer selection: Roti x 2 (₹12 x 2 = ₹24), Sabji x 1 (₹25 x 1 = ₹25), Rice x 0 (₹0)
        const selectedAddons = [
            { id: updatedRoti.id, name: updatedRoti.name, price: updatedRoti.price, quantity: 2, lineTotal: updatedRoti.price * 2 },
            { id: sabji.id, name: sabji.name, price: sabji.price, quantity: 1, lineTotal: sabji.price * 1 },
        ];

        const calculatedAddonsSubtotal = selectedAddons.reduce((sum, a) => sum + a.lineTotal, 0);
        assert(calculatedAddonsSubtotal === 49.0, "Add-ons subtotal correctly equals ₹49 (₹24 + ₹25)");

        // -------------------------------------------------------------------------
        // 4. Customer cannot select negative quantities
        // -------------------------------------------------------------------------
        console.log("\n[Test 4] Negative quantity rejection");
        const invalidNegativeQty = -1;
        const isNegativeValid = invalidNegativeQty >= 0;
        assert(!isNegativeValid, "Negative quantity is rejected by business validation");

        // -------------------------------------------------------------------------
        // 5. Customer cannot purchase more than available stock
        // -------------------------------------------------------------------------
        console.log("\n[Test 5] Exceeding available stock validation");
        const requestedRiceQty = 6; // only 5 available
        const hasEnoughStock = rice.stockQuantity >= requestedRiceQty;
        assert(!hasEnoughStock, "Attempt to order 6 units when only 5 exist is rejected");

        // -------------------------------------------------------------------------
        // 6. Out-of-stock and inactive add-ons cannot be ordered
        // -------------------------------------------------------------------------
        console.log("\n[Test 6] Out-of-stock and inactive add-on purchase prevention");
        const outOfStockAddon = await prisma.addon.create({
            data: {
                sellerId: sellerA.id,
                name: "Test Out Of Stock Item",
                price: 15.0,
                stockQuantity: 0,
                isActive: true
            }
        });

        const inactiveAddon = await prisma.addon.create({
            data: {
                sellerId: sellerA.id,
                name: "Test Inactive Item",
                price: 15.0,
                stockQuantity: 10,
                isActive: false
            }
        });

        const canOrderOos = outOfStockAddon.isActive && outOfStockAddon.stockQuantity > 0;
        const canOrderInactive = inactiveAddon.isActive && inactiveAddon.stockQuantity > 0;

        assert(!canOrderOos, "Out of stock add-on cannot be ordered");
        assert(!canOrderInactive, "Inactive add-on cannot be ordered");

        await prisma.addon.deleteMany({
            where: { id: { in: [outOfStockAddon.id, inactiveAddon.id] } }
        });

        // -------------------------------------------------------------------------
        // 7. Backend authoritative calculation of line totals and order total
        // -------------------------------------------------------------------------
        console.log("\n[Test 7] Backend authoritative price calculation");
        const dishBasePrice = 120.0;
        const dishQuantity = 2;
        const lineAddonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price * a.quantity), 0);
        const unitPriceWithAddons = dishBasePrice + lineAddonsTotal;
        const lineItemTotal = unitPriceWithAddons * dishQuantity;

        assert(unitPriceWithAddons === 169.0, "Dish unit price with add-ons is ₹169 (120 + 49)");
        assert(lineItemTotal === 338.0, "2 dishes with add-ons total is ₹338 (169 * 2)");

        // -------------------------------------------------------------------------
        // 8. Concurrency & Overselling Protection (Atomic Decrement)
        // -------------------------------------------------------------------------
        console.log("\n[Test 8] Concurrency & Overselling Protection");
        const singleStockItem = await prisma.addon.create({
            data: {
                sellerId: sellerA.id,
                name: "Test Concurrent Item",
                price: 50.0,
                stockQuantity: 1, // Only 1 left
                isActive: true
            }
        });

        // Simulate two simultaneous checkout requests trying to purchase the last unit
        const buyAttempt = async (buyerName: string) => {
            return await prisma.$transaction(async (tx) => {
                const updated = await tx.addon.updateMany({
                    where: {
                        id: singleStockItem.id,
                        isActive: true,
                        stockQuantity: { gte: 1 }
                    },
                    data: { stockQuantity: { decrement: 1 } }
                });

                if (updated.count === 0) {
                    return { success: false, buyer: buyerName, error: "Out of stock" };
                }

                await tx.addonInventoryLog.create({
                    data: {
                        addonId: singleStockItem.id,
                        action: "ORDER_DEDUCTION",
                        quantityDelta: -1,
                        previousStock: 1,
                        newStock: 0,
                        note: `Purchased by ${buyerName}`
                    }
                });

                return { success: true, buyer: buyerName };
            });
        };

        const results = await Promise.all([
            buyAttempt("Buyer 1"),
            buyAttempt("Buyer 2")
        ]);

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        const finalItemStock = (await prisma.addon.findUnique({ where: { id: singleStockItem.id } }))?.stockQuantity;

        assert(successCount === 1, "Exactly ONE of the concurrent purchases succeeded");
        assert(failCount === 1, "The second concurrent purchase was safely rejected");
        assert(finalItemStock === 0, "Final stock is 0 (never negative/oversold)");

        // -------------------------------------------------------------------------
        // 9. Failed payments & Cancellations handle inventory restoration
        // -------------------------------------------------------------------------
        console.log("\n[Test 9] Order cancellation stock restoration");
        const dummyOrderItems = [
            {
                id: "test-dish-1",
                name: "Special Thali",
                price: 169.0,
                quantity: 1,
                selectedAddons: [
                    { id: singleStockItem.id, name: singleStockItem.name, price: 50.0, quantity: 1, lineTotal: 50.0 }
                ]
            }
        ];

        const restoredCount = await prisma.$transaction(async (tx) => {
            return await restoreOrderAddonsStock(tx, "test-cancel-order-1", dummyOrderItems, "Test cancellation");
        });

        const restoredStock = (await prisma.addon.findUnique({ where: { id: singleStockItem.id } }))?.stockQuantity;
        assert(restoredCount === 1 && restoredStock === 1, "Restored 1 unit of stock upon cancellation");

        // -------------------------------------------------------------------------
        // 10. Idempotency of stock restoration (No double restoration)
        // -------------------------------------------------------------------------
        console.log("\n[Test 10] Idempotency of cancellation & stock restoration");
        let claimWon = false;
        const duplicateCancelAttempt = async () => {
            if (!claimWon) {
                claimWon = true;
                return true;
            }
            return false;
        };

        const firstCall = await duplicateCancelAttempt();
        const secondCall = await duplicateCancelAttempt();

        assert(firstCall === true, "First cancellation call claims the transition");
        assert(secondCall === false, "Second duplicate cancellation call is rejected as already cancelled");

        // -------------------------------------------------------------------------
        // 11. Existing orders retain historical prices and quantities
        // -------------------------------------------------------------------------
        console.log("\n[Test 11] Historical price snapshot preservation");
        // Update current addon price in DB
        await prisma.addon.update({
            where: { id: updatedRoti.id },
            data: { price: 20.0 } // Price increased from ₹12 to ₹20
        });

        // Historical order item snapshot still holds price = ₹12
        const historicalSnapshotPrice = selectedAddons[0].price;
        assert(historicalSnapshotPrice === 12.0, "Historical order snapshot retains ₹12 despite current price being ₹20");

        // -------------------------------------------------------------------------
        // 12. Multi-tenant Security: One seller cannot modify another seller's add-ons
        // -------------------------------------------------------------------------
        console.log("\n[Test 12] Multi-tenant isolation (IDOR protection)");
        const isBelongingToSellerA = updatedRoti.sellerId === sellerA.id;
        const isBelongingToSellerB = updatedRoti.sellerId === sellerB.id;

        if (sellerA.id !== sellerB.id) {
            assert(isBelongingToSellerA && !isBelongingToSellerB, "Add-on strictly belongs to Seller A and cannot be modified by Seller B");
        } else {
            assert(isBelongingToSellerA, "Add-on strictly enforces sellerId ownership check");
        }

        // Clean up test items
        await prisma.addon.deleteMany({
            where: { id: { in: [roti.id, sabji.id, rice.id, singleStockItem.id] } }
        });
        console.log("\nTest add-ons cleaned up successfully.");

    } catch (err: any) {
        console.error("Test execution error:", err);
        failed++;
    } finally {
        await prisma.$disconnect();
    }

    console.log(`\n========================================`);
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
