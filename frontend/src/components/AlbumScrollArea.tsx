import React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import AlbumCard from "@/components/AlbumCard.tsx";
import { Album, AlbumReview } from "@/api/apiClient";

interface AlbumScrollAreaProps {
  items: Album[];
  reviews?: AlbumReview[];
}

export const AlbumScrollArea: React.FC<AlbumScrollAreaProps> = ({ items = [], reviews = [] }) => {
  const getReviewForItem = (itemId: string): AlbumReview | undefined => {
    return reviews.find(review => review.spotifyAlbumId === itemId);
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-4">
          {items.map((item) => (
              <div key={item.id}>
                <AlbumCard
                  item={item} 
                  review={getReviewForItem(item.id)}
                />
              </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default AlbumScrollArea;