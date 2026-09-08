import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { Providers } from '@/components/Providers';
import { LocationProvider } from '@/components/location-provider';
import ChatbotWidget from '@/components/chatbot-widget';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Cloud Kitchen & Homely Food with Room Booking',
  description: 'Premium platform for homemade food and local room bookings.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={`${inter.className} ${poppins.className}`}>
        <Providers>
          <LocationProvider>
            <CartProvider>
              <main>{children}</main>
              <ChatbotWidget />
            </CartProvider>
          </LocationProvider>
        </Providers>
      </body>
    </html>
  );
}
