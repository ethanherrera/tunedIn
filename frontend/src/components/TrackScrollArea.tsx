import React, { useState, useEffect } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import RankingDialog from "@/components/RankingDialog.tsx";
import TrackCard from "@/components/TrackCard.tsx";
import { reviewApi, Track, TrackReview } from "@/api/apiClient";

// Define the review interface
interface Review {
  id: string;
  userId: string;
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  rating: number;
  ranking: number;
  createdAt: number;
  genres: string[];
}

interface TrackScrollAreaProps {
  items: Track[];
  reviews?: TrackReview[];
  showRating?: boolean;
}

export const TrackScrollArea: React.FC<TrackScrollAreaProps> = ({ items = [], reviews = [] }) => {


  const getReviewForItem = (itemId: string): TrackReview | undefined => {
    return reviews.find(review => review.spotifyTrackId === itemId);
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-4">
          {items.map((item, index) => (
              <div key={`${item.id}-${index}`}>
                <TrackCard
                  item={item} 
                  items={items}
                  reviews={reviews}
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

export default TrackScrollArea;