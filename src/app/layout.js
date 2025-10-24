import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/shared/Navbar";
import { AIShoppingAssistant } from "@/components/ai/AIShoppingAssistant";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Artisan Haven",
  description: "A marketplace for handcrafted goods.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            {/* Add the AI Assistant here so it appears on all pages */}
            <AIShoppingAssistant />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
