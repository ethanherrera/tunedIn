import React, { useState, useEffect } from "react";
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
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  ranking: number;
}

// Interface for cached comparison data
interface CachedComparisonData {
  items: (Track | Album)[];
  reviews: (TrackReview | AlbumReview)[];
  noItemsAvailable: boolean;
  finalRanking: number | null;
}

const RankingDialog: React.FC<RankingDialogProps> = ({item, items=[], itemType, review, reviews=[], onOpenChange}) => {
  const [reviewText, setReviewText] = useState("");
  const maxLength = 300;
  const [isComparing, setIsComparing] = useState(false);
  const [opinion, setOpinion] = useState<'DISLIKE' | 'NEUTRAL' | 'LIKED' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Comparison specific states
  const [finalRanking, setFinalRanking] = useState<number | null>(null);
  const [comparisonDataReady, setComparisonDataReady] = useState(false);
  
  // Comparison states
  const [reviewedItems, setReviewedItems] = useState<(Track | Album)[]>([]);
  const [reviewsMap, setReviewsMap] = useState<Map<string, TrackReview | AlbumReview>>(new Map());
  const [currentComparisonItem, setCurrentComparisonItem] = useState<Track | Album | null>(null);
  const [low, setLow] = useState<number>(0);
  const [high, setHigh] = useState<number>(0);
  const [mid, setMid] = useState<number>(0);
  const [noItemsAvailable, setNoItemsAvailable] = useState(false);
  const [loadingComparisons, setLoadingComparisons] = useState(false);
  
  // Prefetched comparison data cache
  const [prefetchedData, setPrefetchedData] = useState<Record<'DISLIKE' | 'NEUTRAL' | 'LIKED', CachedComparisonData | null>>({
    'DISLIKE': null,
    'NEUTRAL': null,
    'LIKED': null
  });
  const [isPrefetching, setIsPrefetching] = useState(false);

  // Get the query client for cache invalidation
  const queryClient = useQueryClient();

  // Create a mutation for saving reviews
  const saveReviewMutation = useMutation({
    mutationFn: (reviewData: ReviewData) => reviewApi.saveTrackReview(reviewData),
    onSuccess: (data) => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['userReviews'] });
      queryClient.invalidateQueries({ queryKey: ['trackReviews'] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      
      // Update UI state
      setIsSubmitted(true);
      setIsSubmitting(false);
      
      // Show success toast notification
      toast.success("Review submitted successfully!", {
        description: `Your ${itemType} review has been saved.`,
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Failed to save review:', error);
      setIsSubmitting(false);
      
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

  // Update mid point when low or high changes (binary search)
  useEffect(() => {
    if (reviewedItems.length > 0) {
      const newMid = Math.floor((low + high) / 2);
      setMid(newMid);
      
      // Set the current comparison item to the item at the mid point
      if (newMid >= 0 && newMid < reviewedItems.length) {
        setCurrentComparisonItem(reviewedItems[newMid]);
        
        // Log the current state of the binary search
        const midItemId = getItemId(reviewedItems[newMid]);
        const midReview = reviewsMap.get(midItemId);
        
        console.log(`Binary Search State: low=${low}, high=${high}, mid=${newMid}`);
        if (midReview) {
          console.log(`Comparing with item at mid=${newMid}, ranking=${midReview.ranking}, opinion=${midReview.opinion}`);
        }
        
        // Log the rankings of items at low and high if they exist
        if (low >= 0 && low < reviewedItems.length) {
          const lowItemId = getItemId(reviewedItems[low]);
          const lowReview = reviewsMap.get(lowItemId);
          if (lowReview) {
            console.log(`Item at low=${low}, ranking=${lowReview.ranking}, opinion=${lowReview.opinion}`);
          }
        }
        
        if (high >= 0 && high < reviewedItems.length) {
          const highItemId = getItemId(reviewedItems[high]);
          const highReview = reviewsMap.get(highItemId);
          if (highReview) {
            console.log(`Item at high=${high}, ranking=${highReview.ranking}, opinion=${highReview.opinion}`);
          }
        }
      }
    }
  }, [low, high, reviewedItems, reviewsMap]);

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
  const getItemId = (item: Track | Album | Artist): string => {
    if (itemType === "track") {
      return (item as Track).id;
    } else if (itemType === "album") {
      return (item as Album).id;
    } else {
      return (item as Artist).id;
    }
  };

  // Helper function to get the ID from a review
  const getReviewItemId = (review: TrackReview | AlbumReview): string => {
    if ('spotifyTrackId' in review) {
      return review.spotifyTrackId;
    } else if ('spotifyAlbumId' in review) {
      return review.spotifyAlbumId;
    }
    return '';
  };

  // Prepare comparison data for a specific opinion
  const prepareComparisonData = (opinionType: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    setLoadingComparisons(true);
    console.log(`Preparing comparison data for opinion: ${opinionType}`);
    
    try {
      // Filter reviews by opinion and item type
      const filteredReviews = reviews?.filter(r => {
        // Match by opinion
        if (r.opinion !== opinionType) return false;
        
        // Make sure we don't include the current item
        const currentItemId = getItemId(item);
        const reviewItemId = getReviewItemId(r);
        
        return reviewItemId !== currentItemId;
      }) || [];
      
      console.log(`Found ${filteredReviews.length} reviews with opinion ${opinionType}`);
      
      // If no reviews, mark as no items available
      if (filteredReviews.length === 0) {
        console.log(`No reviews found for opinion: ${opinionType}, setting ranking to 0`);
        setNoItemsAvailable(true);
        setFinalRanking(0);
        setComparisonDataReady(true);
        setLoadingComparisons(false);
        return;
      }
      
      // Create a map to store item data
      const itemsMap = new Map<string, Track | Album>();
      
      // Only include items of the correct type
      const typedItems = items.filter(i => {
        if (itemType === "track" && 'album' in i) return true;
        if (itemType === "album" && 'album_type' in i) return true;
        return false;
      }) as (Track | Album)[];
      
      console.log(`Found ${typedItems.length} items of type ${itemType}`);
      
      // Map items by their ID for easy lookup
      typedItems.forEach(i => {
        itemsMap.set(getItemId(i), i);
      });
      
      // Create arrays to hold items and their reviews
      const filteredItems: (Track | Album)[] = [];
      const reviewsMapTemp = new Map<string, TrackReview | AlbumReview>();
      
      // Map the reviews to items with details
      for (const r of filteredReviews) {
        const reviewItemId = getReviewItemId(r);
        const itemData = itemsMap.get(reviewItemId);
        
        if (itemData) {
          filteredItems.push(itemData);
          reviewsMapTemp.set(reviewItemId, r);
          console.log(`Added item ${reviewItemId} with ranking ${r.ranking} to filtered items`);
        }
      }
      
      if (filteredItems.length === 0) {
        // If no reviewed items after filtering, mark as no items available
        console.log("No items found after filtering, setting ranking to 0");
        setNoItemsAvailable(true);
        setFinalRanking(0);
        setComparisonDataReady(true);
        setLoadingComparisons(false);
        return;
      }
      
      // Sort items by their review rankings (lowest to highest)
      // This ensures that lower index = better ranking (1 is best)
      const sortedItems: (Track | Album)[] = [];
      const sortedReviews: (TrackReview | AlbumReview)[] = [];
      
      // Create pairs of [item, review] for sorting
      const itemReviewPairs = filteredItems.map((item, index) => {
        const itemId = getItemId(item);
        const review = reviewsMapTemp.get(itemId);
        return { item, review };
      }).filter(pair => pair.review !== undefined);
      
      console.log(`Created ${itemReviewPairs.length} item-review pairs for sorting`);
      
      // Sort by ranking (lowest to highest)
      itemReviewPairs.sort((a, b) => {
        if (!a.review || !b.review) return 0;
        return a.review.ranking - b.review.ranking;
      });
      
      // Log the sorted items and their rankings
      console.log("Sorted items by ranking:");
      itemReviewPairs.forEach((pair, index) => {
        if (pair.review) {
          console.log(`Item ${index}: ${getItemId(pair.item)}, Ranking: ${pair.review.ranking}, Opinion: ${pair.review.opinion}`);
        }
      });
      
      // Separate the sorted items and reviews
      itemReviewPairs.forEach(pair => {
        if (pair.item && pair.review) {
          sortedItems.push(pair.item);
          sortedReviews.push(pair.review);
        }
      });
      
      console.log(`Final sorted items count: ${sortedItems.length}`);
      
      // Store the sorted items and reviews map
      setReviewedItems(sortedItems);
      setReviewsMap(reviewsMapTemp);
      
      // If there's only one item, set the final ranking
      if (sortedItems.length === 1) {
        const itemId = getItemId(sortedItems[0]);
        const review = reviewsMapTemp.get(itemId);
        if (review) {
          console.log(`Only one item found with ranking ${review.ranking}, using as reference`);
          setFinalRanking(review.ranking);
        }
      }
      
      // Set up binary search with items
      if (sortedItems.length === 1) {
        console.log("Setting up binary search with single item");
        setLow(0);
        setHigh(0);
        setMid(0);
        setCurrentComparisonItem(sortedItems[0]);
      } else {
        // Initialize binary search pointers
        console.log(`Setting up binary search with ${sortedItems.length} items`);
        setLow(0);
        setHigh(sortedItems.length - 1);
        
        // Set initial mid point
        const initialMid = Math.floor((0 + (sortedItems.length - 1)) / 2);
        setMid(initialMid);
        
        // Set initial comparison item
        setCurrentComparisonItem(sortedItems[initialMid]);
        console.log(`Initial binary search state: low=0, high=${sortedItems.length - 1}, mid=${initialMid}`);
      }
      
      // Mark data as ready
      setComparisonDataReady(true);
      
    } catch (err) {
      console.error('Failed to prepare comparison data:', err);
      setNoItemsAvailable(true);
      setComparisonDataReady(false); // Make sure data ready is false on error
    } finally {
      // Always make sure to reset loading state
      setLoadingComparisons(false);
    }
  };

  const startComparison = (e: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    // Safety check - if no opinion is set, we can't start comparison
    if (!e) {
      return;
    }
    
    // Reset comparison-related states
    setNoItemsAvailable(false);
    setCurrentComparisonItem(null);
    setReviewedItems([]);
    setFinalRanking(null);
    setComparisonDataReady(false);
    
    // Set comparing to true to show the comparison UI
    setIsComparing(true);
    
    // Prepare items for comparison
    prepareComparisonData(e);
  };

  // Handle item selection for binary search
  const handleItemSelect = (isCurrentItemBetter: boolean) => {
    if (!currentComparisonItem) return;
    
    console.log(`User selected: current item is ${isCurrentItemBetter ? 'BETTER' : 'WORSE'} than comparison item`);
    
    // Special case for single item comparison
    if (reviewedItems.length === 1) {
      let newRanking: number;
      const itemId = getItemId(currentComparisonItem);
      const review = reviewsMap.get(itemId);
      
      if (!review) return;
      
      if (isCurrentItemBetter) {
        // User thinks current item is better than the only item
        // Use a ranking that's one less than the compared item to ensure it comes first in the sorted array
        newRanking = Math.max(1, review.ranking - 1);
        console.log(`Single item comparison: Current item is better than item with ranking ${review.ranking}, assigning ranking ${newRanking}`);
      } else {
        // User thinks the only item is better than current item
        // Use a ranking that's one more than the compared item to ensure it comes after in the sorted array
        newRanking = review.ranking + 1;
        console.log(`Single item comparison: Current item is worse than item with ranking ${review.ranking}, assigning ranking ${newRanking}`);
      }
      
      setFinalRanking(newRanking);
      submitReview(newRanking);
      return;
    }
    
    // If binary search is complete (low >= high - 1), we've found our insertion point
    if (low >= high - 1) {
      // Determine final ranking based on the last comparison
      let newRanking: number;
      
      // Get the reviews for the items at low and high positions
      const lowItemId = getItemId(reviewedItems[low]);
      const highItemId = getItemId(reviewedItems[high]);
      const lowReview = reviewsMap.get(lowItemId);
      const highReview = reviewsMap.get(highItemId);
      
      if (!lowReview || !highReview) return;
      
      console.log(`Binary search complete: low=${low} (ranking=${lowReview.ranking}), high=${high} (ranking=${highReview.ranking})`);
      
      if (isCurrentItemBetter) {
        // User thinks current item is better than the high item
        // If we're at the top of the list (low=0), use a ranking that's one less than the lowest item
        if (low === 0) {
          newRanking = Math.max(1, lowReview.ranking - 1);
          console.log(`Binary search complete: Current item is better than top items, assigning ranking ${newRanking}`);
        } else {
          // Otherwise, use a ranking between the low and high items
          // This ensures it will be sorted correctly
          const midRanking = Math.floor((lowReview.ranking + highReview.ranking) / 2);
          newRanking = midRanking;
          console.log(`Binary search complete: Current item is between low (${lowReview.ranking}) and high (${highReview.ranking}), assigning ranking ${newRanking}`);
        }
      } else {
        // User thinks high item is better than current item
        // Use a ranking that's one more than the high item to ensure it comes after in the sorted array
        newRanking = highReview.ranking + 1;
        console.log(`Binary search complete: Current item is worse than item at high (${high}) with ranking ${highReview.ranking}, assigning ranking ${newRanking}`);
      }
      
      console.log(`Final ranking determined: ${newRanking} (low=${low}, high=${high})`);
      setFinalRanking(newRanking);
      submitReview(newRanking);
      return;
    }
    
    // Update pointers based on selection
    if (isCurrentItemBetter) {
      // User thinks current item is better than mid item
      // Search in the lower half (better rankings)
      console.log(`Current item is better than mid item, updating high from ${high} to ${mid}`);
      setHigh(mid);
      
      // Special case: If we're comparing with the top item and user says their item is better
      if (mid === 0 && isCurrentItemBetter) {
        // Use a ranking that's one less than the top item to ensure it comes first in the sorted array
        const topItemId = getItemId(reviewedItems[0]);
        const topReview = reviewsMap.get(topItemId);
        
        if (topReview) {
          const newRanking = Math.max(1, topReview.ranking - 1);
          console.log(`User selected their item as better than the top ranked item, assigning ranking ${newRanking}`);
          setFinalRanking(newRanking);
          submitReview(newRanking);
          return;
        }
      }
    } else {
      // User thinks mid item is better than current item
      // Search in the upper half (worse rankings)
      console.log(`Current item is worse than mid item, updating low from ${low} to ${mid + 1}`);
      setLow(mid + 1);
    }
  };

  const submitReview = (ranking?: number) => {
    // Set submitting state to show loading indicator
    setIsSubmitting(true);
    
    if (opinion) {
      const itemId = getItemId(item);
      
      // Use ranking if provided, otherwise finalRanking if set, otherwise default to 1 (top position)
      const finalRank = ranking || finalRanking || 1;
      console.log(`Submitting review with opinion: ${opinion}, ranking: ${finalRank}, item ID: ${itemId}`);
      
      const reviewData: ReviewData = {
        spotifyTrackId: itemId, // This will need to be updated when album/artist reviews are implemented
        opinion: opinion,
        description: reviewText,
        ranking: finalRank,
      };
      
      // Use the mutation to save the review
      console.log("Submitting review data to API:", reviewData);
      saveReviewMutation.mutate(reviewData);
    }
  };

  const onOpinionSelected = (e: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    // If we have review text, submit the review regardless of opinion change
    if (reviewText.trim().length > 0) {
      setOpinion(e);
      // When submitting a review with text, use a very low ranking (0) to ensure it gets the highest score
      submitReview(0);
      return;
    }
    
    // For comparison flow (no review text)
    if (opinion === e) {
      // Same opinion clicked again - force restart comparison
      startComparison(e);
    } else {
      // New opinion selected - update state and start comparison
      setOpinion(e);
      // Start comparison immediately with the new opinion value
      startComparison(e);
    }
  }

  return (
    <>
      <Dialog defaultOpen={true} onOpenChange={(open) => onOpenChange && onOpenChange(open)}>
        <DialogContent className="p-0 text-primary border-none">
          <div className="flex flex-col items-center gap-4 overflow-x-hidden m-5">
          <DialogTitle className="text-center text-2xl font-bold">Tell us what you think</DialogTitle>
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
            
            {/** This is the comparison section */}
            {isComparing && !isSubmitting && !isSubmitted && (
              <div className="flex flex-col justify-between w-50% align-items-center gap-4 pt-4">
                {noItemsAvailable ? (
                  <div className="text-center w-full">
                    <p className="mb-2">This is your first review with this opinion!</p>
                    <p className="text-sm text-muted-foreground mb-4">We'll use it as a reference for future comparisons.</p>
                    <div className="hidden">
                      {(() => {
                        // Use setTimeout to avoid blocking the UI
                        console.log("No items available for comparison, setting ranking to 0");
                        setTimeout(() => {
                          setFinalRanking(0);
                          submitReview(0);
                        }, 1500);
                        return null;
                      })()}
                    </div>
                    <Progress value={100} className="mt-2" />
                  </div>
                ) : currentComparisonItem && !loadingComparisons && comparisonDataReady ? (
                  <>
                    <div className="text-lg font-bold text-center">Which of these do you like more?</div>
                    <div className="flex flex-row justify-between align-items-center w-full">
                      <div onClick={() => handleItemSelect(true)} style={{ cursor: 'pointer' }} className="hover:opacity-80 transition-opacity">
                        <MusicCardUI item={item} itemType={itemType} />
                      </div>
                      <div className="text-lg font-bold text-center text-align-center text-justify-center m-4">or</div>
                      <div onClick={() => handleItemSelect(false)} style={{ cursor: 'pointer' }} className="hover:opacity-80 transition-opacity">
                        <MusicCardUI
                          item={currentComparisonItem}
                          itemType={itemType}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground text-center">Finding the perfect score for your review</div>
                    <Progress 
                      value={Math.round(((high - low) === 0 ? 100 : (1 - (high - low) / (reviewedItems.length - 1)) * 100))} 
                    />
                  </>
                ) : null}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RankingDialog; 