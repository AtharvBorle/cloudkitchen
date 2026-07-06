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
        </div>
    );
}
