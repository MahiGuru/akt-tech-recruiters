import "../globals.css";  
import Image from "next/image";
import Link from "next/link";
import { Toaster } from 'react-hot-toast';
 

export const metadata = {
  title: 'At Bench - Recruiting Platform',
  description: 'Connect talented professionals with amazing opportunities',
}

export default function RootLayout({ children }) {
  return ( 
    <>
        <div className="flex justify-center">
          <span className="self-center pt-6">
          <Link href="/" ><Image src={"/atlogo.svg"} alt="At Bench Logo" width={'300'} height={'120'} className="self-center"/>
          </Link>
          </span>
          
          </div>
        {children}
        <Toaster position="top-right" /> 
        </>
  )
}
