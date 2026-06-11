import { initiateDeliveryPayment, verifyDeliveryPayment } from "@/controllers/deliveryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const orderId = resolvedParams.id;
        const razorpayOrder = await initiateDeliveryPayment(orderId);
        return successResponse(razorpayOrder, "Payment initiated", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Initiation error:", error);
        return errorResponse("An error occurred while initiating payment", 500);
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const orderId = resolvedParams.id;
        const data = await verifyDeliveryPayment(req, orderId);
        return successResponse(data, "Payment verified and order delivered", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Verification error:", error);
        return errorResponse("An error occurred while verifying payment", 500);
    }
}
