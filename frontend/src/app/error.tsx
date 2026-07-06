'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div style={{
            position: 'relative',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: '#000'
        }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
                src="/images/404.png" 
                alt="Error Occurred" 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 1
                }}
            />

            {/* Visible Neon sci-fi "GO HOME" Button positioned overlay */}
            <div style={{
                position: 'absolute',
                top: '82%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
            }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <span
                        style={{
                            display: 'inline-block',
                            padding: '14px 45px',
                            borderRadius: '4px',
                            border: '2px solid #00f0ff',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            color: '#ffffff',
                            fontWeight: '800',
                            fontSize: '1.1rem',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            cursor: 'pointer',
                            boxShadow: '0 0 15px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(0, 240, 255, 0.2)',
                            textShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
                            transition: 'all 0.3s ease',
                            fontFamily: 'monospace, system-ui, sans-serif'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.2)';
                            e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.6), inset 0 0 15px rgba(0, 240, 255, 0.4)';
                            e.currentTarget.style.textShadow = '0 0 12px rgba(255, 255, 255, 1), 0 0 8px rgba(0, 240, 255, 0.8)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(0, 240, 255, 0.2)';
                            e.currentTarget.style.textShadow = '0 0 8px rgba(255, 255, 255, 0.8)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        GO HOME
                    </span>
                </Link>
            </div>
            
            {/* Retry Button positioned floating at the top-right corner */}
            <div style={{
                position: 'absolute',
                top: '30px',
                right: '30px',
                zIndex: 15
            }}>
                <button 
                    onClick={() => reset()}
                    style={{
                        padding: '12px 28px',
                        borderRadius: '50px',
                        backgroundColor: '#EF4444',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)',
                        transition: 'all 0.3s ease',
                        letterSpacing: '0.5px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
