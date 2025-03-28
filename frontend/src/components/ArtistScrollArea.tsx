import React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ArtistCard from "@/components/ArtistCard.tsx";
import { Artist } from "@/api/apiClient";

// Using TrackReview structure as a temporary type until ArtistReview is implemented
interface ArtistReview {
  spotifyArtistId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  rating: number;
}

interface ArtistScrollAreaProps {
  items: Artist[];
  reviews?: ArtistReview[];
}

export const ArtistScrollArea: React.FC<ArtistScrollAreaProps> = ({ items = [], reviews = [] }) => {
  const getReviewForItem = (itemId: string): ArtistReview | undefined => {
    return reviews.find(review => review.spotifyArtistId === itemId);
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-4">
          {items.map((item, index) => (
              <div key={`${item.id}-${index}`}>
                <ArtistCard
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

export default ArtistScrollArea;