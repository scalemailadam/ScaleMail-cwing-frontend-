import { useState } from "react";
import { useRouter } from "next/router";
import { Search, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface StoreHeaderProps {
  sortOrder: string;
  onSortChange: (sort: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const StoreHeader = ({ sortOrder, onSortChange, searchQuery, onSearchChange }: StoreHeaderProps) => {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();
  const { totalItems } = useCart();

  return (
    <header className="border-b border-tech-gray-200 bg-tech-white text-tech-gray-800 sticky top-0 z-50">
      <div className="px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <button onClick={() => router.push("/store")} className="flex items-center">
            <img src="/store-assets/scale-mail-logo.png" alt="SCALE MAIL" className="h-6" />
          </button>

          {/* Sort dropdown */}
          <nav className="hidden md:flex items-center space-x-8">
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1 text-xs font-mono font-medium text-tech-black hover:text-tech-gray-800 transition-instant uppercase tracking-widest"
              >
                SORT
                <ChevronDown className="h-3 w-3" />
              </button>
              {showSortMenu && (
                <div className="absolute top-full left-0 mt-2 bg-tech-white border border-tech-gray-200 shadow-sm z-50 min-w-[180px]">
                  {[
                    { value: "price-asc", label: "PRICE: LOW TO HIGH" },
                    { value: "price-desc", label: "PRICE: HIGH TO LOW" },
                    { value: "new-to-old", label: "DATE: NEW TO OLD" },
                    { value: "old-to-new", label: "DATE: OLD TO NEW" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => { onSortChange(value); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-xs font-mono tracking-widest hover:bg-tech-gray-100 ${sortOrder === value ? "text-tech-black font-medium" : "text-tech-gray-800"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className="text-xs font-mono font-medium text-tech-black hover:text-tech-gray-800 transition-instant uppercase tracking-widest"
            >
              SEARCH
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/store/contact")}
              className="text-xs font-mono font-medium text-tech-black hover:text-tech-gray-800 transition-instant uppercase tracking-widest"
            >
              CONTACT US
            </button>
            <button
              onClick={() => router.push("/store/cart")}
              className="text-xs font-mono font-medium text-tech-black hover:text-tech-gray-800 transition-instant uppercase tracking-widest"
            >
              🛒 CART ({totalItems})
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="py-3 border-t border-tech-gray-200">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-tech-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="SEARCH PRODUCTS..."
                className="w-full pl-6 pr-4 py-2 text-xs font-mono tracking-widest bg-transparent border-none outline-none placeholder:text-tech-gray-400"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default StoreHeader;
