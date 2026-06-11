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

export const authConfig: NextAuthConfig = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const email = (credentials.email as string).toLowerCase();
                console.log("Login attempt for:", email);

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
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth/login',
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
        // Ensure headers() is awaited contextually correctly since Next.js 15+
        // Wrapping in a generic Promise.resolve in case it's sync in previous versions, 
        // but Next 15+ headers() is async.
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
