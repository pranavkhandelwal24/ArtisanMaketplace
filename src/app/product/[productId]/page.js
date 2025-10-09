import { db } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductActions } from "@/components/products/ProductActions";
import { ProductViewTracker } from "@/components/products/ProductViewTracker";
import { ProductImageCarousel } from "@/components/products/ProductImageCarousel"; // 1. Import the new carousel component

function serializeObject(obj) {
  // This function is crucial for passing complex data like Timestamps
  // from a Server Component to a Client Component.
  return JSON.parse(JSON.stringify(obj));
}

async function getProductDetails(productId) {
  try {
    const productDocRef = db.collection('products').doc(productId);
    const docSnap = await productDocRef.get();
    
    if (!docSnap.exists) {
      return null;
    }
    
    const productData = { id: docSnap.id, ...docSnap.data() };
    
    if (productData?.artisanId) {
        const artisanSnap = await db.collection('users').doc(productData.artisanId).get();
        if(artisanSnap.exists) {
            productData.artisan = artisanSnap.data();
        }
    }
  
    return serializeObject(productData);
  } catch (error) {
    console.error("Failed to get product details:", error);
    return null;
  }
}

export default async function ProductPage({ params }) {
  const product = await getProductDetails(params.productId);

  if (!product || !product.isVerified) {
    notFound();
  }

  // THE FIX: For backward compatibility, if the new 'media' field doesn't exist,
  // create it from the old 'imageUrls' field so the carousel can display the images.
  const mediaToDisplay = product.media || (product.imageUrls || []).map(url => ({
    type: 'image',
    url: url,
  }));

  return (
    <div className="bg-white">
      <ProductViewTracker productId={product.id} />
      <div className="pt-6">
        <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 lg:max-w-7xl lg:px-8 lg:pb-24">
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
            
            {/* The carousel component now receives a compatible media array for all products */}
            <ProductImageCarousel media={mediaToDisplay} />

            {/* Product info */}
            <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>
              <div className="mt-3">
                <p className="text-3xl tracking-tight text-gray-900">₹{product.price.toFixed(2)}</p>
              </div>
              <div className="mt-6">
                <div className="space-y-6 text-base text-gray-700">
                  <p>{product.description}</p>
                </div>
              </div>
              {product.artisan && (
                 <div className="mt-6">
                    <Link href={`/artisans/${product.artisanId}`} className="group">
                       <div className="mt-1 text-sm text-gray-500">
                          <span className="font-medium text-gray-900 group-hover:underline">
                              Sold by {product.artisan.displayName}
                          </span>
                       </div>
                    </Link>
                  </div>
              )}
              <div className="mt-10 flex">
                <ProductActions product={product} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

