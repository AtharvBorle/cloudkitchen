"use client";

import React, { Suspense } from "react";
import styles from "./SellerLogin.module.css";
import { SellerLoginHero, SellerLoginHeroProps } from "./SellerLoginHero";
import { SellerLoginForm, SellerLoginFormProps } from "./SellerLoginForm";

export interface SellerLoginProps extends SellerLoginHeroProps, SellerLoginFormProps {
  className?: string;
}

export const SellerLogin: React.FC<SellerLoginProps> = ({
  className,
  heroImageSrc,
  badgeImageSrc,
  avatarImageSrc,
  heading,
  subtitle,
  quote,
  author,
  copyrightYear,
  onSuccess,
  onboardingHref,
  forgotPasswordHref,
  termsHref,
  privacyHref,
}) => {
  return (
    <main className={`${styles.pageContainer} ${className || ""}`}>
      {/* Left Brand & Testimonial Hero */}
      <SellerLoginHero
        heroImageSrc={heroImageSrc}
        badgeImageSrc={badgeImageSrc}
        avatarImageSrc={avatarImageSrc}
        heading={heading}
        subtitle={subtitle}
        quote={quote}
        author={author}
        copyrightYear={copyrightYear}
      />

      {/* Right Login Form */}
      <Suspense fallback={<div className={styles.formColumn} />}>
        <SellerLoginForm
          onSuccess={onSuccess}
          onboardingHref={onboardingHref}
          forgotPasswordHref={forgotPasswordHref}
          termsHref={termsHref}
          privacyHref={privacyHref}
        />
      </Suspense>
    </main>
  );
};

export default SellerLogin;
