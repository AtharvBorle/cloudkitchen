import type { Metadata } from 'next';
import { SellerLogin } from '@/components/seller';

export const metadata: Metadata = {
  title: 'Owner Login | Neo Cloud Bite',
  description: 'Log in to your Neo Cloud Kitchen seller portal to manage orders, inventory, and menus.',
};

export default function SellerLoginPage() {
  return <SellerLogin />;
}