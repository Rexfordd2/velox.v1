import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/use-toast';
import { TRPCProvider } from './_trpc/Provider';
import './globals.css';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner'
import { LogoutButton } from '@/components/LogoutButton'
import { AuthSessionSync } from '@/components/AuthSessionSync'

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
          <div className="min-h-screen flex flex-col">
            <header className="w-full border-b">
              <div className="max-w-5xl mx-auto p-3 flex items-center justify-between">
                <div className="font-semibold">Velox</div>
                <LogoutButton className="text-sm px-3 py-1 border rounded" />
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
          <FeedbackBanner />
          <Toaster />
          <AuthSessionSync />
        </TRPCProvider>
      </body>
    </html>
  );
} 