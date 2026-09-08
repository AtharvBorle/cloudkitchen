import type { Metadata } from 'next';
import { CreateSubscriptionPlan } from '@/components/seller';

export const metadata: Metadata = {
  title: 'Delivery & Subscription Plan | Neo Cloud Kitchen',
  description: 'Configure and manage delivery subscription plans and fulfillment schedules.',
};

export default function SellerDeliverySubscriptionPage() {
  return <CreateSubscriptionPlan />;
}
