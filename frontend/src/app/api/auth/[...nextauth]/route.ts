import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.endsWith("/session")) {
    return NextResponse.json(null);
  }
  if (path.endsWith("/csrf")) {
    return NextResponse.json({ csrfToken: "" });
  }
  if (path.endsWith("/providers")) {
    return NextResponse.json({});
  }

  return NextResponse.json(null);
}

export async function POST() {
  return NextResponse.json({});
}
