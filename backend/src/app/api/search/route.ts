import { NextRequest, NextResponse } from "next/server";
import { GET as publicSearchGet } from "../public/search/route";
import { getCorsHeaders } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(req),
    });
}

export async function GET(req: NextRequest) {
    return publicSearchGet(req);
}
