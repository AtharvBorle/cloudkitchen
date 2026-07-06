'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
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
                alt="404 - Not Found" 
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
            
            {/* Floating Go Home Button */}
            <div style={{
                position: 'absolute',
                bottom: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10
            }}>
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
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 255, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.25)';
                        }}
                    >
                        Go to Homepage
                    </span>
                </Link>
            </div>
        </div>
    );
}
