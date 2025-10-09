"use client";

import { useEffect, useState } from 'react';
import { DollarSign, Package, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ArtisanHubDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    activeProducts: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // Fetch dashboard data only when the user object is available
    if (user) {
        const fetchDashboardData = async () => {
            setLoadingStats(true);
            try {
                // 1. Fetch all products belonging to this artisan
                const productsQuery = query(collection(db, "products"), where("artisanId", "==", user.uid));
                const productsSnapshot = await getDocs(productsQuery);
                // Count how many of them are approved and live on the site
                const activeProductsCount = productsSnapshot.docs.filter(doc => doc.data().isVerified).length;

                // 2. Fetch all orders that include this artisan's products
                const ordersQuery = query(collection(db, "orders"), where("artisanIds", "array-contains", user.uid));
                const ordersSnapshot = await getDocs(ordersQuery);

                let revenue = 0;
                let sales = 0;

                // 3. Calculate total revenue and sales from the orders
                ordersSnapshot.forEach(orderDoc => {
                    const orderData = orderDoc.data();
                    // Go through each item in an order
                    orderData.items.forEach(item => {
                        // If the item belongs to the current artisan, add to their totals
                        if (item.artisanId === user.uid) {
                            revenue += item.price * item.quantity;
                            sales += item.quantity;
                        }
                    });
                });
                
                // 4. Update the state with the real data
                setStats({
                    totalRevenue: revenue,
                    totalSales: sales,
                    activeProducts: activeProductsCount
                });

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoadingStats(false);
            }
        };
        
        fetchDashboardData();
    }
  }, [user]);

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <p className="text-muted-foreground mb-4">Welcome back, {user?.displayName}!</p>
      
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Based on completed sales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sales
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <div className="text-2xl font-bold">+{stats.totalSales}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total items sold
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <div className="text-2xl font-bold">{stats.activeProducts}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Products approved and live on the site
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

