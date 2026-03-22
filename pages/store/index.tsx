import { useState } from "react";
import StoreHeader from "@/components/store/StoreHeader";
import ProductGrid from "@/components/store/ProductGrid";
import StoreFooter from "@/components/store/StoreFooter";

export default function StorePage() {
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-tech-white text-tech-gray-800 flex flex-col">
      <StoreHeader
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="flex-1">
        <ProductGrid sortOrder={sortOrder} searchQuery={searchQuery} />
      </main>
      <StoreFooter />
    </div>
  );
}
