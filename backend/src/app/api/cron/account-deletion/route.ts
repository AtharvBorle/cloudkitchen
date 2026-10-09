import { NextRequest, NextResponse } from "next/server";
import { processExpiredAccountDeletions, getGracePeriodConfig } from "@/lib/account-deletion";

export async function GET(req: NextRequest) {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers.get("authorization");
        const querySecret = req.nextUrl.searchParams.get("secret");

        if (cronSecret && authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret) {
            return NextResponse.json(
                { success: false, message: "Unauthorized cron execution." },
                { status: 401 }
            );
        }

        const result = await processExpiredAccountDeletions();
        return NextResponse.json({
            success: true,
            message: `Processed ${result.processedCount} expired account deletions.`,
            data: result,
            config: getGracePeriodConfig()
        });
    } catch (error: any) {
        console.error("[Cron Account Deletion Error]:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to process expired account deletions." },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    return GET(req);
}
