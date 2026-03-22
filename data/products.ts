// Images are served from /public/store-assets/
const a = (file: string) => `/store-assets/${file}`;

export interface ColorVariant {
  name: string;
  hex: string;
  image: string;
  images?: string[];
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  images: string[];
  season: string;
  category: string;
  description: string;
  sizes?: string[];
  colors?: ColorVariant[];
}

export const products: Product[] = [
  {
    id: "2",
    code: "SM-CITY-002",
    name: "Scale Mail City Bag 002",
    price: 320,
    images: [
      a("city-bag-002-black-front.png"), a("city-bag-002-black-back.png"),
      a("city-bag-002-black-pocket.png"), a("city-bag-002-black-strap.png"),
      a("city-bag-002-black-buckle1.png"), a("city-bag-002-black-buckle2.png"),
      a("city-bag-002-sand-front.png"), a("city-bag-002-sand-back.png"),
      a("city-bag-002-sand-pocket.png"), a("city-bag-002-sand-strap.png"),
      a("city-bag-002-sand-buckle1.png"), a("city-bag-002-sand-buckle2.png"),
    ],
    season: "SS25",
    category: "Bags",
    description:
      "Carry something built with intent.\n\nEach Scale Mail City Bag is handmade—cut, assembled, and finished one at a time. Fully lined and filled with structured puff, it holds its shape without sacrificing comfort. The main compartment includes an internal pocket to keep your essentials organized, while the front pocket is fully lined for durability and a clean finish.\n\nThe strap is fabric-covered and integrated with elastic for added bounce and long-wear comfort. It moves with you, not against you. Secured with a heavy-duty Cobra buckle and precision adjuster system, the fit is fast, secure, and uncompromising.\n\nNo excess. No shortcuts. Just construction you can feel.\n\nProduct Details:\n• 27 cm height\n• 46 cm zipper width\n• 24 × 14 cm internal pocket\n• 50 cm strap sleeve length\n\n*Each bag is unique and after stock is depleted we cannot guarantee an identical fabric — if interested in a custom color please contact us directly.",
    colors: [
      {
        name: "Black", hex: "#1a1a1a",
        image: a("city-bag-002-black-front.png"),
        images: [a("city-bag-002-black-front.png"), a("city-bag-002-black-back.png"), a("city-bag-002-black-pocket.png"), a("city-bag-002-black-strap.png"), a("city-bag-002-black-buckle1.png"), a("city-bag-002-black-buckle2.png")],
      },
      {
        name: "Sand", hex: "#c2b280",
        image: a("city-bag-002-sand-front.png"),
        images: [a("city-bag-002-sand-front.png"), a("city-bag-002-sand-back.png"), a("city-bag-002-sand-pocket.png"), a("city-bag-002-sand-strap.png"), a("city-bag-002-sand-buckle1.png"), a("city-bag-002-sand-buckle2.png")],
      },
    ],
  },
  {
    id: "3",
    code: "SM-CITY-002R",
    name: "Scale Mail City Bag 002 Reflective",
    price: 350,
    images: [
      a("city-bag-002r-black-front.png"), a("city-bag-002r-black-back.png"),
      a("city-bag-002r-black-flash.png"), a("city-bag-002r-black-inside.png"),
      a("city-bag-002r-black-pocket.png"), a("city-bag-002r-black-strap.png"),
      a("city-bag-002r-sand-front.png"), a("city-bag-002r-sand-back.png"),
      a("city-bag-002r-sand-flash.png"), a("city-bag-002r-sand-pocket.png"),
      a("city-bag-002r-sand-buckle.png"), a("city-bag-002r-sand-strap.png"),
    ],
    season: "SS25",
    category: "Bags",
    description:
      "Carry something built with intent.\n\nEach Scale Mail City Bag is handmade—cut, assembled, and finished one at a time. Fully lined and filled with structured puff, it holds its shape without sacrificing comfort. The main compartment includes an internal pocket to keep your essentials organized, while the front pocket is fully lined for durability and a clean finish.\n\nThe strap is fabric-covered and integrated with elastic for added bounce and long-wear comfort. It moves with you, not against you. Secured with a heavy-duty Cobra buckle and precision adjuster system, the fit is fast, secure, and uncompromising.\n\nNo excess. No shortcuts. Just construction you can feel.\n\nProduct Details:\n• 27 cm height\n• 46 cm zipper width\n• 24 × 14 cm internal pocket\n• 50 cm strap sleeve length\n\n*Each bag is unique and after stock is depleted we cannot guarantee an identical fabric — if interested in a custom color please contact us directly.",
    colors: [
      {
        name: "Black", hex: "#1a1a1a",
        image: a("city-bag-002r-black-front.png"),
        images: [a("city-bag-002r-black-front.png"), a("city-bag-002r-black-back.png"), a("city-bag-002r-black-flash.png"), a("city-bag-002r-black-inside.png"), a("city-bag-002r-black-pocket.png"), a("city-bag-002r-black-strap.png")],
      },
      {
        name: "Sand", hex: "#c2b280",
        image: a("city-bag-002r-sand-front.png"),
        images: [a("city-bag-002r-sand-front.png"), a("city-bag-002r-sand-back.png"), a("city-bag-002r-sand-flash.png"), a("city-bag-002r-sand-pocket.png"), a("city-bag-002r-sand-buckle.png"), a("city-bag-002r-sand-strap.png")],
      },
    ],
  },
];

export const getProductById = (id: string): Product | undefined =>
  products.find((p) => p.id === id);
