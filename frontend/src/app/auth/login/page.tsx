"use client";

import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    
    useEffect(() => {
        if (typeof window !== "undefined" && window.location.pathname === "/auth/login") {
            router.replace("/user");
        }
    }, [router]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
                loginType: "USER",
            });

            if (res?.error) {
                if (res.error === "USER_NOT_FOUND" || res.error.includes("USER_NOT_FOUND")) {
                    setError("Account not found. Please register.");
                } else if (res.error === "INVALID_PASSWORD" || res.error.includes("INVALID_PASSWORD")) {
                    setError("Incorrect password.");
                } else if (res.error.includes("ROLE_MISMATCH_USER")) {
                    setError("Access denied. Business accounts must use their specific portals.");
                } else {
                    setError("Invalid email or password.");
                }
            } else {
                const session = await getSession();
                const role = session?.user?.role;

                const params = new URLSearchParams(window.location.search);
                const callbackUrl = params.get("callbackUrl");
                if (callbackUrl && callbackUrl.startsWith("/")) {
                    window.location.href = callbackUrl;
                } else {
                    let redirectPath = "/";
                    if (role === "SUPERADMIN") {
                        redirectPath = "/dashboard/superadmin";
                    } else if (role === "AGENT") {
                        redirectPath = "/dashboard/admin";
                    } else if (role === "SELLER") {
                        redirectPath = "/dashboard/seller";
                    } else if (role === "DELIVERY") {
                        redirectPath = "/dashboard/delivery";
                    } else if (role === "USER") {
                        redirectPath = "/dashboard/user";
                    }
                    window.location.href = redirectPath;
                }
            }
        } catch (err: any) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <h2 className="auth-title coral">Welcome Back</h2>

                {error && <div className="badge badge-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            placeholder="Email Address"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="Password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-coral" disabled={loading}>
                        {loading ? "Please wait..." : "Login"}
                    </button>
                </form>

                <div className="auth-footer-text">
                    Don't have an account? <Link href="#" onClick={(e) => { e.preventDefault(); const cb = new URLSearchParams(window.location.search).get("callbackUrl"); router.push(cb ? `/auth/register/user?callbackUrl=${encodeURIComponent(cb)}` : "/auth/register/user"); }}>Register</Link>
                </div>

                <div className="auth-footer-text" style={{ marginTop: '15px' }}>
                    <Link href="/auth/forgot-password" style={{ color: 'var(--text-muted)' }}>Forgot Password?</Link>
                </div>
            </div>
        </div>
    );
}
