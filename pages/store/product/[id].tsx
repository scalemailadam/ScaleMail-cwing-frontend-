import { useRouter } from "next/router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { getProductById } from "@/data/products";
import { useCart } from "@/context/CartContext";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const { addItem } = useCart();

  const product = id ? getProductById(id) : undefined;
  const colorVariant = selectedColor && product?.colors ? product.colors.find((c) => c.name === selectedColor) : null;
  const activeImages = colorVariant?.images?.length ? colorVariant.images : product?.images ?? [];
  const currentImage = activeImages[currentImageIndex] ?? activeImages[0];

  if (!product) {
    return (
      <div className="min-h-screen bg-tech-white flex items-center justify-center">
        <div className="font-mono text-xs tracking-widest">PRODUCT NOT FOUND</div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.sizes?.length && !selectedSize) { toast.error("Please select a size"); return; }
    if (product.colors?.length && !selectedColor) { toast.error("Please select a color"); return; }
    const cv = product.colors?.find((c) => c.name === selectedColor);
    addItem({
      productId: product.id,
      code: product.code,
      name: product.name,
      price: product.price,
      image: cv?.image ?? product.images[0],
      size: selectedSize ?? "One Size",
      color: selectedColor ?? "Default",
    });
    toast.success(`${product.code} added to cart`);
  };

  return (
    <div className="min-h-screen bg-tech-white">
      <StoreHeader sortOrder={sortOrder} onSortChange={setSortOrder} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="pt-16">
        <button
          onClick={() => router.back()}
          className="fixed top-20 left-4 z-10 font-mono text-xs tracking-widest hover:opacity-60 transition-opacity"
        >
          ← BACK
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
          {/* Image */}
          <div className="relative bg-tech-gray-100 flex items-center justify-center min-h-[60vh] md:min-h-[70vh] lg:h-[calc(100vh-4rem)]">
            <img src={currentImage} alt={product.code} className="w-full h-full object-contain p-4 md:p-8" />
            {activeImages.length > 1 && (
              <>
                <button onClick={() => setCurrentImageIndex((p) => (p === 0 ? activeImages.length - 1 : p - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-tech-white/80 hover:bg-tech-white transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentImageIndex((p) => (p === activeImages.length - 1 ? 0 : p + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-tech-white/80 hover:bg-tech-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {activeImages.map((_, i) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)} className={`w-2 h-2 transition-colors ${i === currentImageIndex ? "bg-tech-black" : "bg-tech-gray-400"}`} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="p-8 lg:p-16 flex flex-col justify-center">
            <div className="max-w-md">
              <h1 className="font-mono text-sm tracking-widest mb-2">{product.code}</h1>
              <h2 className="font-mono text-xs tracking-wide text-tech-gray-600 mb-8">{product.name}</h2>
              <div className="font-mono text-sm tracking-widest mb-8">${product.price.toLocaleString()}</div>
              <p className="font-mono text-xs leading-relaxed text-tech-gray-600 mb-12 whitespace-pre-line">{product.description}</p>

              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-8">
                  <div className="font-mono text-xs tracking-widest text-tech-gray-700 mb-3">SIZE</div>
                  <div className="flex gap-2">
                    {product.sizes.map((size) => (
                      <button key={size} onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                        className={`font-mono text-xs tracking-widest px-5 py-3 border transition-colors ${selectedSize === size ? "bg-tech-black text-tech-white border-tech-black" : "border-tech-gray-300 hover:border-tech-black"}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors && product.colors.length > 0 && (
                <div className="mb-8">
                  <div className="font-mono text-xs tracking-widest text-tech-gray-700 mb-3">
                    COLOR{selectedColor ? ` — ${selectedColor.toUpperCase()}` : ""}
                  </div>
                  <div className="flex gap-3">
                    {product.colors.map((color) => (
                      <button key={color.name}
                        onClick={() => { setSelectedColor(color.name === selectedColor ? null : color.name); setCurrentImageIndex(0); }}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color.name ? "border-tech-black scale-110" : "border-tech-gray-300 hover:border-tech-gray-500"}`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleAddToCart} className="w-full bg-tech-black text-tech-white font-mono text-xs tracking-widest py-4 hover:bg-tech-gray-800 transition-colors">
                ADD TO CART
              </button>
            </div>
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
