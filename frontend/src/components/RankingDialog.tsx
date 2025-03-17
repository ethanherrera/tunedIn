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

interface RankingDialogProps {
  children: React.ReactNode;
  item: Track | Album | Artist;
  items: (Track | Album | Artist)[];
  itemType: "track" | "album" | "artist";
  review: TrackReview | AlbumReview;
  reviews?: (TrackReview | AlbumReview)[];
  onOpenChange?: (open: boolean) => void;
}

interface ReviewData {
  id?: string;
  spotifyTrackId?: string;
  spotifyAlbumId?: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  ranking: number;
}

const RankingDialog: React.FC<RankingDialogProps> = ({item, items=[], itemType, review, reviews=[], onOpenChange}) => {
  const [reviewText, setReviewText] = useState("");
  const maxLength = 300;
  const [opinion, setOpinion] = useState<'DISLIKE' | 'NEUTRAL' | 'LIKED' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Binary search state
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonItem, setComparisonItem] = useState<Track | Album | Artist | null>(null);
  const [searchLow, setSearchLow] = useState(0);
  const [searchHigh, setSearchHigh] = useState(0);
  const [searchMid, setSearchMid] = useState(0);
  const [relevantItems, setRelevantItems] = useState<(Track | Album | Artist)[]>([]);
  const [relevantReviews, setRelevantReviews] = useState<(TrackReview | AlbumReview)[]>([]);
  const [previousComparisons, setPreviousComparisons] = useState<Set<string>>(new Set());
  
  // Get the query client for cache invalidation
  const queryClient = useQueryClient();

  // Create a mutation for saving reviews
  const saveReviewMutation = useMutation({
    mutationFn: (reviewData: ReviewData) => {
      if (itemType === "track") {
        return reviewApi.saveTrackReview({
          ...reviewData,
          spotifyTrackId: reviewData.spotifyTrackId!
        });
      } else {
        // TODO: Add support for album and artist reviews
        throw new Error(`Unsupported item type: ${itemType}`);
      }
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['userReviews'] });
      queryClient.invalidateQueries({ queryKey: ['trackReviews'] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      
      // Update UI state
      setIsSubmitted(true);
      setIsSubmitting(false);
      setShowComparison(false);
      
      // Show success toast notification
      toast.success("Review submitted successfully!", {
        description: `Your ${itemType} review has been saved.`,
        duration: 3000,
      });

      // Close the dialog after a short delay
      if (onOpenChange) {
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      }
    },
    onError: (error) => {
      console.error('Failed to save review:', error);
      setIsSubmitting(false);
      setShowComparison(false);
      
      // Show error toast notification
      toast.error("Failed to submit review", {
        description: "Please try again later.",
        duration: 5000,
      });
    }
  });

  // Progress animation effect
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (isSubmitting) {
      setProgress(0);
      
      progressInterval = setInterval(() => {
        setProgress(prevProgress => {
          // Increase progress by random amount between 15-25% for faster animation
          const increment = Math.random() * 10 + 30;
          const newProgress = prevProgress + increment;
          
          // Cap at 95% - the final jump to 100% happens when submission completes
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 100); // Update every 100ms instead of 200ms for faster animation
    } else if (isSubmitted) {
      setProgress(100);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isSubmitting, isSubmitted]);

  // Update the parent component when the dialog is closed after submission
  useEffect(() => {
    if (isSubmitted && onOpenChange) {
      // Give some time for the user to see the success message
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, onOpenChange]);

  // Helper function to get the ID from an item based on its type
  const getItemId = useCallback((item: Track | Album | Artist): string => {
    if (itemType === "track") {
      return (item as Track).id;
    } else if (itemType === "album") {
      return (item as Album).id;
    } else {
      return (item as Artist).id;
    }
  }, [itemType]);

  // Helper function to find an item by its ID
  const findItemById = useCallback((id: string): Track | Album | Artist | undefined => {
    return items.find(i => getItemId(i) === id);
  }, [items, getItemId]);

  // Helper function to get the ID from a review based on its type
  const getReviewItemId = useCallback((review: TrackReview | AlbumReview): string => {
    // For now, only handle track reviews
    if ('spotifyTrackId' in review) {
      return (review as TrackReview).spotifyTrackId;
    }
    // TODO: Add support for album and artist reviews
    return '';
  }, []);

  // Calculate default ranking for first item in a category
  const calculateDefaultRanking = useCallback((selectedOpinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED'): number => {
    console.log('Calculating default ranking for opinion:', selectedOpinion);
    
    // Filter reviews by opinion category
    const likedReviews = reviews.filter(r => r.opinion === 'LIKED').sort((a, b) => a.ranking - b.ranking);
    const neutralReviews = reviews.filter(r => r.opinion === 'NEUTRAL').sort((a, b) => a.ranking - b.ranking);
    const dislikedReviews = reviews.filter(r => r.opinion === 'DISLIKE').sort((a, b) => a.ranking - b.ranking);
    
    console.log('Review counts by category:', {
      liked: likedReviews.length,
      neutral: neutralReviews.length,
      disliked: dislikedReviews.length
    });
    
    if (likedReviews.length > 0) {
      console.log('Lowest liked ranking:', likedReviews[0].ranking);
    }
    
    if (neutralReviews.length > 0) {
      console.log('Lowest neutral ranking:', neutralReviews[0].ranking);
    }
    
    // Case 1: First review ever
    if (reviews.length === 0) {
      console.log('First review ever, using base ranking of 1000000');
      return 1000000;
    }
    
    // Determine default ranking based on selected opinion
    if (selectedOpinion === 'LIKED') {
      // First liked review - place at the top of liked category
      console.log('First liked review, using base ranking of 1000000');
      return 1000000;
    } else if (selectedOpinion === 'NEUTRAL') {
      // First neutral review - place after the lowest liked review
      const lowestLikedRanking = likedReviews.length > 0 
        ? likedReviews[0].ranking 
        : 0;
      const ranking = lowestLikedRanking + 1000000;
      console.log('First neutral review, using ranking of:', ranking);
      return ranking;
    } else { // DISLIKE
      // First disliked review - place after the lowest neutral review
      const lowestNeutralRanking = neutralReviews.length > 0 
        ? neutralReviews[0].ranking 
        : likedReviews.length > 0 ? likedReviews[0].ranking : 0;
      const ranking = lowestNeutralRanking + 1000000;
      console.log('First disliked review, using ranking of:', ranking);
      return ranking;
    }
  }, [reviews]);

  // Submit the final review with calculated ranking
  const submitFinalReview = useCallback((selectedOpinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED', ranking: number) => {
    setIsSubmitting(true);
    const itemId = getItemId(item);
    
    const reviewData: ReviewData = {
      opinion: selectedOpinion,
      description: reviewText,
      ranking: ranking,
    };
    
    // Set the appropriate ID field based on item type
    if (itemType === "track") {
      reviewData.spotifyTrackId = itemId;
    } else {
      // TODO: Add support for album and artist reviews
      console.warn(`Unsupported item type: ${itemType}`);
      return;
    }
    
    console.log("Submitting review data:", reviewData);
    saveReviewMutation.mutate(reviewData);
  }, [getItemId, item, itemType, reviewText, saveReviewMutation]);

  // Finalize ranking without comparison (for first item in a category)
  const finalizeRanking = useCallback((selectedOpinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    const ranking = calculateDefaultRanking(selectedOpinion);
    submitFinalReview(selectedOpinion, ranking);
  }, [calculateDefaultRanking, submitFinalReview]);

  // Calculate final ranking based on binary search position
  const finalizeRankingWithPosition = useCallback((selectedOpinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED', position: number) => {
    console.log('Finalizing ranking with position:', position);
    console.log('Relevant items:', relevantItems);
    console.log('Relevant reviews:', relevantReviews);
    
    let finalRanking: number;
    
    // If there are no items in the category
    if (relevantItems.length === 0) {
      console.log('No relevant items, using default ranking');
      finalRanking = calculateDefaultRanking(selectedOpinion);
    } 
    // If inserting at the beginning
    else if (position === 0) {
      console.log('Inserting at beginning');
      finalRanking = relevantReviews[0].ranking / 2;
    } 
    // If inserting at the end
    else if (position >= relevantItems.length) {
      console.log('Inserting at end');
      finalRanking = relevantReviews[relevantReviews.length - 1].ranking + 1000000;
    } 
    // If inserting in the middle
    else {
      console.log('Inserting in middle between positions', position - 1, 'and', position);
      finalRanking = (relevantReviews[position - 1].ranking + relevantReviews[position].ranking) / 2;
    }
    
    console.log('Final calculated ranking:', finalRanking);
    submitFinalReview(selectedOpinion, finalRanking);
  }, [relevantItems, relevantReviews, calculateDefaultRanking, submitFinalReview]);

  // Update comparison item when searchMid changes
  useEffect(() => {
    if (!showComparison || relevantItems.length === 0) return;
    
    // If there's only one item to compare against, make the comparison once and then finalize
    if (relevantItems.length === 1) {
      setComparisonItem(relevantItems[0]);
      return;
    }
    
    if (searchMid >= 0 && searchMid < relevantItems.length) {
      const newComparisonItem = relevantItems[searchMid];
      console.log('Setting comparison item to:', newComparisonItem);
      setComparisonItem(newComparisonItem);
    }
  }, [searchMid, relevantItems, showComparison]);

  // Handle user's comparison choice
  const handleComparisonChoice = useCallback((preferCurrent: boolean) => {
    if (!opinion) return;
    
    console.log('Handling comparison choice:', preferCurrent ? 'Prefer current item' : 'Prefer comparison item');
    console.log('Current search state:', { low: searchLow, high: searchHigh, mid: searchMid });
    
    // If binary search is complete, finalize ranking
    if (searchHigh <= searchLow + 1) {
      let finalPosition;
      
      // Determine the final position based on the user's preference
      if (preferCurrent) {
        // If user prefers current item over the comparison item at searchLow,
        // place it before the comparison item
        finalPosition = searchLow;
      } else {
        // If user prefers comparison item over current item,
        // place current item after the comparison item
        finalPosition = searchHigh;
      }
      
      console.log('Binary search complete, finalizing with position:', finalPosition);
      finalizeRankingWithPosition(opinion, finalPosition);
      return;
    }
    
    // Update binary search bounds based on user's choice
    let newLow = searchLow;
    let newHigh = searchHigh;
    
    if (preferCurrent) {
      // User prefers current item over comparison item at mid
      // So current item should be placed before the comparison item
      newHigh = searchMid;
    } else {
      // User prefers comparison item over current item
      // So current item should be placed after the comparison item
      newLow = searchMid;
    }
    
    console.log('New search bounds:', { newLow, newHigh });
    
    // Calculate new midpoint for next comparison
    let newMid = Math.floor((newLow + newHigh) / 2);
    console.log('New midpoint:', newMid);
    
    // Check if the new midpoint would be the same as the current one
    if (newMid === searchMid) {
      // If we're stuck at the same midpoint, force progress
      if (preferCurrent) {
        // If user prefers current item, move midpoint down
        newMid = Math.max(newLow, searchMid - 1);
      } else {
        // If user prefers comparison item, move midpoint up
        newMid = Math.min(newHigh - 1, searchMid + 1);
      }
      console.log('Adjusted midpoint to avoid duplicate comparison:', newMid);
    }
    
    // Ensure the midpoint is within valid bounds
    if (newMid < 0) newMid = 0;
    if (newMid >= relevantItems.length) newMid = relevantItems.length - 1;
    
    // Check if we've narrowed down to the final comparison
    if (newHigh - newLow <= 1) {
      console.log('Narrowed down to final comparison, finalizing with position:', preferCurrent ? newLow : newHigh);
      finalizeRankingWithPosition(opinion, preferCurrent ? newLow : newHigh);
      return;
    }
    
    // Update state in a specific order to ensure proper rendering
    setSearchLow(newLow);
    setSearchHigh(newHigh);
    setSearchMid(newMid);
    
  }, [opinion, searchHigh, searchLow, searchMid, finalizeRankingWithPosition, relevantItems.length]);

  // Initialize binary search comparison based on selected opinion
  const initializeComparison = useCallback((selectedOpinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    console.log('Initializing comparison for opinion:', selectedOpinion);
    console.log('Current reviews:', reviews);
    console.log('Current item being reviewed:', item);
    console.log('Is this the first review?', reviews.length === 0);
    
    // Reset previous comparisons
    setPreviousComparisons(new Set());
    
    // Filter reviews by opinion category and sort by ranking (lowest to highest)
    const likedReviews = reviews.filter(r => r.opinion === 'LIKED').sort((a, b) => a.ranking - b.ranking);
    const neutralReviews = reviews.filter(r => r.opinion === 'NEUTRAL').sort((a, b) => a.ranking - b.ranking);
    const dislikedReviews = reviews.filter(r => r.opinion === 'DISLIKE').sort((a, b) => a.ranking - b.ranking);
    
    console.log('Filtered reviews by opinion:', {
      liked: likedReviews.length,
      neutral: neutralReviews.length,
      disliked: dislikedReviews.length
    });
    
    // Check if this is the first item in this opinion category
    const isFirstInCategory = (
      (selectedOpinion === 'LIKED' && likedReviews.length === 0) ||
      (selectedOpinion === 'NEUTRAL' && neutralReviews.length === 0) ||
      (selectedOpinion === 'DISLIKE' && dislikedReviews.length === 0)
    );
    
    console.log('Is this the first item in this opinion category?', isFirstInCategory);
    
    // If this is the first item ever or first in category, skip comparison
    if (reviews.length === 0 || isFirstInCategory) {
      console.log('This is the first item ever or first in category, skipping comparison');
      finalizeRanking(selectedOpinion);
      return;
    }
    
    let relevantReviewsForOpinion: (TrackReview | AlbumReview)[] = [];
    
    // Determine which bucket to use based on selected opinion
    if (selectedOpinion === 'LIKED') {
      relevantReviewsForOpinion = likedReviews;
    } else if (selectedOpinion === 'NEUTRAL') {
      relevantReviewsForOpinion = neutralReviews;
    } else { // DISLIKE
      relevantReviewsForOpinion = dislikedReviews;
    }
    
    console.log('Relevant reviews for selected opinion:', relevantReviewsForOpinion.length);
    setRelevantReviews(relevantReviewsForOpinion);
    
    // If there are no reviews in this category, no need for comparison
    if (relevantReviewsForOpinion.length === 0) {
      console.log('No reviews in this category, finalizing ranking without comparison');
      finalizeRanking(selectedOpinion);
      return;
    }
    
    // Find the corresponding items for these reviews
    const relevantItemsForOpinion = relevantReviewsForOpinion
      .map(review => {
        const id = getReviewItemId(review);
        const foundItem = findItemById(id);
        console.log(`Looking for item with ID ${id}:`, foundItem ? 'Found' : 'Not found');
        return foundItem;
      })
      .filter(item => item !== undefined) as (Track | Album | Artist)[];
    
    console.log('Relevant items for comparison:', relevantItemsForOpinion);
    
    // If no items found, finalize ranking
    if (relevantItemsForOpinion.length === 0) {
      console.log('No items found for comparison, finalizing ranking without comparison');
      finalizeRanking(selectedOpinion);
      return;
    }
    
    setRelevantItems(relevantItemsForOpinion);
    
    // Special case: If there's only one item to compare against, just show that comparison
    if (relevantItemsForOpinion.length === 1) {
      console.log('Only one item to compare against, showing direct comparison');
      setSearchLow(0);
      setSearchHigh(1); // Set high to 1 to indicate we're comparing with the 0th item
      setSearchMid(0);
      setComparisonItem(relevantItemsForOpinion[0]);
      setShowComparison(true);
      return;
    }
    
    // Initialize binary search
    // Start with the full range of items
    const low = 0;
    const high = relevantItemsForOpinion.length;  // Use length instead of length-1 to allow placement at the end
    
    // Start with the middle item for the first comparison
    let mid = Math.floor((low + high) / 2);
    
    // Ensure the midpoint is within valid bounds
    if (mid >= relevantItemsForOpinion.length) {
      mid = relevantItemsForOpinion.length - 1;
    }
    
    console.log('Binary search initial values:', { low, high, mid });
    
    setSearchLow(low);
    setSearchHigh(high);
    setSearchMid(mid);
    
    // Set the first comparison item
    console.log('Setting first comparison item:', relevantItemsForOpinion[mid]);
    setComparisonItem(relevantItemsForOpinion[mid]);
    
    setShowComparison(true);
  }, [reviews, finalizeRanking, findItemById, getReviewItemId]);

  const onOpinionSelected = useCallback((newOpinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    setOpinion(newOpinion);
    initializeComparison(newOpinion);
  }, [initializeComparison]);

  return (
    <>
      <Dialog defaultOpen={true} onOpenChange={(open) => onOpenChange && onOpenChange(open)}>
        <DialogContent className="p-0 text-primary border-none">
          <div className="flex flex-col items-center gap-4 overflow-x-hidden m-5">
            <DialogTitle className="text-center text-2xl font-bold">
              {showComparison ? "Compare Items" : "Tell us what you think"}
            </DialogTitle>
            
            {!showComparison && (
              <>
                {/** This is the review section */}
                <MusicCardUI item={item} itemType={itemType} />
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
              </>
            )}
            
            {/** Comparison section */}
            {showComparison && comparisonItem && (
              <div className="w-full flex flex-col items-center gap-4">
                <p className="text-center">Which do you prefer?</p>
                <div className="flex flex-row justify-between w-full gap-4">
                  <div className="flex-1 border rounded-lg p-4 flex flex-col items-center">
                    <MusicCardUI item={item} itemType={itemType} />
                    <Button 
                      className="mt-4 w-full" 
                      onClick={() => handleComparisonChoice(true)}
                    >
                      Prefer This
                    </Button>
                  </div>
                  <div className="flex-1 border rounded-lg p-4 flex flex-col items-center">
                    <MusicCardUI item={comparisonItem} itemType={itemType} />
                    <Button 
                      className="mt-4 w-full" 
                      onClick={() => handleComparisonChoice(false)}
                    >
                      Prefer This
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {searchHigh - searchLow <= 1 ? "Final comparison" : `Comparison ${Math.log2(relevantItems.length) - Math.log2(searchHigh - searchLow)}`}
                </p>
              </div>
            )}
            
            {/** Submission status message */}
            {isSubmitting && (
              <div className="text-center text-primary w-full">
                <p>Submitting your review...</p>
                <Progress value={progress} className="mt-2" />
              </div>
            )}
            
            {isSubmitted && (
              <div className="w-full">
                <Progress value={progress} className="mt-2 bg-green-100" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RankingDialog; 