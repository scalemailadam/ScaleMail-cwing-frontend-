import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

interface TechProductCardProps {
  id: string;
  code: string;
  name: string;
  price: number;
  image: string;
  season?: string;
  quantity?: number | null;
}

const TechProductCard = ({ id, code, name, image, quantity }: TechProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const soldOut = quantity !== null && quantity !== undefined && quantity <= 0;

  return (
    <div
      className="group relative bg-tech-white transition-instant cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/store/product/${id}`)}
    >
      <div className="relative overflow-hidden bg-white aspect-square">
        <Image
          src={image}
          alt={code}
          fill
          unoptimized
          className="object-cover transition-transform duration-200 group-hover:scale-105"
        />
        <div className={`absolute inset-0 bg-tech-black/10 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`} />
      </div>
      <div className="p-2 bg-tech-white">
        <div className="font-mono text-xs text-tech-black tracking-widest mb-1">{code}</div>
        {isHovered && (
          <div className="font-mono text-xs tracking-wide">
            {soldOut
              ? <span className="text-tech-gray-400">SOLD OUT</span>
              : <span className="text-tech-gray-800">{name}</span>
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default TechProductCard;
