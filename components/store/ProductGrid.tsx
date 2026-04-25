import TechProductCard from "./TechProductCard";

interface StrapiColorVariant {
  name: string;
  hex: string;
  image?: { url: string };
  images?: { url: string }[];
}

export interface StrapiProduct {
  documentId: string;
  code: string;
  name: string;
  price: number;
  description: string;
  season: string;
  category: string;
  sizes: string[];
  quantity?: number | null;
  images: { url: string }[];
  colors?: StrapiColorVariant[];
}

interface ProductGridProps {
  sortOrder: string;
  searchQuery: string;
  products: StrapiProduct[];
}

const imgUrl = (url: string) =>
  url.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_STRAPI_URL}${url}`;

const ProductGrid = ({ sortOrder, searchQuery, products }: ProductGridProps) => {
  let filtered = [...products];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }

  if (sortOrder === "price-asc") filtered.sort((a, b) => a.price - b.price);
  else if (sortOrder === "price-desc") filtered.sort((a, b) => b.price - a.price);
  else if (sortOrder === "new-to-old") filtered.sort((a, b) => a.documentId.localeCompare(b.documentId) * -1);
  else if (sortOrder === "old-to-new") filtered.sort((a, b) => a.documentId.localeCompare(b.documentId));

  return (
    <section className="bg-tech-white min-h-screen w-full overflow-x-hidden">
      <div className="py-8 px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {filtered.map((product) => (
            <div key={product.documentId} className="border border-white">
              <TechProductCard
                id={product.documentId}
                code={product.code}
                name={product.name}
                price={product.price}
                image={product.images[0] ? imgUrl(product.images[0].url) : ""}
                quantity={product.quantity}
              />
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center font-mono text-xs text-tech-gray-800 tracking-widest">
            NO PRODUCTS FOUND
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
