import NextAuth, { NextAuthConfig, CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import bcrypt from "bcryptjs";

class CustomAuthError extends CredentialsSignin {
    constructor(code: string) {
        super();
        this.code = code;
    }
}

const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const cookieSameSite = useSecureCookies ? "none" as const : "lax" as const;

export const authConfig: NextAuthConfig = {
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "super_secret_for_local_testing_dev_only",
    cookies: {
        sessionToken: {
            name: `${cookiePrefix}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: cookieSameSite,
                path: "/",
                secure: useSecureCookies,
            },
        },
        callbackUrl: {
            name: `${cookiePrefix}next-auth.callback-url`,
            options: {
                httpOnly: true,
                sameSite: cookieSameSite,
                path: "/",
                secure: useSecureCookies,
            },
        },
        csrfToken: {
            name: `${cookiePrefix}next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: cookieSameSite,
                path: "/",
                secure: useSecureCookies,
            },
        },
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                loginType: { label: "LoginType", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const email = (credentials.email as string).toLowerCase();
                const loginType = (credentials.loginType as string) || "USER";
                console.log("Login attempt for:", email, "with loginType:", loginType);

                const user = await db.user.findUnique({
                    where: { email }
                });

                if (!user) {
                    console.log("User not found for email:", email);
                    throw new CustomAuthError("USER_NOT_FOUND");
                }

                console.log("User found, checking password...");
                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );

                if (!isPasswordValid) {
                    console.log("Invalid password for user:", email);
                    throw new CustomAuthError("INVALID_PASSWORD");
                }

                // Verify role mismatch
                if (loginType === "USER" && user.role !== "USER") {
                    console.log(`Role mismatch: User role is ${user.role}, but tried to login as USER`);
                    throw new CustomAuthError("ROLE_MISMATCH_USER");
                }
                if (loginType === "SELLER" && user.role !== "SELLER") {
                    console.log(`Role mismatch: User role is ${user.role}, but tried to login as SELLER`);
                    throw new CustomAuthError("ROLE_MISMATCH_SELLER");
                }
                if (loginType === "ADMIN" && user.role !== "AGENT" && user.role !== "SUPERADMIN" && user.role !== "SUPPORT") {
                    console.log(`Role mismatch: User role is ${user.role}, but tried to login as ADMIN/AGENT/SUPPORT`);
                    throw new CustomAuthError("ROLE_MISMATCH_ADMIN");
                }
                if (loginType === "DELIVERY" && user.role !== "DELIVERY") {
                    console.log(`Role mismatch: User role is ${user.role}, but tried to login as DELIVERY`);
                    throw new CustomAuthError("ROLE_MISMATCH_DELIVERY");
                }

                console.log("Login successful for:", email);
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            const allowedOrigins = [
                "https://cloudkitchen-rose.vercel.app",
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5000"
            ];
            try {
                const targetOrigin = new URL(url).origin;
                if (allowedOrigins.includes(targetOrigin) || targetOrigin === baseUrl) {
                    return url;
                }
            } catch (e) {
                // Invalid URL
            }
            return baseUrl;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
    }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

import { headers } from "next/headers";
import jwt from "jsonwebtoken";

export const getAuthSession = async () => {
    try {
        const headersList = await Promise.resolve(headers());
        const authHeader = headersList.get("authorization");

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const secret = process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only";
            const decoded = jwt.verify(token, secret) as any;
            if (decoded && decoded.id) {
                return {
                    user: {
                        id: decoded.id,
                        email: decoded.email,
                        name: decoded.name,
                        role: decoded.role
                    }
                };
            }
        }
    } catch (e) {
        // Ignore JWT verification errors and silently fallback to NextAuth
    }

    return await auth();
};
