import { Toaster } from 'sonner';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'KITMED - Medical Equipment Platform',
  description: 'Professional medical equipment and solutions for healthcare providers',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://kitmed.ma'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="h-full">
      <body className={`${poppins.variable} min-h-full bg-medical-bg font-sans`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}