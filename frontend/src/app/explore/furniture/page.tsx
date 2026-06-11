'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FurnitureQueryPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        serviceType: 'get', // 'give' or 'get'
        address: '',
        city: '',
        pincode: '',
        captchaInput: '',
    });

    const [captcha, setCaptcha] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
        type: null,
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Generate a simple captcha
    const generateCaptcha = () => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptcha(result);
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: null, message: '' });

        if (formData.captchaInput.toUpperCase() !== captcha) {
            setStatus({ type: 'error', message: 'Invalid verification code. Please try again.' });
            generateCaptcha();
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/furniture/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Thank you! Your query has been submitted successfully.' });
                setFormData({
                    name: '',
                    email: '',
                    mobile: '',
                    serviceType: 'get',
                    address: '',
                    city: '',
                    pincode: '',
                    captchaInput: '',
                });
                generateCaptcha();
            } else {
                setStatus({ type: 'error', message: 'Something went wrong. Please try again later.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to submit query. Check your connection.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="furniture-page">
            <div className="form-container">
                {/* Left Side Content */}
                <div className="sidebar">
                    <h1>Furniture Rental</h1>
                    <p>Experience premium furniture at your doorstep or earn by renting yours.</p>
                    <ul className="features">
                        <li><span>✓</span> Easy Process</li>
                        <li><span>✓</span> Secure Rentals</li>
                        <li><span>✓</span> Best Prices</li>
                    </ul>
                    <Link href="/" className="back-link">← Back to Home</Link>
                </div>

                {/* Right Side Form */}
                <div className="form-content">
                    <h2>Submit Your Query</h2>

                    {status.message && (
                        <div className={`status-badge ${status.type}`}>
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Mobile Number</label>
                                <input
                                    type="tel"
                                    name="mobile"
                                    required
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    placeholder="+91 9876543210"
                                />
                            </div>
                            <div className="form-group">
                                <label>Service Required</label>
                                <select
                                    name="serviceType"
                                    value={formData.serviceType}
                                    onChange={handleChange}
                                >
                                    <option value="get">Get furniture on rent</option>
                                    <option value="give">Give furniture on rent</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Detailed Address</label>
                            <textarea
                                name="address"
                                required
                                rows={3}
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="House no, Street, Landmark..."
                            />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>City</label>
                                <input
                                    type="text"
                                    name="city"
                                    required
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Pune"
                                />
                            </div>
                            <div className="form-group">
                                <label>Pincode</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    required
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    placeholder="411001"
                                />
                            </div>
                        </div>

                        <div className="captcha-section">
                            <label>Verification Code</label>
                            <div className="captcha-box-wrapper">
                                <div className="captcha-box">{captcha}</div>
                                <button type="button" onClick={generateCaptcha} className="refresh-btn">Refresh</button>
                            </div>
                            <input
                                type="text"
                                name="captchaInput"
                                required
                                value={formData.captchaInput}
                                onChange={handleChange}
                                placeholder="Type the code above"
                                className="captcha-input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="submit-btn"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Query'}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx>{`
        .furniture-page {
          min-height: 100vh;
          background-color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        .form-container {
          max-width: 900px;
          width: 100%;
          background: white;
          border-radius: 24px;
          display: flex;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        }

        .sidebar {
          flex: 1;
          background: linear-gradient(135deg, #f97316 0%, #db2777 100%);
          padding: 40px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .sidebar h1 {
          font-size: 2.5rem;
          margin-bottom: 20px;
          line-height: 1.1;
        }

        .sidebar p {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 30px;
        }

        .features {
          list-style: none;
          padding: 0;
          margin-bottom: 40px;
        }

        .features li {
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
        }

        .features li span {
          background: rgba(255,255,255,0.2);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }

        .back-link {
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .back-link:hover {
          opacity: 1;
          text-decoration: underline;
        }

        .form-content {
          flex: 1.5;
          padding: 50px;
        }

        .form-content h2 {
          font-size: 1.8rem;
          color: #1e293b;
          margin-bottom: 30px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 12px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }

        .captcha-section {
          background: #f1f5f9;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
        }

        .captcha-section label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 12px;
        }

        .captcha-box-wrapper {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 12px;
        }

        .captcha-box {
          background: white;
          padding: 10px 20px;
          font-family: monospace;
          font-size: 1.4rem;
          font-weight: bold;
          letter-spacing: 5px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          user-select: none;
          color: #1e293b;
          text-decoration: line-through;
          background-image: radial-gradient(#cbd5e1 0.5px, transparent 0.5px);
          background-size: 8px 8px;
        }

        .refresh-btn {
          color: #f97316;
          font-size: 0.85rem;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
        }

        .captcha-input {
          width: 100%;
          padding: 10px 15px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          text-transform: uppercase;
        }

        .submit-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(to right, #f97316, #db2777);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(249, 115, 22, 0.3);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .status-badge {
          padding: 15px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 25px;
          text-align: center;
        }

        .status-badge.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .status-badge.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        @media (max-width: 768px) {
          .form-container {
            flex-direction: column;
          }
          .sidebar {
            padding: 30px;
          }
          .form-content {
            padding: 30px;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
