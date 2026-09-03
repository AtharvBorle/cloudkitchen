"use client";

import React from "react";
import { Utensils, Facebook, Twitter, Instagram } from "lucide-react";
import styles from "./Footer.module.css";

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footerWrapper} role="contentinfo">
      <div className={styles.footerContainer}>
        {/* Top 4-Columns Layout */}
        <div className={styles.topSection}>
          {/* Column 1: Brand & Description */}
          <div className={styles.brandColumn}>
            <div className={styles.brandHeader}>
              <div className={styles.logoIconBox}>
                <Utensils size={20} strokeWidth={2.5} />
              </div>
              <span className={styles.brandName}>Explore</span>
            </div>
            <p className={styles.brandDesc}>
              Crafting premium dining experiences directly inside community kitchens. Watch the process live and taste the quality of fully transparent cloud dining.
            </p>
          </div>

          {/* Column 2: Company */}
          <div className={styles.linksColumn}>
            <h4 className={styles.columnHeading}>Company</h4>
            <ul className={styles.linksList}>
              <li>
                <a href="#about" className={styles.footerLink}>
                  About Us
                </a>
              </li>
              <li>
                <a href="#careers" className={styles.footerLink}>
                  Careers
                </a>
              </li>
              <li>
                <a href="#kitchens" className={styles.footerLink}>
                  Our Kitchens
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className={styles.linksColumn}>
            <h4 className={styles.columnHeading}>Support</h4>
            <ul className={styles.linksList}>
              <li>
                <a href="#help" className={styles.footerLink}>
                  Help Center
                </a>
              </li>
              <li>
                <a href="#partner" className={styles.footerLink}>
                  Partner with Us
                </a>
              </li>
              <li>
                <a href="#terms" className={styles.footerLink}>
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className={styles.linksColumn}>
            <h4 className={styles.columnHeading}>Contact</h4>
            <ul className={styles.linksList}>
              <li className={styles.contactItem}>hello@neocloudbites.com</li>
              <li className={styles.contactItem}>+91 98765 43210</li>
              <li className={styles.contactItem}>Mumbai, India</li>
            </ul>
          </div>
        </div>

        {/* Divider Line */}
        <div className={styles.divider} />

        {/* Bottom Row: Copyright + Social Icons */}
        <div className={styles.bottomSection}>
          <p className={styles.copyrightText}>
            © 2026 Neo Cloud Bites Private Limited. All rights reserved.
          </p>

          <div className={styles.socialIcons}>
            <button
              type="button"
              className={styles.socialBtn}
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </button>
            <button
              type="button"
              className={styles.socialBtn}
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </button>
            <button
              type="button"
              className={styles.socialBtn}
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
