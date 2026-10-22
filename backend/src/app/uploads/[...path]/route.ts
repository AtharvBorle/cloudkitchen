import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getCorsHeaders(contentType: string, contentLength: number) {
    return {
        "Content-Type": contentType,
        "Content-Length": contentLength.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    };
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
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

        const uploadsDir = path.join(process.cwd(), "public", "uploads");

        // Prevent path traversal
        const safeRelativePath = path.normalize(path.join(...pathSegments)).replace(/^(\.\.[\/\\])+/, "");
        const fullPath = path.join(uploadsDir, safeRelativePath);

        // Security check: ensure target path is strictly within uploadsDir
        if (!fullPath.startsWith(uploadsDir)) {
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
        const mimeTypes: Record<string, string> = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".svg": "image/svg+xml",
            ".pdf": "application/pdf",
            ".mp4": "video/mp4",
            ".webm": "video/webm",
        };

        const contentType = mimeTypes[ext] || "application/octet-stream";
        const fileBuffer = await fs.promises.readFile(fullPath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: getCorsHeaders(contentType, stat.size),
        });
    } catch (error) {
        console.error("Error serving uploaded file:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
