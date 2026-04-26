import { useQuery } from "@apollo/client";
import Image from "next/image";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { GET_LOOKBOOK_PHOTOS } from "@/graphql/queries";
import { useState } from "react";

const imgUrl = (url: string) =>
  url.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_STRAPI_URL}${url}`;

export default function LookbookPage() {
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { data, loading, error } = useQuery(GET_LOOKBOOK_PHOTOS);

  return (
    <div className="min-h-screen bg-tech-white text-tech-gray-800 flex flex-col">
      <StoreHeader
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="flex-1 pt-16">
        {loading && (
          <div className="py-16 text-center font-mono text-xs text-tech-gray-800 tracking-widest">
            LOADING
          </div>
        )}
        {error && (
          <div className="py-16 text-center font-mono text-xs text-tech-gray-800 tracking-widest">
            FAILED TO LOAD
          </div>
        )}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-1">
            {(data?.lookbookPhotos ?? []).map((photo: any) => (
              <div key={photo.documentId} className="flex flex-col">
                <div className="relative aspect-square">
                  <Image
                    src={imgUrl(photo.image.url)}
                    alt={photo.caption ?? "Lookbook photo"}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                {photo.caption && (
                  <p className="font-mono text-[10px] tracking-widest text-tech-gray-400 mt-1 px-0.5">
                    {photo.caption}
                  </p>
                )}
              </div>
            ))}
            {!loading && (data?.lookbookPhotos ?? []).length === 0 && (
              <div className="col-span-3 py-16 text-center font-mono text-xs text-tech-gray-400 tracking-widest">
                NO PHOTOS YET
              </div>
            )}
          </div>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
