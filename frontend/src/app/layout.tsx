import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { Providers } from '@/components/Providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cloud Kitchen & Homely Food with Room Booking',
  description: 'Premium platform for homemade food and local room bookings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <CartProvider>
            <main className="container">{children}</main>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
