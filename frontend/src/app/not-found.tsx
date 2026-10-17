'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role?.toUpperCase();

  let homeHref = '/';
  let homeLabel = 'Go to Home';

  if (role === 'SELLER') {
    homeHref = '/seller/dashboard';
    homeLabel = 'Go to Home';
  } else if (role === 'ADMIN' || role === 'SUPERADMIN') {
    homeHref = '/dashboard/admin';
    homeLabel = 'Go to Home';
  } else if (role === 'DELIVERY') {
    homeHref = '/dashboard/delivery';
    homeLabel = 'Go to Home';
  }

  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else if (document.referrer && document.referrer !== window.location.href) {
        window.location.href = document.referrer;
      } else {
        router.push(homeHref);
      }
    }
  };

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#FEF6EC',
        backgroundImage:
          'radial-gradient(ellipse at 50% 48%, rgba(255, 255, 255, 0.95) 0%, rgba(254, 246, 236, 0.85) 45%, #F4DEC6 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: "var(--font-poppins), 'Poppins', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '720px',
          width: '100%',
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* 1. 404 Food Thali HD Image */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '560px',
            aspectRatio: '2 / 1',
            margin: '0 auto 12px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            src="/images/404-food.png"
            alt="404 - Whoops! Page Not Found"
            width={720}
            height={360}
            priority
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '340px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 16px 32px rgba(185, 28, 28, 0.12)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.04))',
            }}
          />
        </div>

        {/* 2. Heading "Whoops!" */}
        <h1
          style={{
            fontSize: 'clamp(2.2rem, 4.8vw, 3.2rem)',
            fontWeight: 800,
            color: '#C5221F',
            margin: '8px 0 6px 0',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Whoops!
        </h1>

        {/* 3. Subtitle "SORRY COULDN'T FIND THE PAGE WHERE LOOKING FOR" */}
        <p
          style={{
            fontSize: 'clamp(0.82rem, 1.8vw, 1rem)',
            fontWeight: 700,
            color: '#C5221F',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            margin: '0 0 28px 0',
            maxWidth: '540px',
            lineHeight: 1.45,
            opacity: 0.95,
          }}
        >
          SORRY COULDN&apos;T FIND THE PAGE WHERE LOOKING FOR
        </p>

        {/* 4. Action Buttons (Go Back & Continue to Home Page) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          {/* Back Button */}
          <button
            type="button"
            onClick={handleGoBack}
            className="not-found-back-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 26px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #F6D8BC',
              color: '#C5221F',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 4px 12px rgba(197, 34, 31, 0.06), 0 1px 3px rgba(0,0,0,0.03)',
              outline: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowLeft size={17} strokeWidth={2.4} />
            <span>Go Back</span>
          </button>

          {/* Continue to Home Page Button */}
          <Link href={homeHref} style={{ textDecoration: 'none' }}>
            <span
              className="not-found-home-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 32px',
                borderRadius: '9999px',
                backgroundColor: '#FFF1E0',
                border: '1px solid rgba(246, 216, 188, 0.7)',
                color: '#C5221F',
                fontSize: '0.94rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 6px 18px rgba(197, 34, 31, 0.1), 0 2px 4px rgba(0,0,0,0.04)',
                whiteSpace: 'nowrap',
              }}
            >
              <Home size={17} strokeWidth={2.2} />
              <span>{homeLabel}</span>
            </span>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .not-found-back-btn:hover {
          background-color: #fff9f2 !important;
          border-color: #e59a58 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(197, 34, 31, 0.12) !important;
        }
        .not-found-back-btn:active {
          transform: translateY(0);
        }
        .not-found-home-btn:hover {
          background-color: #ffe6cb !important;
          border-color: #e59a58 !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(197, 34, 31, 0.16) !important;
        }
        .not-found-home-btn:active {
          transform: translateY(0);
        }
        @media (max-width: 480px) {
          .not-found-back-btn,
          .not-found-home-btn {
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 12px 20px !important;
          }
        }
      `}</style>
    </main>
  );
}
