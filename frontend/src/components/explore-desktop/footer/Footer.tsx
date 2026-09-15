"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Sparkles,
} from "lucide-react";
import styles from "./Footer.module.css";
import logoImg from "@/components/navbar/logo-nav.png";

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footerWrapper} role="contentinfo" aria-label="Neo Cloud Bites Footer">
      <div className={styles.footerContainer}>
        {/* Top 4-Columns Responsive Layout */}
        <div className={styles.topSection}>
          {/* Column 1: Official Brand Logo, Name & Description */}
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.brandHeader} aria-label="Neo Cloud Bites Home">
              <div className={styles.logoBadge}>
                <Image
                  src={logoImg}
                  alt="Neo Cloud Bites Logo"
                  width={46}
                  height={46}
                  className={styles.logoImage}
                  priority
                />
              </div>
              <div className={styles.brandTitleCol}>
                <span className={styles.brandName}>NEO CLOUD BITES</span>
                <span className={styles.brandTagline}>Cloud Kitchen &amp; Co-Living</span>
              </div>
            </Link>

            <p className={styles.brandDesc}>
              Crafting premium dining experiences directly inside verified community kitchens. Order wholesome home meals or discover curated co-living stays with transparent quality.
            </p>

            <div className={styles.brandPillBadge}>
              <Sparkles size={14} color="#EA580C" />
              <span>100% Hygienic &amp; FSSAI Certified</span>
            </div>
          </div>

          {/* Column 2: Explore */}
          <div className={styles.linksColumn}>
            <h4 className={styles.columnHeading}>Explore &amp; Stay</h4>
            <ul className={styles.linksList}>
              <li>
                <Link href="/explore-desktop" className={styles.footerLink}>
                  Order Food
                </Link>
              </li>
              <li>
                <Link href="/room-booking" className={styles.footerLink}>
                  Book a Room
                </Link>
              </li>
              <li>
                <Link href="/explore/furniture" className={styles.footerLink}>
                  Furniture Rental
                </Link>
              </li>
              <li>
                <Link href="/explore-desktop" className={styles.footerLink}>
                  Cloud Kitchen Reels
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Account & Support */}
          <div className={styles.linksColumn}>
            <h4 className={styles.columnHeading}>Help &amp; Account</h4>
            <ul className={styles.linksList}>
              <li>
                <Link href="/orders-desktop" className={styles.footerLink}>
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/my-subscriptions-desktop" className={styles.footerLink}>
                  Meal Subscriptions
                </Link>
              </li>
              <li>
                <Link href="/support" className={styles.footerLink}>
                  Help &amp; FAQs
                </Link>
              </li>
              <li>
                <Link href="/seller/login" className={styles.footerLink}>
                  Partner With Us (Seller)
                </Link>
              </li>
              <li>
                <Link href="/rate-app" className={styles.footerLink}>
                  Rate Our App
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Contact */}
          <div className={styles.linksColumn}>
            <h4 className={styles.columnHeading}>Contact &amp; Legal</h4>
            <ul className={styles.linksList}>
              <li>
                <a href="mailto:hello@neocloudbites.com" className={styles.contactItemLink}>
                  <Mail size={15} className={styles.contactIcon} />
                  <span>hello@neocloudbites.com</span>
                </a>
              </li>
              <li>
                <a href="tel:+919876543210" className={styles.contactItemLink}>
                  <Phone size={15} className={styles.contactIcon} />
                  <span>+91 98765 43210</span>
                </a>
              </li>
              <li className={styles.contactItem}>
                <MapPin size={15} className={styles.contactIcon} />
                <span>Kothrud, Pune, Maharashtra 411038</span>
              </li>
              <li className={styles.legalLinksRow}>
                <Link href="/terms" className={styles.footerSubLink}>
                  Terms of Service
                </Link>
                <span className={styles.linkDot}>•</span>
                <Link href="/privacy" className={styles.footerSubLink}>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider Line */}
        <div className={styles.divider} />

        {/* Bottom Row: Copyright + Social Media Icons */}
        <div className={styles.bottomSection}>
          <p className={styles.copyrightText}>
            &copy; {new Date().getFullYear()} Neo Cloud Bites Private Limited. All rights reserved.
          </p>

          <div className={styles.socialIcons}>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="Twitter / X"
            >
              <Twitter size={18} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="YouTube"
            >
              <Youtube size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
