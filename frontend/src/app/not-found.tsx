'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            backgroundColor: '#F8FAFC',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
            textAlign: 'center'
        }}>
            <div style={{
                maxWidth: '500px',
                padding: '40px 20px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src="/images/404.png" 
                    alt="Page Not Found" 
                    style={{ 
                        width: '100%', 
                        maxWidth: '380px', 
                        height: 'auto', 
                        marginBottom: '30px',
                        objectFit: 'contain'
                    }} 
                />
                
                <h1 style={{
                    fontSize: '2.2rem',
                    fontWeight: 'bold',
                    color: '#0F172A',
                    marginBottom: '12px'
                }}>
                    Page Not Found
                </h1>
                
                <p style={{
                    fontSize: '1rem',
                    color: '#64748B',
                    marginBottom: '30px',
                    lineHeight: '1.6',
                    maxWidth: '400px'
                }}>
                    The page you are looking for does not exist, has been removed, or is temporarily unavailable.
                </p>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                        onClick={() => router.back()}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '8px',
                            backgroundColor: '#E2E8F0',
                            color: '#334155',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#CBD5E1'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E2E8F0'}
                    >
                        Go Back
                    </button>
                    
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <span
                            style={{
                                display: 'inline-block',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--teal, #008080)',
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            Go Home
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
