"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { FilterSidebar } from "@/components/products/FilterSidebar";
import { PaginationControls } from "@/components/products/PaginationControls";

const PRODUCTS_PER_PAGE = 12;

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for all filters
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sortOption, setSortOption] = useState('newest');
  const [priceRange, setPriceRange] = useState([10000]);
  const [category, setCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // THE FIX: When the search query in the URL changes, update our search term
  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const productsQuery = query(collection(db, 'products'), where('isVerified', '==', true));
      const querySnapshot = await getDocs(productsQuery);
      const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllProducts(products);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const processedProducts = useMemo(() => {
    let products = [...allProducts];
    if (searchTerm) {
      products = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    // We will activate this in the next step
    // if (category !== 'all') { ... } 
    products = products.filter(p => p.price <= priceRange[0]);
    switch (sortOption) {
      case 'price-asc': products.sort((a, b) => a.price - b.price); break;
      case 'price-desc': products.sort((a, b) => b.price - a.price); break;
      default: products.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); break;
    }
    return products;
  }, [searchTerm, sortOption, priceRange, category, allProducts]);
  
  const totalPages = Math.ceil(processedProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = processedProducts.slice(
      (currentPage - 1) * PRODUCTS_PER_PAGE,
      currentPage * PRODUCTS_PER_PAGE
  );

  if (loading) {
      return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-8 border-b pb-6">
        <h1 className="text-4xl font-bold tracking-tight">All Products</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore handcrafted treasures from artisans around the world.
        </p>
      </div>
      <div className="flex flex-col gap-8 md:flex-row">
        <FilterSidebar
            sortOption={sortOption} onSortChange={setSortOption}
            priceRange={priceRange} onPriceChange={setPriceRange}
            category={category} onCategoryChange={setCategory}
            onClearFilters={() => {
                setSortOption('newest'); setPriceRange([10000]); setCategory('all'); setSearchTerm('');
            }}
        />
        <div className="flex-1">
            {/* THE FIX: The redundant search bar has been removed from this page. */}
            {paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {paginatedProducts.map((product) => (
                    <Link key={product.id} href={`/product/${product.id}`} className="group">
                    <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200">
                        <Image
                        src={product.imageUrls[0] || "https://placehold.co/400x400"} alt={product.name}
                        width={400} height={400} className="h-full w-full object-cover object-center group-hover:opacity-75"
                        />
                    </div>
                    <h3 className="mt-4 text-sm text-gray-700">{product.name}</h3>
                    <p className="mt-1 text-lg font-medium text-gray-900">₹{product.price.toFixed(2)}</p>
                    </Link>
                ))}
                </div>
            ) : (
                <div className="mt-16 text-center"><h2 className="text-2xl font-semibold">No Products Found</h2><p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p></div>
            )}
            {totalPages > 1 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
      </div>
    </main>
  );
}

export default function AllProductsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>}>
            <ProductsContent />
        </Suspense>
    );
}

