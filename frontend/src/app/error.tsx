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

            {/* Invisible Clickable Overlay over the baked-in "GO HOME" button */}
            <div style={{
                position: 'absolute',
                top: '82%', // Shifted lower to perfectly align with the baked-in button
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
            }}>
                <Link href="/" style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{
                        width: '320px', // Enlarged target area
                        height: '80px',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        borderRadius: '8px'
                    }} />
                </Link>
            </div>
            
            {/* Retry Button positioned floating at the top-right corner to avoid overlap */}
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
