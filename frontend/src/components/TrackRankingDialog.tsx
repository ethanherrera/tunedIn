import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
} from "./ui/dialog.tsx";
import { Button } from "./ui/button.tsx";
import { Textarea } from "./ui/textarea.tsx";
import { DialogTitle } from "./ui/dialog.tsx";
import { Progress } from "./ui/progress.tsx";
import { Album, Artist, reviewApi, Track, TrackReview, AlbumReview, userApi } from "@/api/apiClient.ts";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import MusicCardUI from "./MusicCardUI.tsx";
import TrackCardUI from "./TrackCardUI.tsx";

interface TrackRankingDialogProps {
  children: React.ReactNode;
  item: Track;
  items: Track[];
  review?: TrackReview;
  reviews?: TrackReview[];
  onOpenChange?: (open: boolean) => void;
}

const TrackRankingDialog: React.FC<TrackRankingDialogProps> = ({item, items=[], review, reviews=[], onOpenChange}) => {
  const [reviewText, setReviewText] = useState("");
  const maxLength = 300;
  const [opinion, setOpinion] = useState<'DISLIKE' | 'NEUTRAL' | 'LIKED' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch current user profile to get user ID
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
  });

  useEffect(() => {
    if (isSubmitted && onOpenChange) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, onOpenChange]);

  // Generate random rating based on opinion
  const generateRandomRating = (selectedOpinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    let min = 0;
    let max = 0;
    
    switch (selectedOpinion) {
      case 'LIKED':
        min = 7.0;
        max = 10.0;
        break;
      case 'NEUTRAL':
        min = 4.0;
        max = 6.9;
        break;
      case 'DISLIKE':
        min = 0.0;
        max = 3.9;
        break;
    }
    
    // Generate random number with one decimal place
    return Math.round((min + Math.random() * (max - min)) * 10) / 10;
  };

  // React Query mutation for saving the review
  const saveMutation = useMutation({
    mutationFn: (reviewData: any) => {
      // The backend expects a TrackReview object with a userId
      return reviewApi.saveTrackReview({
        ...reviewData,
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success("Review saved successfully!");
      queryClient.invalidateQueries({ queryKey: ['trackReviews'] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error) => {
      console.error("Error saving review:", error);
      toast.error("Failed to save review");
      setIsSubmitting(false);
    }
  });

  const onOpinionSelected = (newOpinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    if (!userProfile || !userProfile.id) {
      toast.error("Unable to save review: User profile not loaded");
      return;
    }
    
    setOpinion(newOpinion);
    const newRating = generateRandomRating(newOpinion);
    setIsSubmitting(true);
    
    // Save the review with React Query
    saveMutation.mutate({
      trackId: item.id,
      userId: userProfile.id,
      opinion: newOpinion,
      description: reviewText,
      rating: newRating,
      ranking: newRating,
    });
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
                <div className="flex flex-row justify-between w-full">
                  <Button 
                    variant="secondary" 
                    className="bg-red-500" 
                    onClick={() => onOpinionSelected("DISLIKE")}
                    disabled={isSubmitting || isSubmitted}
                  >
                    Not a fan
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="bg-yellow-600" 
                    onClick={() => onOpinionSelected("NEUTRAL")}
                    disabled={isSubmitting || isSubmitted}
                  >
                    Okay.
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="bg-green-500" 
                    onClick={() => onOpinionSelected("LIKED")}
                    disabled={isSubmitting || isSubmitted}
                  >
                    Great!
                  </Button>
              </div>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrackRankingDialog; 