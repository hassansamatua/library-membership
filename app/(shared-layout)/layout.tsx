import { Navbar } from "@/components/web/navbar";
import { Footer } from "@/components/web/footer";

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}