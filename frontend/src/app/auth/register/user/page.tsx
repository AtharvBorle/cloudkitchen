"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserRegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "USER"
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetchApi("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Registration failed");

            setSuccess(true);
            setTimeout(() => {
                const params = new URLSearchParams(window.location.search);
                const callbackUrl = params.get("callbackUrl");
                router.push(callbackUrl ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth/login");
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <h2 className="auth-title teal">Create Account</h2>

                {error && <div className="badge badge-danger">{error}</div>}
                {success && <div className="badge badge-success">Registration successful! Redirecting...</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input name="name" type="text" value={formData.name} onChange={handleChange} className="input-field" placeholder="Full Name" required />
                    </div>

                    <div className="input-group">
                        <input name="email" type="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="Email Address" required />
                    </div>

                    <div className="input-group">
                        <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="input-field" placeholder="Mobile Number" required />
                    </div>

                    <div className="input-group">
                        <input name="password" type="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="Password" required minLength={6} />
                    </div>

                    <button type="submit" className="btn btn-teal" disabled={loading || success}>
                        {loading ? "Please wait..." : "Sign Up"}
                    </button>
                </form>

                <div className="auth-footer-text">
                    Already have an account? <Link href="#" onClick={(e) => { e.preventDefault(); const cb = new URLSearchParams(window.location.search).get("callbackUrl"); router.push(cb ? `/auth/login?callbackUrl=${encodeURIComponent(cb)}` : "/auth/login"); }} className="coral">Login</Link>
                </div>

                <div className="auth-footer-text" style={{ marginTop: '15px' }}>
                    <Link href="/auth/register" style={{ color: 'var(--text-muted)' }}>Want to become a Seller?</Link>
                </div>
            </div>
        </div>
    );
}
