import type { Metadata } from 'next';
import { EditMenu } from '@/components/seller';

export const metadata: Metadata = {
  title: 'Edit Menu Dish | Neo Cloud Kitchen',
  description: 'Update dish details, pricing, food type, and inventory availability.',
};

export default function EditMenuPage() {
  return <EditMenu />;
}
