"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Package2,
  Home,
  ShoppingCart,
  Package,
  Sparkles,
  PenSquare,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Reusable component for the navigation links
function DashboardNavLinks({ onLinkClick }) {
  const pathname = usePathname();
  const navItems = [
    { href: "/artisan-hub", icon: Home, label: "Dashboard" },
    { href: "/artisan-hub/products", icon: Package, label: "My Products" },
    { href: "/artisan-hub/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/artisan-hub/brand-kit", icon: Sparkles, label: "AI Brand Kit" },
    { href: "/artisan-hub/my-story", icon: PenSquare, label: "My Story" },
  ];

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          onClick={onLinkClick} // Close the sheet when a link is clicked on mobile
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            pathname === item.href && "bg-muted text-primary"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// This layout wraps all pages inside the /artisan-hub directory
export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Security guard for the entire dashboard
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'artisan') {
        router.push('/');
      } else if (!user.isVerifiedArtisan) {
        router.push('/verification');
      }
    }
  }, [user, loading, router]);

  // Show a full-page loader while checking authentication
  if (loading || !user || user.role !== 'artisan' || !user.isVerifiedArtisan) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      );
  }

  // If authenticated as a verified artisan, show the dashboard
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* --- Desktop Sidebar --- */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span>Artisan Haven</span>
            </Link>
          </div>
          <div className="flex-1">
            <DashboardNavLinks onLinkClick={() => {}} />
          </div>
        </div>
      </div>
      
      {/* --- Mobile Header & Content Area --- */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <Link href="/" className="flex items-center gap-2 font-semibold mb-4" onClick={() => setMobileMenuOpen(false)}>
                <Package2 className="h-6 w-6" />
                <span>Artisan Haven</span>
              </Link>
              <DashboardNavLinks onLinkClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
           <h1 className="text-lg font-semibold">Artisan Hub</h1>
        </header>
        
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

