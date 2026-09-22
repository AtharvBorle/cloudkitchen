import {
    getUserMealSubscriptions,
    createUserMealSubscription,
    cancelUserMealSubscription,
    changeUserMealPlan,
    togglePauseUserMealSubscription,
} from "@/controllers/userMealSubscriptionController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getUserMealSubscriptions();
        return successResponse(data, "User meal subscriptions fetched successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to fetch user meal subscriptions", 500);
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { action } = body;

        if (action === "CANCEL") {
            const data = await cancelUserMealSubscription(body.id, body.reason);
            return successResponse(data, data.message);
        }

        if (action === "CHANGE_PLAN") {
            const data = await changeUserMealPlan(body.id, body.newPlanId);
            return successResponse(data, data.message);
        }

        if (action === "PAUSE") {
            const data = await togglePauseUserMealSubscription(body.id, body.isPaused);
            return successResponse(data, data.message);
        }

        const data = await createUserMealSubscription(
            new Request(req.url, { method: "POST", body: JSON.stringify(body) })
        );
        return successResponse(data, "Meal subscription created successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to process meal subscription request", 500);
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { action, id } = body;

        if (action === "CANCEL") {
            const data = await cancelUserMealSubscription(id, body.reason);
            return successResponse(data, data.message);
        }

        if (action === "CHANGE_PLAN") {
            const data = await changeUserMealPlan(id, body.newPlanId);
            return successResponse(data, data.message);
        }

        if (action === "PAUSE") {
            const data = await togglePauseUserMealSubscription(id, body.isPaused);
            return successResponse(data, data.message);
        }

        return errorResponse("Invalid action provided. Supported: CANCEL, CHANGE_PLAN, PAUSE", 400);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to update meal subscription", 500);
    }
}
