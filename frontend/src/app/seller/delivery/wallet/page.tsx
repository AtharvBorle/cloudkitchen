import type { Metadata } from 'next';
import { RiderSettlementDas, SellerResponsiveWrapper } from '@/components/seller';
import ResponsiveCashHandoverPage from '@/app/seller/res/delivery/handover/page';

export const metadata: Metadata = {
  title: 'Rider Wallet & Settlements | Neo Cloud Kitchen',
  description: 'Manage delivery agent wallet balances and view settlement history.',
};

export default function SellerDeliveryWalletPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<RiderSettlementDas />}
      mobile={<ResponsiveCashHandoverPage />}
    />
  );
}
