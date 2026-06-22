"use client";

import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DeliveryLoginPage() {
    const router = useRouter();
    
    useEffect(() => {
        if (typeof window !== "undefined" && window.location.pathname === "/auth/login/delivery") {
            router.replace("/delivery");
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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            setLoading(false);
            return;
        }

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
                loginType: "DELIVERY",
            });

            if (res?.error) {
                if (res.error === "USER_NOT_FOUND" || res.error.includes("USER_NOT_FOUND")) {
                    setError("Account not found.");
                } else if (res.error === "INVALID_PASSWORD" || res.error.includes("INVALID_PASSWORD")) {
                    setError("Incorrect password.");
                } else if (res.error.includes("ROLE_MISMATCH_DELIVERY")) {
                    setError("Access denied. Only Delivery personnel can log in here.");
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
                    let redirectPath = "/dashboard/delivery";
                    if (role === "SUPERADMIN") {
                        redirectPath = "/dashboard/superadmin";
                    } else if (role === "AGENT") {
                        redirectPath = "/dashboard/admin";
                    } else if (role === "SELLER") {
                        redirectPath = "/dashboard/seller";
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
                <h2 className="auth-title" style={{ color: "var(--furniture)" }}>Delivery Portal</h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "25px", marginTop: "-15px", fontSize: "0.95rem" }}>
                    Manage delivery runs and track orders
                </p>

                {error && <div className="badge badge-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            placeholder="Delivery Rider Email"
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

                    <button type="submit" className="btn btn-amber" disabled={loading}>
                        {loading ? "Verifying..." : "Rider Access"}
                    </button>
                </form>

                <div className="auth-footer-text">
                    <Link href="/auth/forgot-password" style={{ color: 'var(--text-muted)' }}>Forgot Password?</Link>
                </div>
            </div>
        </div>
    );
}
