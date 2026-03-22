import { useRouter } from "next/router";
import { useState } from "react";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";

export default function ThankYouPage() {
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const isOrder = router.query.type === "order";

  return (
    <div className="min-h-screen bg-tech-white flex flex-col">
      <StoreHeader sortOrder={sortOrder} onSortChange={setSortOrder} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-16">
        <h1 className="font-mono text-sm tracking-widest mb-4">
          {isOrder ? "THANK YOU FOR YOUR ORDER" : "THANK YOU FOR YOUR MESSAGE"}
        </h1>
        <p className="font-mono text-xs text-tech-gray-500 tracking-wide text-center max-w-md mb-10">
          We&apos;ll get back to you as soon as possible.
        </p>
        <button
          onClick={() => router.push("/store")}
          className="font-mono text-xs tracking-widest border border-tech-black px-8 py-3 hover:bg-tech-black hover:text-tech-white transition-colors"
        >
          CONTINUE SHOPPING
        </button>
      </main>
      <StoreFooter />
    </div>
  );
}
