import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const createBooking = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    const { roomId, startDate, endDate, totalAmount } = await req.json();

    if (!roomId || !startDate || !endDate) {
        throw new ApiError("Missing required booking details", 400);
    }

    const room = await db.room.findUnique({
        where: { id: roomId },
        include: {
            seller: {
                include: {
                    subscriptions: {
                        where: { status: "ACTIVE" },
                        include: { plan: true }
                    }
                }
            }
        }
    });

    if (!room || !room.isAvailable) {
        throw new ApiError("Room is no longer available", 400);
    }

    const now = new Date();
    const hasActivePropertySub = room.seller.subscriptions.some((sub: any) => 
        sub.status === "ACTIVE" && 
        (sub.validUntil === null || new Date(sub.validUntil) > now) &&
        (sub.plan?.category === "PROPERTY" || sub.plan?.category === "BOTH")
    );

    if (!hasActivePropertySub) {
        throw new ApiError("This property is currently not accepting bookings (No active subscription).", 400);
    }

    const requestedStart = new Date(startDate);
    const requestedEnd = new Date(endDate);

    const overlappingBookings = await db.booking.findFirst({
        where: {
            roomId: roomId,
            status: { in: ["CONFIRMED", "PENDING"] },
            AND: [
                { startDate: { lt: requestedEnd } },
                { endDate: { gt: requestedStart } }
            ]
        }
    });

    if (overlappingBookings) {
        throw new ApiError("These dates are already booked by someone else.", 400);
    }

    const booking = await db.booking.create({
        data: {
            roomId: roomId,
            userId: session.user.id,
            startDate: requestedStart,
            endDate: requestedEnd,
            status: "PENDING",
        }
    });

    return { booking };
};
