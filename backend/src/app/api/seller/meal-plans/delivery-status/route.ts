import { toggleSubscriberMealDeliveryStatus } from "@/controllers/sellerMealPlanController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
    return new NextResponse(null, { status: 204 });
}

async function handleDeliveryStatusUpdate(req: Request) {
    try {
        const body = await req.json();
        const { subscriptionId, date, status, note } = body;
        if (!subscriptionId || !date || !status) {
            return errorResponse("subscriptionId, date, and status are required", 400);
        }
        const data = await toggleSubscriberMealDeliveryStatus(subscriptionId, date, status, note);
        return successResponse(data, data.message);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to update delivery status", 500);
    }
}

export async function POST(req: Request) {
    return handleDeliveryStatusUpdate(req);
}

export async function PATCH(req: Request) {
    return handleDeliveryStatusUpdate(req);
}

export async function PUT(req: Request) {
    return handleDeliveryStatusUpdate(req);
}
