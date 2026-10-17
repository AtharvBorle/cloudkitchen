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
        height: '100dvh',
        width: '100%',
        backgroundColor: '#FEF6EC',
        backgroundImage:
          'radial-gradient(ellipse at 50% 48%, rgba(255, 255, 255, 0.95) 0%, rgba(254, 246, 236, 0.85) 45%, #F4DEC6 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '740px',
          width: '100%',
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* 1. 404 Food Thali HD Image */}
        <div
          className="not-found-image-wrap"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '620px',
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
              maxHeight: '360px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 14px 28px rgba(185, 28, 28, 0.12)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.04))',
            }}
          />
        </div>

        {/* 2. Heading "Whoops!" */}
        <h1
          className="not-found-heading"
          style={{
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 400,
            color: '#C5221F',
            margin: '6px 0 8px 0',
            letterSpacing: '0',
            lineHeight: 1.15,
          }}
        >
          Whoops!
        </h1>

        {/* 3. Subtitle "SORRY COULDN'T FIND THE PAGE WHERE LOOKING FOR" */}
        <p
          className="not-found-subtitle"
          style={{
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            fontSize: 'clamp(0.8rem, 1.8vw, 0.95rem)',
            fontWeight: 700,
            color: '#C5221F',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 auto 24px auto',
            maxWidth: '300px',
            lineHeight: 1.45,
            opacity: 0.95,
          }}
        >
          SORRY COULDN&apos;T FIND THE PAGE WHERE LOOKING FOR
        </p>

        {/* 4. Action Buttons (Go Back & Go to Home) */}
        <div
          className="not-found-btn-group"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
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
              padding: '10px 24px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #F6D8BC',
              color: '#C5221F',
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 4px 12px rgba(197, 34, 31, 0.06), 0 1px 3px rgba(0,0,0,0.03)',
              outline: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowLeft size={16} strokeWidth={2.4} />
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
                padding: '11px 28px',
                borderRadius: '9999px',
                backgroundColor: '#FFF1E0',
                border: '1px solid rgba(246, 216, 188, 0.7)',
                color: '#C5221F',
                fontSize: '0.92rem',
                fontWeight: 700,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 6px 18px rgba(197, 34, 31, 0.1), 0 2px 4px rgba(0,0,0,0.04)',
                whiteSpace: 'nowrap',
              }}
            >
              <Home size={16} strokeWidth={2.2} />
              <span>{homeLabel}</span>
            </span>
          </Link>
        </div>
      </div>

      <style jsx>{`
        * {
          font-family: var(--font-poppins), 'Poppins', sans-serif;
        }
        .not-found-heading {
          font-weight: 400 !important;
        }
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
        @media (min-width: 640px) {
          .not-found-subtitle {
            max-width: 520px !important;
          }
          .not-found-image-wrap {
            max-width: 620px !important;
            margin-bottom: 16px !important;
          }
        }
        @media (max-width: 480px) {
          .not-found-image-wrap {
            max-width: clamp(260px, 82vw, 340px) !important;
            margin-bottom: 8px !important;
          }
          .not-found-subtitle {
            max-width: 290px !important;
            margin-bottom: 22px !important;
          }
          .not-found-back-btn,
          .not-found-home-btn {
            padding: 9px 20px !important;
            font-size: 0.85rem !important;
          }
        }
      `}</style>
    </main>
  );
}
