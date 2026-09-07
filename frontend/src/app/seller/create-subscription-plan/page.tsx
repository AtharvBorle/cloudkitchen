import type { Metadata } from 'next';
import { CreateSubscriptionPlan } from '@/components/seller';

export const metadata: Metadata = {
  title: 'Create Subscription Plan | Neo Cloud Kitchen',
  description: 'Create and configure new subscription tiers for food and room operations.',
};

export default function CreateSubscriptionPlanPage() {
  return <CreateSubscriptionPlan />;
}
