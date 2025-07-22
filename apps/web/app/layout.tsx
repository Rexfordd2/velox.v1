import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { TRPCProvider } from './_trpc/Provider';
import './globals.css';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner'

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Velox - Fitness Tracking',
  description: 'Track your fitness journey with AI-powered insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>
          {children}
          <Toaster />
          <FeedbackBanner />
        </TRPCProvider>
      </body>
    </html>
  );
} 