import { db } from "@/lib/firebase-admin";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";

// Server-side function to get all data for an artisan profile in one go
async function getArtisanData(artisanId: string) {
  try {
    // Set up both queries
    const userDocRef = db.collection('users').doc(artisanId);
    const productsQuery = db.collection('products')
      .where('artisanId', '==', artisanId)
      .where('isVerified', '==', true);
    
    // Run both queries in parallel for better performance
    const [userDoc, productsSnapshot] = await Promise.all([
      userDocRef.get(),
      productsQuery.get()
    ]);

    // Validate that the user exists and is actually an artisan
    if (!userDoc.exists || userDoc.data()?.role !== 'artisan') {
      return { artisan: null, products: [] };
    }

    const artisan = userDoc.data();
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { artisan, products };
  } catch (error) {
    console.error("Failed to fetch artisan data:", error);
    return { artisan: null, products: [] };
  }
}

export default async function ArtisanProfilePage({ params }: { params: { artisanId: string } }) {
  // Use params.artisanId directly to avoid Next.js errors
  const { artisan, products } = await getArtisanData(params.artisanId);
  
  // If no valid artisan is found, trigger a 404 page
  if (!artisan) {
    notFound();
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      {/* Artisan Profile Header */}
      <div className="mb-12 border-b pb-8">
        <h1 className="text-4xl font-bold tracking-tight">{artisan.displayName}</h1>
        {artisan.artisanStory ? (
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">{artisan.artisanStory}</p>
        ) : (
          <p className="mt-4 text-muted-foreground">This artisan hasn't shared their story yet.</p>
        )}
      </div>

      {/* Products Grid */}
      <div>
        <h2 className="text-2xl font-semibold">Creations by {artisan.displayName}</h2>
        {products.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {products.map((product: any) => (
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
           <div className="mt-8 text-center text-muted-foreground">
              <p>This artisan has no products listed yet. Check back soon!</p>
           </div>
        )}
      </div>
    </main>
  );
}

