"use client";

import { useEffect, useState } from 'react';
import { DollarSign, Package, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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
    if (user) {
        setLoadingStats(true);
        try {
          const productsQuery = query(collection(db, "products"), where("artisanId", "==", user.uid));
          const productsUnsubscribe = onSnapshot(productsQuery, (productsSnapshot) => {
            const activeProductsCount = productsSnapshot.docs.filter(doc => doc.data().isVerified).length;
            setStats(prevStats => ({
              ...prevStats,
              activeProducts: activeProductsCount,
            }));
          }, 
          // THE FIX: Added an error handler for the products query
          (error) => {
            console.error("Error fetching products:", error);
            setLoadingStats(false); // Stop loading even if there's an error
          });

          const ordersQuery = query(collection(db, "orders"), where("artisanIds", "array-contains", user.uid));
          const ordersUnsubscribe = onSnapshot(ordersQuery, (ordersSnapshot) => {
            let revenue = 0;
            let sales = 0;
            ordersSnapshot.forEach(orderDoc => {
              const orderData = orderDoc.data();
              orderData.items.forEach(item => {
                if (item.artisanId === user.uid) {
                  revenue += item.price * item.quantity;
                  sales += item.quantity;
                }
              });
            });
            setStats(prevStats => ({
              ...prevStats,
              totalRevenue: revenue,
              totalSales: sales,
            }));
            setLoadingStats(false); 
          }, 
          // THE FIX: Added an error handler for the orders query
          (error) => {
            console.error("Error fetching orders:", error);
            // This is the error that will contain the link you need to click
            setLoadingStats(false); // Stop loading even if there's an error
          });

          return () => {
            productsUnsubscribe();
            ordersUnsubscribe();
          };

        } catch (error) {
          console.error("Error setting up dashboard stats:", error);
          setLoadingStats(false);
        }
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

