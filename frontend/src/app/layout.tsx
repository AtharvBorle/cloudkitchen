import type { Metadata, Viewport } from 'next';
import { CartProvider } from '@/context/CartContext';
import { Providers } from '@/components/Providers';
import { LocationProvider } from '@/components/location-provider';
import ChatbotWidget from '@/components/chatbot-widget';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#FFFFFF',
};

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
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
