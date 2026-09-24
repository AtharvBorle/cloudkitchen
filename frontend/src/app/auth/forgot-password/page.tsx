"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { validateEmail } from "@/lib/email-validation";

function ForgotPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isSeller = searchParams.get("type") === "seller";

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validateEmail(email);
        if (!validation.isValid) {
            alert(validation.error || "Please enter a valid email address.");
            return;
        }
        setLoading(true);
        // Mock Implementation for now
        setTimeout(() => {
            alert("OTP Sent to " + email);
            setLoading(false);
            router.push(isSeller ? "/seller/login" : "/login");
        }, 1000);
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card" style={{ padding: '40px', maxWidth: '450px' }}>
                <h2 className={`auth-title ${isSeller ? "teal" : "coral"}`} style={{ marginBottom: '30px' }}>Reset Password</h2>

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

                    <button type="submit" className={`btn ${isSeller ? "btn-teal" : "btn-coral"}`} disabled={loading} style={{ marginTop: '10px' }}>
                        {loading ? "Sending..." : "Send OTP"}
                    </button>
                </form>

                <div className="auth-footer-text" style={{ marginTop: '20px' }}>
                    <Link href={isSeller ? "/seller/login" : "/login"} style={{ color: 'var(--text-muted)' }}>← Back to Login</Link>
                </div>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="auth-wrapper">
                <div className="auth-card" style={{ padding: '40px', maxWidth: '450px', textAlign: 'center' }}>
                    <h2 className="auth-title coral" style={{ marginBottom: '30px' }}>Loading...</h2>
                </div>
            </div>
        }>
            <ForgotPasswordForm />
        </Suspense>
    );
}

