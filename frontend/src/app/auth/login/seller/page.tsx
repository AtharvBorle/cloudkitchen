import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { SellerLogin, SellerResponsiveWrapper, ResSellerLogin } from '@/components/seller';

export const metadata: Metadata = {
  title: 'Owner Login | Neo Cloud Bite',
  description: 'Log in to your Neo Cloud Kitchen seller portal to manage orders, inventory, and menus.',
};

export default function LegacySellerLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#FFFBF7' }} />}>
      <SellerResponsiveWrapper
        desktop={<SellerLogin />}
        mobile={<ResSellerLogin />}
      />
    </Suspense>
  );
}
