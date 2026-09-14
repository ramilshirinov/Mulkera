import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "MÜLKERA — Sizin eranız, sizin mülkünüz.",
  description:
    "MÜLKERA — Azərbaycanda əmlak almaq, satmaq və kirayə vermək üçün etibarlı platforma.",
  icons: { icon: "/images/favicon.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="az">
      <body className="bg-[#F8FAFC] text-navy antialiased">
        <AppProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}