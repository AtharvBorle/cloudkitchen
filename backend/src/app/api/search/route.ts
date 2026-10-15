import { NextRequest, NextResponse } from "next/server";
import { GET as publicSearchGet } from "../public/search/route";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
    return new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
    return publicSearchGet(req);
}
