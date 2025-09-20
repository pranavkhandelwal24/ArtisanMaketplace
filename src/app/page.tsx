import { db } from "@/lib/firebase-admin";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// This server-side function fetches the 8 most recent, verified products to feature on the homepage.
async function getFeaturedProducts() {
  try {
    const productsQuery = db.collection('products')
      .where('isVerified', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(8);
    
    const querySnapshot = await productsQuery.get();
    
    // Using JSON.parse(JSON.stringify(...)) is a reliable way to convert Firestore data,
    // including Timestamps, into a plain object that Next.js can easily handle.
    return JSON.parse(JSON.stringify(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <main>
      {/* Hero Section */}
      <section className="container mx-auto flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">The Heart of Craftsmanship</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Discover unique, handcrafted goods from passionate artisans around the world. Every piece tells a story.
        </p>
        <div className="mt-6 flex gap-4">
           <Button asChild size="lg">
             <Link href="/products">Explore All Products</Link>
           </Button>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="container mx-auto p-4 md:p-8">
        <h2 className="text-2xl font-semibold mb-6">New Arrivals</h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {products.map((product: any) => (
              // THE FIX: This link must point to the public product page, not the artisan hub.
              <Link key={product.id} href={`/product/${product.id}`} className="group">
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200">
                  <Image
                    src={product.imageUrls[0] || "https://placehold.co/400x400"}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="h-full w-full object-cover object-center transition-opacity group-hover:opacity-75"
                  />
                </div>
                <h3 className="mt-4 text-sm text-gray-700">{product.name}</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">₹{product.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        ) : (
           <div className="mt-16 text-center">
              <p className="text-muted-foreground">No featured products available at the moment. Check back soon!</p>
           </div>
        )}
      </section>
    </main>
  );
}

