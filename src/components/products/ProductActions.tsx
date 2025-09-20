"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { DocumentData } from "firebase/firestore";
import { ShoppingCart, CheckCircle } from "lucide-react";
import { useState } from "react";

// This component is interactive, so it's a Client Component.
// It receives the product data fetched on the server as a prop.
export function ProductActions({ product }: { product: DocumentData }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    // Revert the button state after a short delay for user feedback
    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  return (
    <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={added}>
      {added ? (
        <>
          <CheckCircle className="mr-2 h-5 w-5" />
          Added to Cart!
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add to Cart
        </>
      )}
    </Button>
  );
}

