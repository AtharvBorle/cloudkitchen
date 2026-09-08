import type { Metadata } from 'next';
import { SellerRooms } from '@/components/seller';

export const metadata: Metadata = {
  title: 'Rooms Inventory & Booking | Neo Cloud Kitchen',
  description: 'Manage room inventory, pricing, availability, and guest reservations.',
};

export default function SellerRoomsPage() {
  return <SellerRooms />;
}
