import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "next-auth.csrf-token",
    "__Secure-next-auth.csrf-token",
  ];

  for (const name of cookieNames) {
    response.cookies.delete(name);
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}

export async function GET() {
  return POST();
}
