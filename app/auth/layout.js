import "../globals.css"; 
import { Inter } from 'next/font/google';
import Image from "next/image";
import Link from "next/link";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'At Bench - Recruiting Platform',
  description: 'Connect talented professionals with amazing opportunities',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex justify-center">
          <span className="self-center pl-[30px] ml-8">
          <Link href="/" ><Image src={"/logo.svg"} alt="At Bench Logo" width={'300'} height={'120'} className="self-center"/>
          </Link>
          </span>
          
          </div>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
