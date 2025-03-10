import React, { useState, useEffect } from "react";
import { ScrollArea, ScrollBar } from "../../../components/ui/scroll-area";
import RankingDialog from "./RankingDialog";
import TrackMusicItem from "./TrackMusicItem";
import { UITrack } from "../../../types/spotify";
import { reviewApi } from "../../../api/apiClient";

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
  items: UITrack[];
  reviews?: Review[];
  showRating?: boolean;
}

export const TrackMusicScrollArea: React.FC<TrackMusicScrollAreaProps> = ({ items, reviews = [], showRating = false }) => {
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);

  // Update local reviews when props change
  useEffect(() => {
    setLocalReviews(reviews);
  }, [reviews]);

  const handleDialogOpen = (id: string) => {
    setOpenDialogId(id);
  };

  const handleDialogClose = () => {
    setOpenDialogId(null);
  };

  const handleReviewSaved = async () => {
    handleDialogClose();
    
    // Fetch updated reviews
    try {
      const userReviews = await reviewApi.getUserReviews();
      setLocalReviews(userReviews);
    } catch (error) {
      console.error('Error fetching updated reviews:', error);
    }
  };

  // Function to get review for a track
  const getReviewForItem = (itemId: string): Review | undefined => {
    return localReviews.find(review => review.spotifyTrackId === itemId);
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-4">
          {items.map((item) => (
            <RankingDialog 
              key={item.spotifyId} 
              isOpen={openDialogId === item.spotifyId}
              onClose={handleDialogClose}
              item={item}
              itemType="track"
              existingReviewId={getReviewForItem(item.spotifyId)?.id}
              onAlbumReviewSaved={handleReviewSaved}
            >
              <div onClick={() => handleDialogOpen(item.spotifyId)}>
                <TrackMusicItem 
                  item={item} 
                  review={getReviewForItem(item.spotifyId)}
                  showRating={showRating}
                />
              </div>
            </RankingDialog>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default TrackMusicScrollArea; 