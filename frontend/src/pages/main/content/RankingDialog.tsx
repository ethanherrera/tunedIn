import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { DialogTitle } from "../../../components/ui/dialog";
import { Progress } from "../../../components/ui/progress";
import MusicItem from "./MusicItem";
import { Track, Album, Artist } from "../content/MusicItem";
import { reviewApi } from "@/api/apiClient";

interface RankingDialogProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  item: Track | Album | Artist;
  itemType: "track" | "album" | "artist";
  existingReviewId?: string;
  onAlbumReviewSaved?: () => void;
}

interface ReviewData {
  id: string;
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  ranking: number;
}

const RankingDialog: React.FC<RankingDialogProps> = ({ children, isOpen, onClose, item, itemType }) => {
  const [review, setReview] = useState("");
  const maxLength = 300;
  const [isComparing, setIsComparing] = useState(false);
  const [opinion, setOpinion] = useState<'DISLIKE' | 'NEUTRAL' | 'LIKED' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleComparisonStart = async () => {
    // await api call to get comparison tracks
    setIsComparing(true);
  }

  const onOpinionSelected = (e: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    if (opinion === null || opinion !== e) {
      setOpinion(e);
      setIsComparing(false);
    }
    handleComparisonStart();
  }

    // Extract submit logic to a reusable function
    const submitReview = async (ranking?: number) => {
      try {
        // Get the opinion value from the rating
        if (!opinion) {
          setError('Please select a rating (Dislike, Neutral, or Like)');
          return;
        }

        let reviewData: ReviewData;

        if (itemType === "track") {
          reviewData = {
            spotifyTrackId: item.spotifyId,
            opinion: opinion,
            description: review,
            ranking:  0,
          };
        } else if (itemType === "album") {
          // reviewData = {
          //   spotifyAlbumId: item.spotifyId,
          //   opinion: opinion,
          //   description: review,
          //   ranking: 0,
          // };
        } else if (itemType === "artist") {
          // reviewData = {
          //   spotifyArtistId: item.spotifyId,
          //   opinion: opinion,
          //   description: review,
          //   ranking: 0,
          // };
        }

        if (!reviewData) {
          setError('Invalid item type');
          return;
        }
        
        // Use the unified saveReview method
        try {
          if (itemType === "track" &&) {
            const reviewResponse = await reviewApi.saveReview(reviewData);
            console.log(existingReviewId ? 'Review updated:' : 'Review created:', reviewResponse);
          }
          // Mark as submitted to prevent duplicate submissions
          setHasSubmittedReview(true);
          
          // The backend now automatically handles album reviews when a track is reviewed
          
          // Close the modal
          onClose();
          
          // Trigger the callback if provided
          if (onAlbumReviewSaved) {
            onAlbumReviewSaved();
          }
        } catch (error: any) {
          console.error('Error saving review:', error);
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
          }
          setError(`Failed to save review: ${error.response?.data?.error || error.message || 'Unknown error'}`);
        }
      } catch (e: any) {
        console.error('Error in submitReview function:', e);
        setError(`An error occurred: ${e.message || 'Unknown error'}`);
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <>
      {children}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-0 text-primary border-none">
          <div className="flex flex-col items-center gap-4 overflow-x-hidden m-5">
          <DialogTitle className="text-center text-2xl font-bold">Tell us what you think</DialogTitle>
            {/** This is the review section */}
            <MusicItem item={item} itemType={itemType} />
            <div className="w-full space-y-2">
              <Textarea 
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write your review here..."
                maxLength={maxLength}
                className="resize-none"
              />
              <div className="text-sm text-muted-foreground text-right">
                {review.length}/{maxLength} characters
              </div>
            </div>
            {/** This is the rating section */}
            <div className="flex flex-row justify-between w-full">
              <Button variant="secondary" className="bg-red-500" onClick={() => onOpinionSelected("DISLIKE")} >Didn't like it</Button>
              <Button variant="secondary" className="bg-yellow-600" onClick={() => onOpinionSelected("NEUTRAL")} >It was okay</Button>
              <Button variant="secondary" className="bg-green-500" onClick={() => onOpinionSelected("LIKED")}  >I loved it</Button>
            </div>
            {/** This is the comparison section */}
            {isComparing && <div className="flex flex-col justify-between w-50% align-items-center gap-4 pt-4">
              <div className="text-lg font-bold text-center">Which of these do you like more?</div>
              <div className="flex flex-row justify-between align-items-center w-full">
                <MusicItem item={item} itemType={itemType} />
                <div className="text-lg font-bold text-center text-align-center text-justify-center m-4">or</div>
                <MusicItem item={item} itemType={itemType} />
              </div>
              <div className="text-sm text-muted-foreground text-center">Finding the perfect score for your review</div>
              <Progress value={50} />
            </div>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RankingDialog; 