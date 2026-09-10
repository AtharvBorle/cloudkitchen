import type { Metadata } from 'next';
import { RiderCanvasDas } from '@/components/seller';

export const metadata: Metadata = {
  title: 'Delivery & Rider Management | Neo Cloud Kitchen',
  description: 'Audit outstanding cash collections and assign delivery routes to active riders.',
};

export default function SellerDeliveryPage() {
  return <RiderCanvasDas />;
}
