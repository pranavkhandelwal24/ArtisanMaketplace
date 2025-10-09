import { db } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ProductActions } from "@/components/products/ProductActions";

// This function serializes data to prevent Server/Client component errors
function serializeObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

async function getProductDetails(productId) {
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

  // Convert the complex Firestore object into a plain object before returning
  return serializeObject(productData);
}

export default async function ProductPage({ params }) {
  // Use params.productId directly to fix the Next.js error
  const product = await getProductDetails(params.productId);

  if (!product || !product.isVerified) {
    notFound();
  }

  return (
    <div className="bg-white">
      <div className="pt-6">
        <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 lg:max-w-7xl lg:px-8 lg:pb-24">
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
            {/* Image gallery */}
            <div className="flex flex-col-reverse">
              <div className="aspect-h-1 aspect-w-1 w-full">
                <Image
                  src={product.imageUrls[0] || "https://placehold.co/600x600"}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="h-full w-full rounded-lg border object-cover object-center shadow-sm sm:rounded-lg"
                />
              </div>
            </div>

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
                   <a href={`/artisans/${product.artisanId}`} className="group">
                      <div className="mt-1 text-sm text-gray-500">
                         <span className="font-medium text-gray-900 group-hover:underline">
                             Sold by {product.artisan.displayName}
                         </span>
                      </div>
                   </a>
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
