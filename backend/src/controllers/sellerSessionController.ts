import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export interface SessionDetails {
    deviceId: string;
    location: string;
    browser: string;
    os: string;
    ip: string;
    deviceType: "desktop" | "mobile";
    lastActiveTime: string;
    userAgent?: string;
}

function parseUserAgent(ua: string = ""): { os: string; browser: string; deviceType: "desktop" | "mobile" } {
    let os = "Desktop Device";
    let isMobile = false;

    if (/iPhone|iPad|iPod/.test(ua)) {
        os = "iOS Mobile";
        isMobile = true;
    } else if (/Android/.test(ua)) {
        os = "Android Mobile";
        isMobile = true;
    } else if (/Macintosh|Mac OS X/.test(ua)) {
        os = "macOS Desktop";
    } else if (/Windows NT 10.0|Windows NT 11.0|Windows/.test(ua)) {
        os = "Windows 10/11 Desktop";
    } else if (/Linux/.test(ua)) {
        os = "Linux Desktop";
    }

    let browser = "Web Browser";
    if (ua.includes("Edg/")) {
        browser = "Microsoft Edge";
    } else if (ua.includes("OPR/") || ua.includes("Opera/")) {
        browser = "Opera";
    } else if (ua.includes("Chrome/") && ua.includes("Safari/")) {
        browser = "Google Chrome";
    } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
        browser = "Safari";
    } else if (ua.includes("Firefox/")) {
        browser = "Mozilla Firefox";
    }

    return { os, browser, deviceType: isMobile ? "mobile" : "desktop" };
}

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 2) {
        return "Active right now";
    }
    if (diffMins < 60) {
        return `Active ${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    }
    if (diffHours < 24) {
        return `Active ${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

export const getSellerSessions = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user?.id) {
        throw new ApiError("Please log in first to view active sessions.", 401);
    }

    const url = new URL(req.url);
    const clientDeviceId = url.searchParams.get("deviceId") || "";
    const clientLocation = url.searchParams.get("location") || "";
    const clientBrowser = url.searchParams.get("browser") || "";
    const clientOs = url.searchParams.get("os") || "";
    const clientDeviceType = (url.searchParams.get("deviceType") as "desktop" | "mobile") || undefined;

    const userAgent = req.headers.get("user-agent") || "";
    const forwardedIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Active Secure Session";
    const parsedUa = parseUserAgent(userAgent);

    // If client provided a device ID, register / update this session
    if (clientDeviceId) {
        const existingLogs = await db.auditLog.findMany({
            where: {
                performedBy: session.user.id,
                action: "USER_SESSION",
            },
        });

        const matchedLog = existingLogs.find((log) => {
            try {
                const d = JSON.parse(log.details);
                return d.deviceId === clientDeviceId;
            } catch {
                return false;
            }
        });

        const sessionPayload: SessionDetails = {
            deviceId: clientDeviceId,
            location: clientLocation || (matchedLog ? JSON.parse(matchedLog.details).location : "Calcutta, Asia"),
            browser: clientBrowser || parsedUa.browser,
            os: clientOs || parsedUa.os,
            ip: "Active Secure Session",
            deviceType: clientDeviceType || parsedUa.deviceType,
            lastActiveTime: new Date().toISOString(),
            userAgent,
        };

        if (matchedLog) {
            await db.auditLog.update({
                where: { id: matchedLog.id },
                data: {
                    timestamp: new Date(),
                    details: JSON.stringify(sessionPayload),
                },
            });
        } else {
            await db.auditLog.create({
                data: {
                    action: "USER_SESSION",
                    performedBy: session.user.id,
                    details: JSON.stringify(sessionPayload),
                    timestamp: new Date(),
                },
            });
        }
    }

    // Retrieve all active sessions for this user
    const logs = await db.auditLog.findMany({
        where: {
            performedBy: session.user.id,
            action: "USER_SESSION",
        },
        orderBy: {
            timestamp: "desc",
        },
    });

    const sessionsMap = new Map<string, any>();

    for (const log of logs) {
        try {
            const d: SessionDetails = JSON.parse(log.details);
            const key = d.deviceId || log.id;
            if (!sessionsMap.has(key)) {
                const isCurrent = Boolean(clientDeviceId && d.deviceId === clientDeviceId);
                const logDate = new Date(log.timestamp);
                const lastActive = isCurrent ? "Active right now" : formatRelativeTime(logDate);

                sessionsMap.set(key, {
                    id: log.id,
                    deviceId: d.deviceId || log.id,
                    location: d.location || "Calcutta, Asia",
                    browser: d.browser || parsedUa.browser,
                    os: d.os || parsedUa.os,
                    ip: d.ip || "Active Secure Session",
                    lastActive,
                    isCurrent,
                    deviceType: d.deviceType || (d.os?.toLowerCase().includes("mobile") ? "mobile" : "desktop"),
                    timestamp: log.timestamp,
                });
            }
        } catch {
            // Ignore malformed logs
        }
    }

    const allSessions = Array.from(sessionsMap.values());

    // Sort: current session always first, then by timestamp desc
    allSessions.sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return {
        sessions: allSessions,
    };
};

