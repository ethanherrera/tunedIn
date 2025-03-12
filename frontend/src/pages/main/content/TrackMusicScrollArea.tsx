import React, { useState, useEffect } from "react";
import { ScrollArea, ScrollBar } from "../../../components/ui/scroll-area";
import RankingDialog from "./RankingDialog";
import TrackMusicItem from "./TrackMusicItem";
import { reviewApi, Track, TrackReview } from "../../../api/apiClient";

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

interface TrackMusicScrollAreaProps {
  items: Track[];
  reviews?: TrackReview[];
  showRating?: boolean;
}

export const TrackMusicScrollArea: React.FC<TrackMusicScrollAreaProps> = ({ items = [], reviews = [] }) => {


  const getReviewForItem = (itemId: string): TrackReview | undefined => {
    return reviews.find(review => review.spotifyTrackId === itemId);
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-4">
          {items.map((item) => (
              <div key={item.id}>
                <TrackMusicItem 
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

export default TrackMusicScrollArea; 