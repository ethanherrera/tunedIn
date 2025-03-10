import React, { useState, useEffect } from "react";
import { ScrollArea, ScrollBar } from "../../../components/ui/scroll-area";
import RankingDialog from "./RankingDialog";
import ArtistMusicItem from "./ArtistMusicItem";
import { UIArtist } from "../../../types/spotify";
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

interface ArtistMusicScrollAreaProps {
  items: UIArtist[];
  reviews?: Review[];
  showRating?: boolean;
}

export const ArtistMusicScrollArea: React.FC<ArtistMusicScrollAreaProps> = ({ items, reviews = [], showRating = false }) => {
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

  // Function to get review for an artist
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
              itemType="artist"
              existingReviewId={getReviewForItem(item.spotifyId)?.id}
              onAlbumReviewSaved={handleReviewSaved}
            >
              <div onClick={() => handleDialogOpen(item.spotifyId)}>
                <ArtistMusicItem 
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

export default ArtistMusicScrollArea; 