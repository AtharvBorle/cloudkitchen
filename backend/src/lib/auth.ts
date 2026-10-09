import NextAuth, { NextAuthConfig, CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { isGracePeriodExpired, anonymizeUserAccount, restoreAccountIfWithinGracePeriod } from "./account-deletion";

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
                phone: { label: "Phone", type: "text" },
                otp: { label: "OTP", type: "text" },
                loginType: { label: "LoginType", type: "text" }
            },
            async authorize(credentials) {
                const loginType = (credentials?.loginType as string) || "USER";

                // ── OTP-based login (phone + OTP) ──
                if (loginType === "OTP_USER") {
                    const rawPhone = (credentials?.phone as string || "").replace(/\D/g, "");
                    const otp = (credentials?.otp as string || "").trim();

                    if (!rawPhone || rawPhone.length < 10) {
                        throw new CustomAuthError("INVALID_PHONE");
                    }
                    if (!otp) {
                        throw new CustomAuthError("INVALID_OTP");
                    }

                    // Master OTP for development
                    const MASTER_OTP = "123456";
                    if (otp !== MASTER_OTP) {
                        console.log("Invalid OTP for phone:", rawPhone);
                        throw new CustomAuthError("INVALID_OTP");
                    }

                    // Look up user by phone (last 10 digits)
                    const phoneDigits = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone;
                    console.log("OTP login attempt for phone:", phoneDigits);

                    const user = await db.user.findFirst({
                        where: {
                            OR: [
                                { phone: phoneDigits },
                                { phone: `+91${phoneDigits}` },
                                { phone: `+91 ${phoneDigits}` },
                                { phone: { contains: phoneDigits } }
                            ],
                            role: "USER",
                        }
                    });

                    if (!user) {
                        console.log("User not found for phone:", phoneDigits);
                        throw new CustomAuthError("USER_NOT_FOUND");
                    }

                    if (user.isPermanentlyDeleted) {
                        console.log("Account permanently deleted for phone:", phoneDigits);
                        throw new CustomAuthError("ACCOUNT_DELETED");
                    }

                    if (user.deletedAt) {
                        if (isGracePeriodExpired(user.deletedAt)) {
                            console.log("Deletion grace period expired for phone:", phoneDigits);
                            await anonymizeUserAccount(user.id);
                            throw new CustomAuthError("ACCOUNT_DELETED");
                        } else {
                            // Restore account and cancel deletion
                            await restoreAccountIfWithinGracePeriod(user);
                        }
                    } else if (user.isActive === false) {
                        console.log("Account is inactive for phone:", phoneDigits);
                        throw new CustomAuthError("ACCOUNT_INACTIVE");
                    }

                    console.log("OTP login successful for user:", user.name, "phone:", user.phone);
                    return {
                        id: user.id,
                        email: user.email || "",
                        name: user.name,
                        role: user.role
                    };
                }

                // ── Email / Phone + Password login ──
                const rawIdentifier = ((credentials?.email as string) || (credentials?.phone as string) || "").trim();
                const password = credentials?.password as string;

                if (!rawIdentifier || !password) return null;

                const cleanDigits = rawIdentifier.replace(/\D/g, "");
                const isPhoneIdentifier = cleanDigits.length >= 10 && !rawIdentifier.includes("@");

                let user = null;
                if (isPhoneIdentifier) {
                    const phoneDigits = cleanDigits.length > 10 ? cleanDigits.slice(-10) : cleanDigits;
                    console.log("Login attempt with phone:", phoneDigits, "with loginType:", loginType);
                    user = await db.user.findFirst({
                        where: {
                            OR: [
                                { phone: phoneDigits },
                                { phone: `+91${phoneDigits}` },
                                { phone: `+91 ${phoneDigits}` },
                                { phone: { contains: phoneDigits } }
                            ]
                        }
                    });
                } else {
                    const email = rawIdentifier.toLowerCase();
                    console.log("Login attempt for email:", email, "with loginType:", loginType);
                    user = await db.user.findUnique({
                        where: { email }
                    });
                }

                if (!user) {
                    console.log("User not found for identifier:", rawIdentifier);
                    throw new CustomAuthError("USER_NOT_FOUND");
                }

                console.log("User found, checking password...");
                const isPasswordValid = await bcrypt.compare(
                    password,
                    user.passwordHash
                );

                if (!isPasswordValid) {
                    console.log("Invalid password for user:", rawIdentifier);
                    throw new CustomAuthError("INVALID_PASSWORD");
                }

                if (user.isPermanentlyDeleted) {
                    console.log("Account permanently deleted for user:", rawIdentifier);
                    throw new CustomAuthError("ACCOUNT_DELETED");
                }

                if (user.deletedAt) {
                    if (isGracePeriodExpired(user.deletedAt)) {
                        console.log("Deletion grace period expired for user:", rawIdentifier);
                        await anonymizeUserAccount(user.id);
                        throw new CustomAuthError("ACCOUNT_DELETED");
                    } else {
                        // Restore account and cancel deletion
                        await restoreAccountIfWithinGracePeriod(user);
                    }
                } else if (user.isActive === false) {
                    console.log("Account is inactive for user:", rawIdentifier);
                    throw new CustomAuthError("ACCOUNT_INACTIVE");
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
                if (loginType === "ADMIN" && user.role !== "AGENT" && user.role !== "SUPERADMIN" && user.role !== "SUPPORT" && user.role !== "REEL_MANAGER") {
                    console.log(`Role mismatch: User role is ${user.role}, but tried to login as ADMIN/AGENT/SUPPORT/REEL_MANAGER`);
                    throw new CustomAuthError("ROLE_MISMATCH_ADMIN");
                }
                if (loginType === "DELIVERY" && user.role !== "DELIVERY") {
                    console.log(`Role mismatch: User role is ${user.role}, but tried to login as DELIVERY`);
                    throw new CustomAuthError("ROLE_MISMATCH_DELIVERY");
                }

                console.log("Login successful for:", user.name, user.email || user.phone);
                return {
                    id: user.id,
                    email: user.email || "",
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
                    email: user.email || "",
                    name: user.name,
                    role: user.role,
                };
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token?.id) {
                try {
                    const dbUser = await db.user.findUnique({
                        where: { id: token.id as string },
                    });
                    if (dbUser && (dbUser.isActive === false || (dbUser as any).deletedAt || (dbUser as any).isPermanentlyDeleted)) {
                        return null as any;
                    }
                } catch (dbErr) {
                    console.warn("Session user verification warning:", dbErr);
                }
                session.user.role = token.role as string;
                session.user.id = token.id as string;
                session.user.email = (token.email as string) || "";
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
                const dbUser = await db.user.findUnique({
                    where: { id: decoded.id },
                });
                if (!dbUser || dbUser.isActive === false || (dbUser as any).deletedAt || (dbUser as any).isPermanentlyDeleted) {
                    return null;
                }
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
