import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anvix One — Modern School Management for India',
  description:
    'The complete school management platform built for Indian schools. Students, teachers, fees, exams — all in one place. Start free today.',
  keywords: [
    'school management',
    'ERP',
    'India',
    'school software',
    'student management',
    'fee management',
  ],
  openGraph: {
    title: 'Anvix One — Modern School Management for India',
    description:
      'The complete school management platform built for Indian schools. Start free today.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
