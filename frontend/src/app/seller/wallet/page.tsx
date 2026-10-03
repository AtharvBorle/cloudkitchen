import type { Metadata } from 'next';
import { RiderSettlementDas, SellerResponsiveWrapper } from '@/components/seller';
import ResponsiveCashHandoverPage from '@/app/seller/res/delivery/handover/page';

export const metadata: Metadata = {
  title: 'Seller Wallet & Settlements | Neo Cloud Kitchen',
  description: 'Manage seller and rider wallet balances and settlements.',
};

export default function SellerWalletPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<RiderSettlementDas />}
      mobile={<ResponsiveCashHandoverPage />}
    />
  );
}
