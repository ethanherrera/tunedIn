import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "./ui/dialog.tsx";
import { Button } from "./ui/button.tsx";
import { Textarea } from "./ui/textarea.tsx";
import { DialogTitle } from "./ui/dialog.tsx";
import { Track, TrackReview } from "@/api/apiClient.ts";
import { toast } from "sonner";
import { useUserProfile, useTrackReviewMutation, useTrackReviews } from "@/hooks/queryHooks";
import TrackCardUI from "./TrackCardUI.tsx";
import { Star } from "lucide-react";

interface TrackRankingDialogProps {
  children: React.ReactNode;
  item: Track;
  items: Track[];
  review?: TrackReview;
  reviews?: TrackReview[];
  onOpenChange?: (open: boolean) => void;
}

const TrackRankingDialog: React.FC<TrackRankingDialogProps> = ({item, items=[], review, onOpenChange}) => {
  const [reviewText, setReviewText] = useState("");
  const maxLength = 300;
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch current user profile to get user ID
  const { data: userProfile } = useUserProfile();

  useEffect(() => {
    if (isSubmitted && onOpenChange) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, onOpenChange]);

  // Determine opinion based on rating
  const getOpinionFromRating = (ratingValue: number): 'DISLIKE' | 'NEUTRAL' | 'LIKED' => {
    if (ratingValue >= 7.0) return 'LIKED';
    if (ratingValue >= 4.0) return 'NEUTRAL';
    return 'DISLIKE';
  };

  // Use the track review mutation hook
  const saveMutation = useTrackReviewMutation();

  const onRatingSelected = (selectedRating: number) => {
    if (!userProfile || !userProfile.id) {
      toast.error("Unable to save review: User profile not loaded");
      return;
    }
    
    setRating(selectedRating);
    const opinion = getOpinionFromRating(selectedRating);
    setIsSubmitting(true);
    
    saveMutation.mutate({
      trackId: item.id,
      userId: userProfile.id,
      opinion: opinion,
      description: reviewText,
      rating: selectedRating,
      ranking: selectedRating,
    }, {
      onSuccess: () => {
        setIsSubmitted(true);
        setIsSubmitting(false);
      },
      onError: () => {
        setIsSubmitting(false);
      }
    });
  };

  // Handle star rating interactions
  const handleStarClick = (starIndex: number, isHalf: boolean = false) => {
    if (isSubmitting || isSubmitted) return;
    const newRating = starIndex + (isHalf ? 0.5 : 1);
    onRatingSelected(newRating);
  };

  const handleStarHover = (starIndex: number, isHalf: boolean = false) => {
    if (isSubmitting || isSubmitted) return;
    const newHoverRating = starIndex + (isHalf ? 0.5 : 1);
    setHoverRating(newHoverRating);
  };

  const handleStarLeave = () => {
    if (isSubmitting || isSubmitted) return;
    // Keep the last hovered value instead of resetting to 0
    // This maintains the visual state when mouse leaves the star area
  };

  // Star rating component
  const StarRating = () => {
    const stars = [];
    const displayRating = hoverRating || rating;

    for (let i = 0; i < 10; i++) {
      const starValue = i + 1;
      const isFullyFilled = displayRating >= starValue;
      const isHalfFilled = displayRating >= starValue - 0.5 && displayRating < starValue;

      stars.push(
        <div key={i} className="relative cursor-pointer group">
          {/* Background star (empty) */}
          <Star className="w-8 h-8 text-gray-300 absolute" />
          
          {/* Filled star */}
          {isFullyFilled && (
            <Star className="w-8 h-8 fill-yellow-400 text-yellow-400 absolute" />
          )}
          
          {/* Half filled star */}
          {isHalfFilled && (
            <div className="absolute overflow-hidden w-4 h-8">
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
            </div>
          )}
          
          {/* Invisible clickable areas */}
          <div className="flex w-8 h-8 relative z-10">
            {/* Left half for half star */}
            <div
              className="w-4 h-8 cursor-pointer"
              onMouseEnter={() => handleStarHover(i, true)}
              onMouseLeave={handleStarLeave}
              onClick={() => handleStarClick(i, true)}
            />
            {/* Right half for full star */}
            <div
              className="w-4 h-8 cursor-pointer"
              onMouseEnter={() => handleStarHover(i, false)}
              onMouseLeave={handleStarLeave}
              onClick={() => handleStarClick(i, false)}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full">
        {/* Stars container - centered and fixed position */}
        <div className="flex items-center justify-center gap-1">
          {stars}
        </div>
        {/* Text container - fixed position below stars */}
        <div className="flex justify-center mt-2">
          <span className="text-sm text-muted-foreground">
            {displayRating > 0 ? `${displayRating}/10` : 'Rate this track'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog defaultOpen={true} onOpenChange={(open) => onOpenChange && onOpenChange(open)}>
        <DialogContent className="p-0 text-primary border-none">
          <div className="flex flex-col items-center gap-4 overflow-x-hidden m-5">
            <DialogTitle className="text-center text-2xl font-bold">
              Tell us what you think
            </DialogTitle>
            
                <TrackCardUI item={item}></TrackCardUI>
                <div className="w-full space-y-2">
                  <Textarea 
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write your review here..."
                    maxLength={maxLength}
                    className="resize-none"
                    disabled={isSubmitting || isSubmitted}
                  />
                  <div className="text-sm text-muted-foreground text-right">
                    {reviewText.length}/{maxLength} characters
                  </div>
                </div>
                {/** This is the rating section */}
                <div className="flex flex-col items-center w-full gap-4">
                  <StarRating />
                  {isSubmitted && (
                    <div className="text-green-500 text-center">
                      Thank you for your rating!
                    </div>
                  )}
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrackRankingDialog;