import type { Metadata } from 'next';
import { RiderSettlementDas, SellerResponsiveWrapper } from '@/components/seller';
import ResponsiveCashHandoverPage from '@/app/seller/res/delivery/handover/page';

export const metadata: Metadata = {
  title: 'Rider Settlements & Ledger History | Neo Cloud Kitchen',
  description: 'Manage delivery agents, view cash balance, and record settlement ledger.',
};

export default function SellerDeliverySettlementsPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<RiderSettlementDas />}
      mobile={<ResponsiveCashHandoverPage />}
    />
  );
}
