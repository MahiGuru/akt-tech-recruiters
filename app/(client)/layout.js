// app/(client)/layout.js (Optimized)
import "./globals.css"; 
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import AppSessionProvider from './components/SessionProvider';
import ConditionalLayout from './components/ConditionalLayout';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  preload: true
})

export const metadata = {
  title: 'At Bench - Recruiting Platform',
  description: 'Connect talented professionals with amazing opportunities',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* Preload critical resources */}
        <link rel="preload" href="/logo.svg" as="image" />
      </head>
      <body className={inter.className}>
        <AppSessionProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </AppSessionProvider>
      </body>
    </html>
  )
}