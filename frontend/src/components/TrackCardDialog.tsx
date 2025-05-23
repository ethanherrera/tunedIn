import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "./ui/dialog.tsx";
import { Button } from "./ui/button.tsx";
import { Track, TrackReview } from "@/api/apiClient.ts";
import TrackCardUI from "./TrackCardUI.tsx";
import TrackRankingDialog from "./TrackRankingDialog.tsx";
import { Star, Edit } from "lucide-react";

interface TrackCardDialogProps {
  children: React.ReactNode;
  item: Track;
  items?: Track[];
  review?: TrackReview;
  onOpenChange?: (open: boolean) => void;
}

const TrackCardDialog: React.FC<TrackCardDialogProps> = ({
  item,
  items = [],
  review,
  onOpenChange
}) => {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "No date available";
    try {
      return new Date(timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Invalid date";
    }
  };

  const getOpinionColor = (opinion?: string) => {
    switch (opinion) {
      case 'LIKED': return 'text-green-500';
      case 'DISLIKE': return 'text-red-500';
      case 'NEUTRAL': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getOpinionText = (opinion?: string) => {
    switch (opinion) {
      case 'LIKED': return 'Liked';
      case 'DISLIKE': return 'Disliked';
      case 'NEUTRAL': return 'Neutral';
      default: return 'Not rated';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="p-0 text-primary border-none max-w-md">
          <div className="flex flex-col items-center gap-6 overflow-x-hidden m-6">
            <DialogTitle className="text-center text-2xl font-bold">
              Track Details
            </DialogTitle>
            
            {/* Track Card UI */}
            <TrackCardUI item={item} />
            
            {/* Review Information */}
            <div className="w-full space-y-4">
              {review ? (
                <>
                  {/* Review Score */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className={`w-5 h-5 fill-yellow-400 text-yellow-400`} />
                      <span className="font-semibold">Rating:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${getOpinionColor(review.opinion)}`}>
                        {review.rating ? review.rating.toFixed(1) : 'N/A'}/10
                      </span>
                      <span className={`text-sm ${getOpinionColor(review.opinion)}`}>
                        ({getOpinionText(review.opinion)})
                      </span>
                    </div>
                  </div>

                  {/* Review Description */}
                  {review.description && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Review Description:</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.description}
                      </p>
                    </div>
                  )}

                  {/* Review Date */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Last Reviewed:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(review.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Edit Review Button */}
                  <Button 
                    onClick={() => setShowReviewDialog(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Review
                  </Button>
                </>
              ) : (
                <>
                  {/* No Review State */}
                  <div className="p-6 bg-muted/30 rounded-lg text-center">
                    <p className="text-muted-foreground mb-4">
                      You haven't reviewed this track yet.
                    </p>
                    <Button 
                      onClick={() => setShowReviewDialog(true)}
                      className="w-full"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Write a Review
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      {showReviewDialog && (
        <TrackRankingDialog
          item={item}
          items={items}
          review={review}
          onOpenChange={(open) => setShowReviewDialog(open)}
        >
          <></>
        </TrackRankingDialog>
      )}
    </>
  );
};

export default TrackCardDialog;
