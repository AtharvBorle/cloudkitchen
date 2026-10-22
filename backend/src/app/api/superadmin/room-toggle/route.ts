import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * GET /api/superadmin/room-toggle
 * Retrieve the current platform-wide Room Module ON/OFF status.
 */
export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            throw new ApiError("Please log in first to view room module settings.", 401);
        }
        if (session.user.role !== "SUPERADMIN") {
            throw new ApiError("Access denied. Superadmin privileges required.", 403);
        }

        const setting = await db.systemSettings.findUnique({
            where: { key: "ENABLE_ROOM_MODULE" }
        });

        const isRoomEnabled = setting?.value === "true";

        return successResponse({
            isRoomEnabled,
            key: "ENABLE_ROOM_MODULE",
            value: isRoomEnabled ? "true" : "false"
        }, "Room module status retrieved successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("[room-toggle GET] Error:", error);
        return errorResponse("Internal server error", 500);
    }
}

/**
 * PATCH /api/superadmin/room-toggle
 * Toggle or explicitly set the platform-wide Room Module ON/OFF status.
 * Body options:
 *   - { "isRoomEnabled": true | false }
 *   - { "enabled": true | false }
 *   - { "value": "true" | "false" }
 *   - empty body {} -> inverts current state (toggle)
 */
export async function PATCH(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            throw new ApiError("Please log in first to update room module settings.", 401);
        }
        if (session.user.role !== "SUPERADMIN") {
            throw new ApiError("Access denied. Superadmin privileges required.", 403);
        }

        let body: any = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        let nextState: boolean;

        if (body.isRoomEnabled !== undefined) {
            nextState = Boolean(body.isRoomEnabled);
        } else if (body.enabled !== undefined) {
            nextState = Boolean(body.enabled);
        } else if (body.value !== undefined) {
            nextState = body.value === "true" || body.value === true;
        } else {
            // No parameter passed -> toggle the current setting
            const currentSetting = await db.systemSettings.findUnique({
                where: { key: "ENABLE_ROOM_MODULE" }
            });
            nextState = currentSetting?.value !== "true";
        }

        const updated = await db.systemSettings.upsert({
            where: { key: "ENABLE_ROOM_MODULE" },
            update: { value: nextState ? "true" : "false" },
            create: {
                id: "ENABLE_ROOM_MODULE",
                key: "ENABLE_ROOM_MODULE",
                value: nextState ? "true" : "false"
            }
        });

        return successResponse({
            isRoomEnabled: nextState,
            key: updated.key,
            value: updated.value
        }, `Room functionality ${nextState ? "enabled" : "disabled"} successfully`, 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("[room-toggle PATCH] Error:", error);
        return errorResponse("Internal server error", 500);
    }
}

/**
 * PUT /api/superadmin/room-toggle
 * Alias for PATCH.
 */
export async function PUT(req: Request) {
    return PATCH(req);
}

/**
 * POST /api/superadmin/room-toggle
 * Alias for PATCH.
 */
export async function POST(req: Request) {
    return PATCH(req);
}
