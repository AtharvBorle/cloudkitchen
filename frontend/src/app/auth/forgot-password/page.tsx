"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Mock Implementation for now
        setTimeout(() => {
            alert("OTP Sent to " + email);
            setLoading(false);
            router.push("/auth/login");
        }, 1000);
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card" style={{ padding: '40px', maxWidth: '450px' }}>
                <h2 className="auth-title coral" style={{ marginBottom: '30px' }}>Reset Password</h2>

                <form onSubmit={handleSendOTP}>
                    <div className="input-group">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            placeholder="Enter Registration Email"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-teal" disabled={loading} style={{ marginTop: '10px' }}>
                        {loading ? "Sending..." : "Send OTP"}
                    </button>
                </form>

                <div className="auth-footer-text" style={{ marginTop: '20px' }}>
                    <Link href="/auth/login" style={{ color: 'var(--text-muted)' }}>← Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
