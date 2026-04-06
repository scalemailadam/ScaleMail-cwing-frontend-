import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@apollo/client";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { GET_PRODUCT } from "@/graphql/queries";
import { useCart } from "@/context/CartContext";

const imgUrl = (url: string) =>
  url.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_STRAPI_URL}${url}`;

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const { addItem } = useCart();

  const { data, loading, error } = useQuery(GET_PRODUCT, {
    variables: { documentId: id },
    skip: !id,
  });

  const product = data?.product;
  const colorVariant = selectedColor && product?.colors ? product.colors.find((c: any) => c.name === selectedColor) : null;

  const activeImages: string[] = colorVariant?.images?.length
    ? colorVariant.images.map((img: { url: string }) => imgUrl(img.url))
    : product?.images?.map((img: { url: string }) => imgUrl(img.url)) ?? [];

  const currentImage = activeImages[currentImageIndex] ?? activeImages[0];

  // Preload all product images so switching is instant
  useEffect(() => {
    if (!product) return;
    const allImages = new Set<string>();
    product.images?.forEach((img: { url: string }) => allImages.add(imgUrl(img.url)));
    product.colors?.forEach((c: any) => {
      if (c.image) allImages.add(imgUrl(c.image.url));
      c.images?.forEach((img: { url: string }) => allImages.add(imgUrl(img.url)));
    });
    allImages.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-tech-white flex items-center justify-center">
        <div className="font-mono text-xs tracking-widest">LOADING</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-tech-white flex items-center justify-center">
        <div className="font-mono text-xs tracking-widest">PRODUCT NOT FOUND</div>
      </div>
    );
  }

  const sizes: string[] = product.sizes
    ? product.sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  const handleAddToCart = () => {
    if (sizes.length && !selectedSize) { toast.error("Please select a size"); return; }
    if (product.colors?.length && !selectedColor) { toast.error("Please select a color"); return; }
    const cv = product.colors?.find((c: any) => c.name === selectedColor);
    addItem({
      productId: product.documentId,
      code: product.code,
      name: product.name,
      price: product.price,
      image: cv?.image ? imgUrl(cv.image.url) : activeImages[0],
      size: selectedSize ?? "One Size",
      color: selectedColor ?? "Default",
    });
    toast.success(`${product.code} added to cart`);
  };

  return (
    <div className="min-h-screen bg-tech-white text-tech-gray-800">
      <StoreHeader sortOrder={sortOrder} onSortChange={setSortOrder} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="pt-16">
        <button
          onClick={() => router.back()}
          className="fixed top-20 left-4 z-10 font-mono text-xs tracking-widest hover:opacity-60 transition-opacity cursor-pointer"
        >
          ← BACK
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
          {/* Image */}
          <div className="relative bg-white flex items-center justify-center min-h-[60vh] md:min-h-[70vh] lg:h-[calc(100vh-4rem)]">
            {currentImage && (
              <Image
                src={currentImage}
                alt={product.code}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-4 md:p-8"
                priority
              />
            )}
            {activeImages.length > 1 && (
              <>
                <button onClick={() => setCurrentImageIndex((p) => (p === 0 ? activeImages.length - 1 : p - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-tech-gray-800 bg-white/80 hover:bg-white transition-colors z-10 cursor-pointer">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentImageIndex((p) => (p === activeImages.length - 1 ? 0 : p + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-tech-gray-800 bg-white/80 hover:bg-white transition-colors z-10 cursor-pointer">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {activeImages.map((_, i) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)} className={`w-2 h-2 transition-colors cursor-pointer ${i === currentImageIndex ? "bg-tech-black" : "bg-tech-gray-400"}`} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="p-8 lg:p-16 flex flex-col justify-center">
            <div className="max-w-md">
              <h1 className="font-mono text-sm tracking-widest mb-2">{product.code}</h1>
              <h2 className="font-mono text-xs tracking-wide text-tech-gray-800 mb-8">{product.name}</h2>
              <div className="font-mono text-sm tracking-widest mb-8">${product.price.toLocaleString()}</div>
              <p className="font-mono text-xs leading-relaxed text-tech-gray-800 mb-12 whitespace-pre-line">{product.description}</p>

              {sizes.length > 0 && (
                <div className="mb-8">
                  <div className="font-mono text-xs tracking-widest text-tech-gray-800 mb-3">SIZE</div>
                  <div className="flex gap-2">
                    {sizes.map((size: string) => (
                      <button key={size} onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                        className={`font-mono text-xs tracking-widest px-5 py-3 border transition-colors cursor-pointer ${selectedSize === size ? "bg-tech-black text-tech-white border-tech-black" : "border-tech-gray-300 hover:border-tech-black"}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors && product.colors.length > 0 && (
                <div className="mb-8">
                  <div className="font-mono text-xs tracking-widest text-tech-gray-800 mb-3">
                    COLOR{selectedColor ? ` — ${selectedColor.toUpperCase()}` : ""}
                  </div>
                  <div className="flex gap-3">
                    {product.colors.map((color: any) => (
                      <button key={color.name}
                        onClick={() => { setSelectedColor(color.name === selectedColor ? null : color.name); setCurrentImageIndex(0); }}
                        className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${selectedColor === color.name ? "border-tech-black scale-110" : "border-tech-gray-300 hover:border-tech-gray-500"}`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleAddToCart} className="w-full bg-tech-black text-tech-white font-mono text-xs tracking-widest py-4 hover:bg-tech-gray-800 transition-colors cursor-pointer">
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
