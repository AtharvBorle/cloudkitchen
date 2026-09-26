"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
    Mail, 
    Lock, 
    KeyRound, 
    Eye, 
    EyeOff, 
    ArrowRight, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    ShieldCheck, 
    Sparkles 
} from "lucide-react";
import { validateEmail } from "@/lib/email-validation";
import { fetchApi } from "@/lib/fetch-api";

function ForgotPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isSeller = searchParams.get("type") === "seller";
    const loginPath = isSeller ? "/seller/login" : "/login";

    // Step state: 1 = Enter Email, 2 = Verify OTP & Set Password, 3 = Success
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Form inputs
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI states
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    // Handle resend countdown timer
    useEffect(() => {
        let timer: any;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Step 1: Request OTP
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        const validation = validateEmail(email);
        if (!validation.isValid) {
            setErrorMessage(validation.error || "Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetchApi("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: validation.normalizedEmail,
                    role: isSeller ? "SELLER" : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data?.message || "Failed to process request. Please verify your email.");
                return;
            }

            setSuccessMessage("OTP sent successfully. Use testing OTP 123456.");
            setOtp("123456");
            setResendCooldown(30);
            setStep(2);
        } catch (err: any) {
            setErrorMessage("A network error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (resendCooldown > 0 || loading) return;
        setErrorMessage("");
        setSuccessMessage("");
        setLoading(true);

        try {
            const res = await fetchApi("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    role: isSeller ? "SELLER" : undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setErrorMessage(data?.message || "Failed to resend OTP.");
                return;
            }

            setSuccessMessage("New OTP sent! (Testing OTP: 123456)");
            setOtp("123456");
            setResendCooldown(30);
        } catch (err) {
            setErrorMessage("Could not resend OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Reset Password with OTP
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!otp.trim()) {
            setErrorMessage("Please enter the 6-digit OTP code.");
            return;
        }

        if (otp.trim() !== "123456") {
            setErrorMessage("Invalid OTP code. Please enter 123456.");
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            setErrorMessage("Password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match. Please check and retype.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetchApi("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    otp: otp.trim(),
                    newPassword: newPassword.trim(),
                    confirmPassword: confirmPassword.trim(),
                    role: isSeller ? "SELLER" : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data?.message || "Failed to reset password.");
                return;
            }

            setStep(3);
        } catch (err: any) {
            setErrorMessage("A network error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px"
        }}>
            <div style={{
                width: "100%",
                maxWidth: "460px",
                backgroundColor: "#FFFFFF",
                borderRadius: "24px",
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)",
                border: "1px solid #E2E8F0",
                padding: "36px 32px",
                textAlign: "left"
            }}>
                {/* Header Section */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "60px",
                        height: "60px",
                        borderRadius: "20px",
                        backgroundColor: isSeller ? "#FFF7ED" : "#FEF2F2",
                        color: isSeller ? "#EA580C" : "#EF4444",
                        marginBottom: "16px",
                        border: isSeller ? "1.5px solid #FFEDD5" : "1.5px solid #FEE2E2"
                    }}>
                        {step === 3 ? (
                            <CheckCircle2 size={32} color="#10B981" />
                        ) : (
                            <KeyRound size={28} />
                        )}
                    </div>

                    <h1 style={{
                        fontSize: "1.6rem",
                        fontWeight: "800",
                        color: "#0F172A",
                        letterSpacing: "-0.5px",
                        marginBottom: "6px"
                    }}>
                        {step === 3 ? "Password Reset Complete" : "Reset Password"}
                    </h1>

                    {isSeller && (
                        <div style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            backgroundColor: "#FFF7ED",
                            color: "#C2410C",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            borderRadius: "12px",
                            border: "1px solid #FED7AA",
                            marginBottom: "8px"
                        }}>
                            Owner / Seller Portal
                        </div>
                    )}

                    <p style={{
                        fontSize: "0.88rem",
                        color: "#64748B",
                        lineHeight: 1.45,
                        margin: 0
                    }}>
                        {step === 1 && "Enter your registered email and we'll send you an OTP to reset your password."}
                        {step === 2 && `Enter the 6-digit OTP sent to ${email} and choose a new password.`}
                        {step === 3 && "Your password has been successfully updated. You can now log in."}
                    </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div style={{
                        backgroundColor: "#FEF2F2",
                        border: "1px solid #FECACA",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "#B91C1C",
                        fontSize: "0.85rem",
                        fontWeight: "600"
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Success Banner */}
                {successMessage && step !== 3 && (
                    <div style={{
                        backgroundColor: "#F0FDF4",
                        border: "1px solid #BBF7D0",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "#15803D",
                        fontSize: "0.85rem",
                        fontWeight: "600"
                    }}>
                        <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* STEP 1: Request OTP Form */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: "700",
                                color: "#334155",
                                marginBottom: "6px"
                            }}>
                                {isSeller ? "Registered Owner Email" : "Registered Email"}
                            </label>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                border: "1.5px solid #CBD5E1",
                                borderRadius: "12px",
                                padding: "0 12px",
                                backgroundColor: "#FFFFFF",
                                transition: "border-color 0.2s"
                            }}>
                                <Mail size={18} color="#94A3B8" style={{ marginRight: "10px", flexShrink: 0 }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your-email@domain.com"
                                    required
                                    autoFocus
                                    style={{
                                        width: "100%",
                                        padding: "12px 0",
                                        border: "none",
                                        outline: "none",
                                        fontSize: "0.92rem",
                                        color: "#0F172A",
                                        backgroundColor: "transparent"
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                width: "100%",
                                padding: "13px",
                                borderRadius: "12px",
                                border: "none",
                                backgroundColor: isSeller ? "#EA580C" : "#EF4444",
                                color: "#FFFFFF",
                                fontSize: "0.95rem",
                                fontWeight: "700",
                                cursor: loading ? "not-allowed" : "pointer",
                                boxShadow: isSeller ? "0 4px 14px rgba(234, 88, 12, 0.3)" : "0 4px 14px rgba(239, 68, 68, 0.3)",
                                transition: "all 0.2s"
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Sending OTP...</span>
                                </>
                            ) : (
                                <>
                                    <span>Send Verification OTP</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* STEP 2: Verify OTP & Reset Password Form */}
                {step === 2 && (
                    <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                        {/* Target email row */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            backgroundColor: "#F8FAFC",
                            borderRadius: "10px",
                            border: "1px solid #E2E8F0"
                        }}>
                            <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: "600" }}>
                                📧 {email}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setErrorMessage("");
                                    setSuccessMessage("");
                                }}
                                style={{
                                    border: "none",
                                    backgroundColor: "transparent",
                                    color: isSeller ? "#EA580C" : "#EF4444",
                                    fontSize: "0.75rem",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    textDecoration: "underline"
                                }}
                            >
                                Change
                            </button>
                        </div>

                        {/* Test OTP Hint Card */}
                        <div style={{
                            backgroundColor: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            borderRadius: "10px",
                            padding: "8px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.8rem",
                            color: "#1E40AF",
                            fontWeight: "600"
                        }}>
                            <span>💡 Development Test OTP:</span>
                            <span style={{
                                backgroundColor: "#DBEAFE",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                letterSpacing: "1px",
                                fontFamily: "monospace",
                                fontWeight: "800"
                            }}>
                                123456
                            </span>
                        </div>

                        {/* OTP Input */}
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: "700",
                                color: "#334155",
                                marginBottom: "6px"
                            }}>
                                6-Digit OTP Code
                            </label>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                border: "1.5px solid #CBD5E1",
                                borderRadius: "12px",
                                padding: "0 12px",
                                backgroundColor: "#FFFFFF"
                            }}>
                                <ShieldCheck size={18} color="#94A3B8" style={{ marginRight: "10px", flexShrink: 0 }} />
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    placeholder="123456"
                                    required
                                    autoFocus
                                    style={{
                                        width: "100%",
                                        padding: "12px 0",
                                        border: "none",
                                        outline: "none",
                                        fontSize: "1.1rem",
                                        fontWeight: "700",
                                        letterSpacing: "4px",
                                        color: "#0F172A",
                                        backgroundColor: "transparent"
                                    }}
                                />
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: "700",
                                color: "#334155",
                                marginBottom: "6px"
                            }}>
                                New Password
                            </label>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                border: "1.5px solid #CBD5E1",
                                borderRadius: "12px",
                                padding: "0 12px",
                                backgroundColor: "#FFFFFF"
                            }}>
                                <Lock size={18} color="#94A3B8" style={{ marginRight: "10px", flexShrink: 0 }} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter at least 6 characters"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px 0",
                                        border: "none",
                                        outline: "none",
                                        fontSize: "0.92rem",
                                        color: "#0F172A",
                                        backgroundColor: "transparent"
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        border: "none",
                                        backgroundColor: "transparent",
                                        color: "#94A3B8",
                                        cursor: "pointer",
                                        padding: "4px"
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: "700",
                                color: "#334155",
                                marginBottom: "6px"
                            }}>
                                Confirm New Password
                            </label>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                border: "1.5px solid #CBD5E1",
                                borderRadius: "12px",
                                padding: "0 12px",
                                backgroundColor: "#FFFFFF"
                            }}>
                                <Lock size={18} color="#94A3B8" style={{ marginRight: "10px", flexShrink: 0 }} />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px 0",
                                        border: "none",
                                        outline: "none",
                                        fontSize: "0.92rem",
                                        color: "#0F172A",
                                        backgroundColor: "transparent"
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        border: "none",
                                        backgroundColor: "transparent",
                                        color: "#94A3B8",
                                        cursor: "pointer",
                                        padding: "4px"
                                    }}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                width: "100%",
                                padding: "13px",
                                borderRadius: "12px",
                                border: "none",
                                backgroundColor: isSeller ? "#EA580C" : "#EF4444",
                                color: "#FFFFFF",
                                fontSize: "0.95rem",
                                fontWeight: "700",
                                cursor: loading ? "not-allowed" : "pointer",
                                boxShadow: isSeller ? "0 4px 14px rgba(234, 88, 12, 0.3)" : "0 4px 14px rgba(239, 68, 68, 0.3)",
                                transition: "all 0.2s",
                                marginTop: "6px"
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Resetting Password...</span>
                                </>
                            ) : (
                                <>
                                    <span>Reset Password</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        {/* Resend OTP button */}
                        <div style={{ textAlign: "center", marginTop: "4px" }}>
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={resendCooldown > 0 || loading}
                                style={{
                                    border: "none",
                                    backgroundColor: "transparent",
                                    color: resendCooldown > 0 ? "#94A3B8" : isSeller ? "#EA580C" : "#EF4444",
                                    fontSize: "0.82rem",
                                    fontWeight: "700",
                                    cursor: resendCooldown > 0 ? "default" : "pointer",
                                    textDecoration: resendCooldown > 0 ? "none" : "underline"
                                }}
                            >
                                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Didn't receive OTP? Resend"}
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 3: Success Confirmation Screen */}
                {step === 3 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "center" }}>
                        <div style={{
                            backgroundColor: "#F0FDF4",
                            border: "1px solid #BBF7D0",
                            borderRadius: "16px",
                            padding: "20px",
                            color: "#166534"
                        }}>
                            <p style={{ margin: 0, fontWeight: "700", fontSize: "0.95rem" }}>
                                🎉 Your password has been updated!
                            </p>
                            <p style={{ margin: "6px 0 0 0", fontSize: "0.82rem", color: "#15803D" }}>
                                You can now sign in using your new credentials.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push(loginPath)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                width: "100%",
                                padding: "13px",
                                borderRadius: "12px",
                                border: "none",
                                backgroundColor: isSeller ? "#EA580C" : "#EF4444",
                                color: "#FFFFFF",
                                fontSize: "0.95rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                boxShadow: isSeller ? "0 4px 14px rgba(234, 88, 12, 0.3)" : "0 4px 14px rgba(239, 68, 68, 0.3)",
                                transition: "all 0.2s"
                            }}
                        >
                            <span>Back to {isSeller ? "Owner Login" : "Login"}</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {/* Back to Login Link */}
                {step !== 3 && (
                    <div style={{ textAlign: "center", marginTop: "24px", borderTop: "1px solid #F1F5F9", paddingTop: "18px" }}>
                        <Link
                            href={loginPath}
                            style={{
                                color: "#64748B",
                                textDecoration: "none",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            <ArrowLeft size={16} /> Back to {isSeller ? "Owner Login" : "Login"}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", color: "#64748B" }}>
                    <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 12px auto" }} />
                    <p style={{ fontWeight: "700", fontSize: "0.9rem" }}>Loading...</p>
                </div>
            </div>
        }>
            <ForgotPasswordForm />
        </Suspense>
    );
}
