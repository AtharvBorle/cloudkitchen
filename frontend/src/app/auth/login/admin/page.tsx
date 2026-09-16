"use client";

import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/common/PasswordInput/PasswordInput";

export default function AdminLoginPage() {
    const router = useRouter();
    
    useEffect(() => {
        if (typeof window !== "undefined" && window.location.pathname === "/auth/login/admin") {
            router.replace("/admin");
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
                loginType: "ADMIN",
            });

            if (res?.error) {
                if (res.error === "USER_NOT_FOUND" || res.error.includes("USER_NOT_FOUND")) {
                    setError("Account not found.");
                } else if (res.error === "INVALID_PASSWORD" || res.error.includes("INVALID_PASSWORD")) {
                    setError("Incorrect password.");
                } else if (res.error.includes("ROLE_MISMATCH_ADMIN")) {
                    setError("Access denied. Only authorized Admin accounts can access this portal.");
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
                    let redirectPath = "/dashboard/admin";
                    if (role === "SUPERADMIN") {
                        redirectPath = "/dashboard/superadmin";
                    } else if (role === "SUPPORT") {
                        redirectPath = "/dashboard/support";
                    } else if (role === "SELLER") {
                        redirectPath = "/seller/dashboard";
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
        <div className="auth-wrapper" style={{ background: "radial-gradient(circle, #2C3E50 0%, #1A252F 100%)" }}>
            <div className="auth-card" style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <h2 className="auth-title" style={{ color: "#2C3E50" }}>Admin Portal</h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "25px", marginTop: "-15px", fontSize: "0.95rem" }}>
                    Authorized personnel and agents only
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
                            placeholder="Admin Email Address"
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: "16px" }}>
                        <PasswordInput
                            id="password"
                            value={password}
                            onChange={(val) => setPassword(val)}
                            placeholder="Password"
                            required
                            autoComplete="current-password"
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className="btn btn-secondary" disabled={loading}>
                        {loading ? "Authorizing..." : "Admin Access"}
                    </button>
                </form>

                <div className="auth-footer-text">
                    <Link href="/auth/forgot-password" style={{ color: 'var(--text-muted)' }}>Forgot Password?</Link>
                </div>
            </div>
        </div>
    );
}
