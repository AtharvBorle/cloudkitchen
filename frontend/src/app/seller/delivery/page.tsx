import type { Metadata } from 'next';
import { RiderCanvasDas, SellerResponsiveWrapper } from '@/components/seller';
import ResponsiveDeliveryPage from '@/app/seller/res/delivery/page';

export const metadata: Metadata = {
  title: 'Delivery & Rider Management | Neo Cloud Kitchen',
  description: 'Audit outstanding cash collections and assign delivery routes to active riders.',
};

export default function SellerDeliveryPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<RiderCanvasDas />}
      mobile={<ResponsiveDeliveryPage />}
    />
  );
}
