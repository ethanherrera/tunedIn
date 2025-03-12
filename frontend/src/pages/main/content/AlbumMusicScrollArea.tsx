import React from "react";
import { ScrollArea, ScrollBar } from "../../../components/ui/scroll-area";
import AlbumMusicItem from "./AlbumMusicItem";
import { Album, AlbumReview } from "../../../api/apiClient";

interface AlbumMusicScrollAreaProps {
  items: Album[];
  reviews?: AlbumReview[];
}

export const AlbumMusicScrollArea: React.FC<AlbumMusicScrollAreaProps> = ({ items = [], reviews = [] }) => {
  const getReviewForItem = (itemId: string): AlbumReview | undefined => {
    return reviews.find(review => review.spotifyAlbumId === itemId);
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-4">
          {items.map((item) => (
              <div key={item.id}>
                <AlbumMusicItem 
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

export default AlbumMusicScrollArea; 