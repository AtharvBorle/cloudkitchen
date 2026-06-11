"use client";

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import PopupBannerDisplay from "@/components/PopupBannerDisplay";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic for mobile feature cards
  useEffect(() => {
    const handleAutoScroll = () => {
      if (window.innerWidth <= 768 && scrollRef.current) {
        const container = scrollRef.current;
        const cardWidth = 310; // 280px min-width + 30px gap based on CSS
        const maxScroll = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft >= maxScroll - 10) { // -10 for rounding errors
          // Reset to beginning
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll to next card
          container.scrollTo({ left: container.scrollLeft + cardWidth, behavior: 'smooth' });
        }
      }
    };

    // Auto-scroll every 3.5 seconds
    const intervalId = setInterval(handleAutoScroll, 3500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <PopupBannerDisplay />

      {/* Navbar exactly like the screenshot */}
      <header className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="navbar-brand">
            Neo Cloud Kitchen
          </div>

          {/* Desktop Nav */}
          <nav className="navbar-links desktop-only">
            <Link href="/">Home</Link>
            <Link href="/auth/login">Login</Link>
            <Link href="/auth/register/user">Sign Up</Link>
            <Link href="/auth/register" className="btn-nav-seller">Become a Seller</Link>
          </nav>

          {/* Mobile Toggle */}
          <button className="mobile-only" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ color: "var(--primary)" }}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Nav */}
        <div
          className={`mobile-nav-menu-backdrop ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen(false)}
        ></div>
        <div className={`mobile-nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <Link href="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
          <Link href="/auth/register/user" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
          <Link href="/auth/register" className="btn-nav-seller" style={{ textAlign: 'center', marginTop: '10px' }} onClick={() => setIsMenuOpen(false)}>Become a Seller</Link>
        </div>
      </header>

      {/* Hero Section with 4 Unique Background Images */}
      <main style={{ flex: 1 }}>
        <div className="hero-section">
          {/* Background Grid */}
          <div className="hero-bg-grid">
            <div style={{ backgroundImage: 'url("/images/hero-1.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div style={{ backgroundImage: 'url("/images/hero-2.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div style={{ backgroundImage: 'url("/images/hero-3.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div style={{ backgroundImage: 'url("/images/hero-4.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          </div>

          {/* Dark Overlay with subtle shift for readability */}
          <div className="hero-overlay"></div>

          {/* Glassmorphism Content Container */}
          <div className="hero-glass-container">
            <h1 className="hero-title">
              Taste of Home, <br /><span style={{ color: 'var(--coral)' }}>Away from Home</span>
            </h1>
            <p className="hero-subtitle">
              Discover authentic homely food and comfortable rooms in your city.
            </p>

            <div className="hero-actions">
              <Link href="/explore/food" className="btn btn-coral">
                Order Food
              </Link>
              <Link href="/explore/rooms" className="btn btn-teal">
                Book a Room
              </Link>
              <Link href="/explore/furniture" className="btn btn-amber">
                Rent Furniture
              </Link>
            </div>
          </div>
        </div>

        {/* Why Choose Us with Feature Images */}
        <div style={{ backgroundColor: '#FAFAFA', padding: '100px 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '60px' }}>
            Why Choose Us?
          </h2>
          <div className="features-grid" ref={scrollRef}>
            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: 'var(--shadow-card)', overflow: 'hidden', transition: 'transform 0.3s ease' }} className="hover-lift">
              <div style={{ height: '200px', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/authentic.png" alt="Authentic Taste" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--text-main)' }}>Authentic Taste</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
                  Food prepared by verified home chefs with love, hygiene, and traditional recipes.
                </p>
              </div>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: 'var(--shadow-card)', overflow: 'hidden', transition: 'transform 0.3s ease' }} className="hover-lift">
              <div style={{ height: '200px', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/verified.png" alt="Verified Sellers" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--text-main)' }}>Verified Sellers</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
                  All our sellers and rooms are physically verified by our local agents for your safety.
                </p>
              </div>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: 'var(--shadow-card)', overflow: 'hidden', transition: 'transform 0.3s ease' }} className="hover-lift">
              <div style={{ height: '200px', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/furniture_rental_feature.png" alt="Premium Furniture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--text-main)' }}>Premium Furniture</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Rent high-quality furniture to make your stay feel like a real home instantly.
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: 'var(--shadow-card)', overflow: 'hidden', transition: 'transform 0.3s ease' }} className="hover-lift">
              <div style={{ height: '200px', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/secure.png" alt="Secure Payments" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--text-main)' }}>Secure Payments</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
                  Multiple payment options with end-to-end encryption for your peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global style for animations and hover effects */}
      <style jsx global>{`
          @keyframes heroEntrance {
            from { opacity: 0; transform: scale(1.05) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .hover-lift {
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .hover-lift:hover {
            transform: translateY(-12px);
            box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.2) !important;
          }
      `}</style>

    </div>
  );
}
