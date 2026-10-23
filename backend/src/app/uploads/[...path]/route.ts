import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SAFE_MIME_TYPES: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
};

function getFileResponseHeaders(contentType: string, contentLength: number, filename: string) {
    const isAttachment = !Object.values(SAFE_MIME_TYPES).includes(contentType);
    const disposition = isAttachment ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`;

    return {
        "Content-Type": contentType,
        "Content-Length": contentLength.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Disposition": disposition,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Range, Content-Type",
    };
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Range, Content-Type",
        },
    });
}

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await context.params;
        if (!pathSegments || pathSegments.length === 0) {
            return new NextResponse("File not found", { status: 404 });
        }

        const uploadsDir = path.resolve(process.cwd(), "public", "uploads");

        // Canonical path resolution to strictly prevent directory traversal (e.g., ../, null bytes)
        const safeSegments = pathSegments.map((s) => path.basename(s)).filter((s) => s && s !== "." && s !== "..");
        const fullPath = path.resolve(uploadsDir, ...safeSegments);

        // Security check: ensure target path is strictly within uploadsDir
        if (!fullPath.startsWith(uploadsDir + path.sep)) {
            return new NextResponse("Access denied", { status: 403 });
        }

        if (!fs.existsSync(fullPath)) {
            return new NextResponse("File not found", { status: 404 });
        }

        const stat = await fs.promises.stat(fullPath);
        if (!stat.isFile()) {
            return new NextResponse("Not a file", { status: 400 });
        }

        const ext = path.extname(fullPath).toLowerCase();
        const contentType = SAFE_MIME_TYPES[ext] || "application/octet-stream";
        const fileBuffer = await fs.promises.readFile(fullPath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: getFileResponseHeaders(contentType, stat.size, path.basename(fullPath)),
        });
    } catch (error) {
        console.error("Error serving uploaded file:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
