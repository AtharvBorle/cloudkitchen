"use client";

import { signIn, getSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SellerLoginPage() {
    const router = useRouter();
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
                loginType: "SELLER",
            });

            if (res?.error) {
                if (res.error === "USER_NOT_FOUND" || res.error.includes("USER_NOT_FOUND")) {
                    setError("Account not found. Please register.");
                } else if (res.error === "INVALID_PASSWORD" || res.error.includes("INVALID_PASSWORD")) {
                    setError("Incorrect password.");
                } else if (res.error.includes("ROLE_MISMATCH_SELLER")) {
                    setError("Access denied. Only Seller accounts can log in here.");
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
                    let redirectPath = "/dashboard/seller";
                    if (role === "SUPERADMIN") {
                        redirectPath = "/dashboard/superadmin";
                    } else if (role === "AGENT") {
                        redirectPath = "/dashboard/admin";
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
                <h2 className="auth-title teal">Seller Portal</h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "25px", marginTop: "-15px", fontSize: "0.95rem" }}>
                    Manage your store, inventory, and orders
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
                            placeholder="Seller Email Address"
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

                    <button type="submit" className="btn btn-teal" disabled={loading}>
                        {loading ? "Verifying..." : "Access Seller Dashboard"}
                    </button>
                </form>

                <div className="auth-footer-text">
                    Want to sell with us? <Link href="#" onClick={(e) => { e.preventDefault(); router.push("/#join-us"); }}>Register Store</Link>
                </div>

                <div className="auth-footer-text" style={{ marginTop: '15px' }}>
                    <Link href="/auth/forgot-password" style={{ color: 'var(--text-muted)' }}>Forgot Password?</Link>
                </div>
            </div>
        </div>
    );
}
