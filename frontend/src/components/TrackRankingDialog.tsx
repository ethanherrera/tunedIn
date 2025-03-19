import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
} from "./ui/dialog.tsx";
import { Button } from "./ui/button.tsx";
import { Textarea } from "./ui/textarea.tsx";
import { DialogTitle } from "./ui/dialog.tsx";
import { Progress } from "./ui/progress.tsx";
import { Album, Artist, reviewApi, Track, TrackReview, AlbumReview } from "@/api/apiClient.ts";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

  useEffect(() => {
    if (isSubmitted && onOpenChange) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, onOpenChange]);

  const onOpinionSelected = (newOpinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    setOpinion(newOpinion);
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