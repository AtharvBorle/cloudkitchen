import { NextRequest, NextResponse } from "next/server";
import { runAllNotificationChecks } from "@/lib/subscriptionNotificationService";

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

    const result = await runAllNotificationChecks();
    return NextResponse.json({
      success: true,
      message: "Notification checks completed successfully.",
      data: result,
    });
  } catch (error: any) {
    console.error("[Cron Notifications Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to execute notification checks." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
