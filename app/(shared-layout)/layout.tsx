
import { Navbar } from "@/components/web/navbar";
import { Footer } from "@/components/web/footer";

export default function SharedLayout({ children}: {children: React.ReactNode}) {
  return (
    <>
    <Navbar />
   {children}
   <Footer />
    
    </>
    
  );
}