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
} from "lucide-react";

// This layout wraps all pages inside the /artisan-hub directory
export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/artisan-hub", icon: Home, label: "Dashboard" },
    { href: "/artisan-hub/products", icon: Package, label: "My Products" },
    { href: "/artisan-hub/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/artisan-hub/brand-kit", icon: Sparkles, label: "AI Brand Kit" },
    { href: "/artisan-hub/my-story", icon: PenSquare, label: "My Story" },
  ];

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="">Artisan Haven</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
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
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
