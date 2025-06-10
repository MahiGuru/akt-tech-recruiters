import "./globals.css"; 
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import AppSessionProvider from './components/SessionProvider';

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
          {children}
          <Toaster position="top-right" />
        </AppSessionProvider>
      </body>
    </html>
  )
}