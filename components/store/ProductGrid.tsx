import TechProductCard from "./TechProductCard";
import { products } from "@/data/products";

interface ProductGridProps {
  sortOrder: string;
  searchQuery: string;
}

const ProductGrid = ({ sortOrder, searchQuery }: ProductGridProps) => {
  let filtered = [...products];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }

  if (sortOrder === "price-asc") filtered.sort((a, b) => a.price - b.price);
  else if (sortOrder === "price-desc") filtered.sort((a, b) => b.price - a.price);
  else if (sortOrder === "new-to-old") filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
  else if (sortOrder === "old-to-new") filtered.sort((a, b) => parseInt(a.id) - parseInt(b.id));

  return (
    <section className="bg-tech-white min-h-screen">
      <div className="py-8 px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="border border-tech-gray-200">
              <TechProductCard {...product} image={product.images[0]} />
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center font-mono text-xs text-tech-gray-500 tracking-widest">
            NO PRODUCTS FOUND
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