export const syncSellerSession = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user?.id) {
        throw new ApiError("Please log in first to sync session.", 401);
    }

    const body = await req.json().catch(() => ({}));
    const { deviceId, location, browser, os, deviceType } = body;

    if (!deviceId) {
        throw new ApiError("Device ID is required to sync session.", 400);
    }

    const userAgent = req.headers.get("user-agent") || "";
    const parsedUa = parseUserAgent(userAgent);

    const existingLogs = await db.auditLog.findMany({
        where: {
            performedBy: session.user.id,
            action: "USER_SESSION",
        },
    });

    const matchedLog = existingLogs.find((log) => {
        try {
            const d = JSON.parse(log.details);
            return d.deviceId === deviceId;
        } catch {
            return false;
        }
    });

    const sessionPayload: SessionDetails = {
        deviceId,
        location: location || "Calcutta, Asia",
        browser: browser || parsedUa.browser,
        os: os || parsedUa.os,
        ip: "Active Secure Session",
        deviceType: deviceType || parsedUa.deviceType,
        lastActiveTime: new Date().toISOString(),
        userAgent,
    };

    if (matchedLog) {
        await db.auditLog.update({
            where: { id: matchedLog.id },
            data: {
                timestamp: new Date(),
                details: JSON.stringify(sessionPayload),
            },
        });
    } else {
        await db.auditLog.create({
            data: {
                action: "USER_SESSION",
                performedBy: session.user.id,
                details: JSON.stringify(sessionPayload),
                timestamp: new Date(),
            },
        });
    }

    return getSellerSessions(req);
};

export const deleteSellerSessions = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user?.id) {
        throw new ApiError("Please log in first to manage sessions.", 401);
    }

    const url = new URL(req.url);
    const targetId = url.searchParams.get("id");
    const allOther = url.searchParams.get("allOther") === "true";
    const currentDeviceId = url.searchParams.get("currentDeviceId") || "";

    if (targetId) {
        // Delete specific session by auditLog ID
        await db.auditLog.deleteMany({
            where: {
                id: targetId,
                performedBy: session.user.id,
                action: "USER_SESSION",
            },
        });
        return { message: "Session terminated successfully." };
    }

    if (allOther) {
        // Delete all sessions except current device
        const logs = await db.auditLog.findMany({
            where: {
                performedBy: session.user.id,
                action: "USER_SESSION",
            },
        });

        const idsToDelete: string[] = [];
        for (const log of logs) {
            try {
                const d = JSON.parse(log.details);
                if (!currentDeviceId || d.deviceId !== currentDeviceId) {
                    idsToDelete.push(log.id);
                }
            } catch {
                idsToDelete.push(log.id);
            }
        }

        if (idsToDelete.length > 0) {
            await db.auditLog.deleteMany({
                where: {
                    id: { in: idsToDelete },
                },
            });
        }

        return { message: "All other sessions have been logged out successfully." };
    }

    throw new ApiError("Please provide a session ID or specify allOther=true.", 400);
};
