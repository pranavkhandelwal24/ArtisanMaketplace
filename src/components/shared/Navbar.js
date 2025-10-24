"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, LogOut, Settings, Package, Loader2, Search } from "lucide-react";
import { CartSheet } from "@/components/cart/CartSheet";

export default function Navbar() {
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Redirects to the All Products page with the search term as a query parameter
      router.push(`/products?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/products');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="text-lg font-bold">Artisan Haven</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/products" className="transition-colors hover:text-foreground/80 text-foreground/60">
              All Products
            </Link>
          </nav>
        </div>

        <div className="flex w-full items-center gap-4 md:ml-auto md:w-1/2">
            <form onSubmit={handleSearch} className="relative w-full">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                    type="search"
                    placeholder="Search products..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </form>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {(!user || user.role === 'buyer') && <CartSheet />}
          
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                    <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {user.role === 'artisan' && user.isVerifiedArtisan && (
                   <DropdownMenuItem asChild>
                     <Link href="/artisan-hub" className="cursor-pointer flex items-center"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                   </DropdownMenuItem>
                )}

                {user.role === 'buyer' && (
                  <DropdownMenuItem asChild>
                    <Link href="/my-orders" className="cursor-pointer flex items-center"><Package className="mr-2 h-4 w-4" />My Orders</Link>
                  </DropdownMenuItem>
                )}
                
                 <DropdownMenuItem asChild>
                   <Link href="/settings" className="cursor-pointer flex items-center"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                 </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
