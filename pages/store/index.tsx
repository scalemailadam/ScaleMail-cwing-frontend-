import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { GET_STORE_HOME } from "../../graphql/queries";

const SHOP_IMG_FALLBACK     = "https://res.cloudinary.com/da1mmkcbp/image/upload/v1776599956/SCALEMAIL_xujapb.jpg";
const LOOKBOOK_IMG_FALLBACK = "https://res.cloudinary.com/da1mmkcbp/image/upload/v1776599933/DSC08114_xbz4xv.jpg";

export default function StoreHome() {
  const router = useRouter();
  const [hoveredShop,     setHoveredShop]     = useState(false);
  const [hoveredLookbook, setHoveredLookbook] = useState(false);

  const { data: cmsData } = useQuery(GET_STORE_HOME);
  const shopImg     = cmsData?.storeHome?.shopImage?.url     || SHOP_IMG_FALLBACK;
  const lookbookImg = cmsData?.storeHome?.lookbookImage?.url || LOOKBOOK_IMG_FALLBACK;

  return (
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden">

      {/* ── SHOP panel ── */}
      <div
        className="relative flex-1 cursor-pointer overflow-hidden"
        style={{ minHeight: "50vh" }}
        onMouseEnter={() => setHoveredShop(true)}
        onMouseLeave={() => setHoveredShop(false)}
        onClick={() => router.push("/store/shop")}
      >
        <Image
          src={shopImg}
          alt="Shop"
          fill
          unoptimized
          priority
          className="object-cover transition-transform duration-700 ease-out"
          style={{ transform: hoveredShop ? "scale(1.03)" : "scale(1)" }}
        />
        {/* dark scrim — slightly deeper on hover */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ backgroundColor: "rgba(0,0,0,0.25)", opacity: hoveredShop ? 0.45 : 0.25 }}
        />
        {/* label */}
        <div className="absolute inset-0 flex items-end justify-start p-8 md:p-12">
          <span
            className="font-mono tracking-widest text-white transition-all duration-300"
            style={{
              fontSize: "clamp(0.75rem, 1.5vw, 1rem)",
              letterSpacing: "0.25em",
              transform: hoveredShop ? "translateY(-4px)" : "translateY(0)",
            }}
          >
            SHOP →
          </span>
        </div>
      </div>

      {/* thin divider line on desktop */}
      <div className="hidden md:block w-px bg-white/20 flex-shrink-0" />

      {/* ── LOOKBOOK panel ── */}
      <div
        className="relative flex-1 cursor-pointer overflow-hidden"
        style={{ minHeight: "50vh" }}
        onMouseEnter={() => setHoveredLookbook(true)}
        onMouseLeave={() => setHoveredLookbook(false)}
        onClick={() => router.push("/store/lookbook")}
      >
        <Image
          src={lookbookImg}
          alt="Lookbook"
          fill
          unoptimized
          priority
          className="object-cover transition-transform duration-700 ease-out"
          style={{ transform: hoveredLookbook ? "scale(1.03)" : "scale(1)" }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ backgroundColor: "rgba(0,0,0,0.15)", opacity: hoveredLookbook ? 0.35 : 0.15 }}
        />
        <div className="absolute inset-0 flex items-end justify-start p-8 md:p-12">
          <span
            className="font-mono tracking-widest text-white transition-all duration-300"
            style={{
              fontSize: "clamp(0.75rem, 1.5vw, 1rem)",
              letterSpacing: "0.25em",
              transform: hoveredLookbook ? "translateY(-4px)" : "translateY(0)",
            }}
          >
            LOOKBOOK →
          </span>
        </div>
      </div>

    </div>
  );
}
