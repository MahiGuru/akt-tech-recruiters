import "./globals.css"; 
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import AppSessionProvider from './components/SessionProvider';
import MainLayout from './components/MainLayout';
import ConditionalLayout from './components/ConditionalLayout';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'At Bench - Recruiting Platform',
  description: 'Connect talented professionals with amazing opportunities',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppSessionProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <Toaster position="top-right" />
        </AppSessionProvider>
      </body>
    </html>
  )
}