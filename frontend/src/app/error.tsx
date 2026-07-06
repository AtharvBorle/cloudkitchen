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
            
            {/* Floating Action Buttons */}
            <div style={{
                position: 'absolute',
                bottom: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                display: 'flex',
                gap: '15px'
            }}>
                <button 
                    onClick={() => reset()}
                    style={{
                        padding: '14px 36px',
                        borderRadius: '50px',
                        backgroundColor: 'var(--teal, #008080)',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '1rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 8px 32px rgba(0, 128, 128, 0.25)',
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
                
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <span
                        style={{
                            display: 'inline-block',
                            padding: '14px 36px',
                            borderRadius: '50px',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            color: '#000000',
                            fontWeight: '700',
                            fontSize: '1rem',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            cursor: 'pointer',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.3s ease',
                            letterSpacing: '0.5px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        Go Home
                    </span>
                </Link>
            </div>
        </div>
    );
}
