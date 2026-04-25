import { useState } from "react";
import { useQuery } from "@apollo/client";
import StoreHeader from "@/components/store/StoreHeader";
import ProductGrid from "@/components/store/ProductGrid";
import StoreFooter from "@/components/store/StoreFooter";
import { GET_PRODUCTS } from "@/graphql/queries";

export default function ShopPage() {
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { data, loading, error } = useQuery(GET_PRODUCTS);

  return (
    <div className="min-h-screen w-full bg-tech-white text-tech-gray-800 flex flex-col overflow-x-hidden">
      <StoreHeader
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="flex-1">
        {loading && (
          <div className="py-16 text-center font-mono text-xs text-tech-gray-800 tracking-widest">
            LOADING
          </div>
        )}
        {error && (
          <div className="py-16 text-center font-mono text-xs text-tech-gray-800 tracking-widest">
            FAILED TO LOAD PRODUCTS
          </div>
        )}
        {!loading && !error && (
          <ProductGrid
            sortOrder={sortOrder}
            searchQuery={searchQuery}
            products={data?.products ?? []}
          />
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
