import type { Metadata } from 'next';
import { SellerRooms, SellerResponsiveWrapper } from '@/components/seller';
import ResponsiveRoomsPage from '@/app/seller/res/rooms/page';

export const metadata: Metadata = {
  title: 'Rooms Inventory & Booking | Neo Cloud Kitchen',
  description: 'Manage room inventory, pricing, availability, and guest reservations.',
};

export default function SellerRoomsPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<SellerRooms />}
      mobile={<ResponsiveRoomsPage />}
    />
  );
}
