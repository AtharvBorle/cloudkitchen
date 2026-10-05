import type { Metadata } from 'next';
import { EditMenu, SellerResponsiveWrapper } from '@/components/seller';
import ResponsiveMenuItemPage from '@/app/seller/res/menu/item/page';

export const metadata: Metadata = {
  title: 'Edit Menu Dish | Neo Cloud Kitchen',
  description: 'Update dish details, pricing, food type, and inventory availability.',
};

export default function EditMenuPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<EditMenu />}
      mobile={<ResponsiveMenuItemPage />}
    />
  );
}
