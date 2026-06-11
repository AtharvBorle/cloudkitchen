import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Neo Cloud Kitchen API Server',
  description: 'Backend API Server for Neo Cloud Kitchen',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
