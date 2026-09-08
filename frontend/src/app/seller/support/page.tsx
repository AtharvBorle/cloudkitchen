import type { Metadata } from 'next';
import { SellerSupport } from '@/components/seller';

export const metadata: Metadata = {
  title: 'Support Tickets | Neo Cloud Kitchen',
  description: 'Owner operations console for managing customer and technical support tickets.',
};

export default function SellerSupportPage() {
  return <SellerSupport />;
}
