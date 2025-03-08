import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { DialogTitle } from "../../../components/ui/dialog";
import { Progress } from "../../../components/ui/progress";
import MusicItem from "./MusicItem";
import { UITrack, UIAlbum, UIArtist } from "../../../types/spotify";
import { reviewApi, spotifyApi } from "@/api/apiClient";
import { toast } from "sonner";

interface RankingDialogProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  item: UITrack | UIAlbum | UIArtist;
  itemType: "track" | "album" | "artist";
  existingReviewId?: string;
  onAlbumReviewSaved?: () => void;
}

interface ReviewData {
  id?: string;
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  ranking: number;
}

interface ComparisonItem {
  albumImageUrl?: string;
  albumName?: string;
  artistName?: string;
  trackName?: string;
  artistImageUrl?: string;
  spotifyId: string;
  ranking?: number;
}

interface ReviewWithItem extends ComparisonItem {
  ranking: number;
  reviewId: string;
}

// Interface for cached comparison data
interface CachedComparisonData {
  items: ReviewWithItem[];
  noItemsAvailable: boolean;
  finalRanking: number | null;
}

const RankingDialog: React.FC<RankingDialogProps> = ({ children, isOpen, onClose, item, itemType, existingReviewId, onAlbumReviewSaved }) => {
  const [review, setReview] = useState("");
  const maxLength = 300;
  const [isComparing, setIsComparing] = useState(false);
  const [opinion, setOpinion] = useState<'DISLIKE' | 'NEUTRAL' | 'LIKED' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Comparison specific states
  const [existingReview, setExistingReview] = useState<ReviewData | null>(null);
  const [isLoadingExistingReview, setIsLoadingExistingReview] = useState(false);
  const [finalRanking, setFinalRanking] = useState<number | null>(null);
  const [comparisonDataReady, setComparisonDataReady] = useState(false);
  const [comparisonsComplete, setComparisonsComplete] = useState(false);
  
  // Comparison states
  const [reviewedItems, setReviewedItems] = useState<ReviewWithItem[]>([]);
  const [currentComparisonItem, setCurrentComparisonItem] = useState<ComparisonItem | null>(null);
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

  // Prefetch comparison data when the dialog opens
  useEffect(() => {
    if (isOpen && !isPrefetching) {
      prefetchComparisonData();
    }
  }, [isOpen]);

  // Fetch existing review data when the dialog opens with an existingReviewId
  useEffect(() => {
    const fetchExistingReview = async () => {
      if (!existingReviewId || !isOpen) return;
      
      setIsLoadingExistingReview(true);
      try {
        if (itemType === "track") {
          // Use the reviewApi to get the review by ID
          const trackItem = item as UITrack;
          const response = await reviewApi.getTrackReviews(trackItem.spotifyId);
          const reviewData = response.find(r => r.id === existingReviewId);
          
          if (reviewData) {
            setExistingReview(reviewData);
            // Autofill the description field with the existing review's description
            setReview(reviewData.description);
            // Set the initial opinion based on the existing review's opinion
            setOpinion(reviewData.opinion);
            setFinalRanking(reviewData.ranking);
          }
        }
        // TODO: Handle album and artist existing reviews
      } catch (err) {
        console.error('Failed to fetch existing review:', err);
        setError('Failed to load your existing review. You can still create a new one.');
      } finally {
        setIsLoadingExistingReview(false);
      }
    };
    
    fetchExistingReview();
  }, [existingReviewId, isOpen, item, itemType]);

  // Update mid point when low or high changes (binary search)
  useEffect(() => {
    if (reviewedItems.length > 0) {
      const newMid = Math.floor((low + high) / 2);
      setMid(newMid);
      
      // Set the current comparison item to the item at the mid point
      if (newMid >= 0 && newMid < reviewedItems.length) {
        setCurrentComparisonItem(reviewedItems[newMid]);
      }
    }
  }, [low, high, reviewedItems]);

  // Function to prefetch comparison data for all opinion types
  const prefetchComparisonData = async () => {
    if (isPrefetching) return;
    
    setIsPrefetching(true);
    
    // Prefetch for all three opinion types
    const opinionTypes: ('DISLIKE' | 'NEUTRAL' | 'LIKED')[] = ['DISLIKE', 'NEUTRAL', 'LIKED'];
    
    try {
      // Fetch data for each opinion type in parallel
      await Promise.all(opinionTypes.map(async (opinionType) => {
        try {
          const data = await fetchComparisonDataForOpinion(opinionType);
          setPrefetchedData(prev => ({
            ...prev,
            [opinionType]: data
          }));
        } catch (error) {
          console.error(`Error prefetching data for ${opinionType}:`, error);
        }
      }));
    } finally {
      setIsPrefetching(false);
    }
  };

  // Function to fetch comparison data for a specific opinion
  const fetchComparisonDataForOpinion = async (opinionType: 'DISLIKE' | 'NEUTRAL' | 'LIKED'): Promise<CachedComparisonData> => {
    const result: CachedComparisonData = {
      items: [],
      noItemsAvailable: false,
      finalRanking: null
    };
    
    if (itemType === "track") {
      // Get user reviews from the backend filtered by opinion
      const userReviews = await reviewApi.getUserReviews([opinionType]);
      
      // If no reviews, mark as no items available
      if (userReviews.length === 0) {
        result.noItemsAvailable = true;
        result.finalRanking = 1;
        return result;
      }
      
      const trackItem = item as UITrack;
      
      // Filter out the current item being reviewed if it's in the user's reviews
      const filteredReviews = userReviews.filter(review => 
        review.spotifyTrackId !== trackItem.spotifyId
      );
      
      if (filteredReviews.length === 0) {
        // If no reviewed items after filtering, mark as no items available
        result.noItemsAvailable = true;
        result.finalRanking = 1;
        return result;
      }
      
      // Extract all track IDs from the filtered reviews
      const trackIds = filteredReviews.map(review => review.spotifyTrackId);
      
      // Create a map to store track data
      const tracksDataMap: Record<string, any> = {};
      
      try {
        // Fetch tracks in batches of 50 (Spotify API limit)
        const batchSize = 50;
        const trackBatches = [];
        
        for (let i = 0; i < trackIds.length; i += batchSize) {
          trackBatches.push(trackIds.slice(i, i + batchSize));
        }
        
        // Fetch all batches in parallel
        const batchResults = await Promise.all(
          trackBatches.map(batch => spotifyApi.getTracksBatch(batch))
        );
        
        // Combine all batch results
        const allTracks = batchResults.flatMap(result => result.tracks);
        
        // Create a map of track ID to track data for easy lookup
        allTracks.forEach(track => {
          tracksDataMap[track.id] = track;
        });
      } catch (batchError) {
        console.error('Failed to fetch tracks in batch:', batchError);
        // Fall back to individual fetches if batch fails
        for (const trackId of trackIds) {
          try {
            const trackData = await spotifyApi.getTrack(trackId);
            tracksDataMap[trackId] = trackData;
          } catch (trackError) {
            console.error(`Failed to fetch track ${trackId}:`, trackError);
          }
        }
      }
      
      // Create an array to hold items with details
      const reviewedItems: ReviewWithItem[] = [];
      
      // Map the reviews to items with details
      for (const review of filteredReviews) {
        const trackData = tracksDataMap[review.spotifyTrackId];
        
        if (trackData) {
          // Ensure we have a valid album image URL or use a fallback
          const albumImageUrl = trackData.album.images && 
                               trackData.album.images.length > 0 && 
                               trackData.album.images[0]?.url ? 
                               trackData.album.images[0].url : 
                               'https://via.placeholder.com/300';
          
          reviewedItems.push({
            albumImageUrl: albumImageUrl,
            albumName: trackData.album.name,
            artistName: trackData.artists[0].name,
            trackName: trackData.name,
            spotifyId: trackData.id,
            ranking: review.ranking,
            reviewId: review.id
          });
        }
      }
      
      if (reviewedItems.length === 0) {
        // If no reviewed items after fetching data, mark as no items available
        result.noItemsAvailable = true;
        result.finalRanking = 1;
        return result;
      }
      
      // Sort items by ranking (lowest to highest)
      result.items = [...reviewedItems].sort((a, b) => a.ranking - b.ranking);
      
      // If there's only one item, set the final ranking
      if (result.items.length === 1) {
        result.finalRanking = result.items[0].ranking;
      }
    } else if (itemType === "album" || itemType === "artist") {
      // TODO: Implement album and artist comparison logic
      result.noItemsAvailable = true;
      result.finalRanking = 1;
    }
    
    return result;
  };

  // Function to reset all state when modal is closed
  const resetState = () => {
    setReview("");
    setIsComparing(false);
    setOpinion(null);
    setError(null);
    setIsSubmitted(false);
    setIsSubmitting(false);
    setProgress(0);
    setFinalRanking(null);
    setComparisonDataReady(false);
    setComparisonsComplete(false);
    setReviewedItems([]);
    setCurrentComparisonItem(null);
    setLow(0);
    setHigh(0);
    setMid(0);
    setNoItemsAvailable(false);
    setLoadingComparisons(false);
    
    // Reset prefetched data
    setPrefetchedData({
      'DISLIKE': null,
      'NEUTRAL': null,
      'LIKED': null
    });
  };

  // Handle modal close with state reset
  const handleClose = () => {
    resetState();
    onClose();
  };

  // Fetch user's reviewed items for comparison
  const fetchUserReviewedItems = async (selectedOpinion?: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    // Use the passed opinion parameter or fall back to the state
    const opinionToUse = selectedOpinion || opinion;
    
    // Safety check - if no opinion is set, we can't fetch items
    if (!opinionToUse) {
      setLoadingComparisons(false);
      setNoItemsAvailable(true);
      return;
    }
    
    // Reset data ready flag
    setComparisonDataReady(false);
    setLoadingComparisons(true);
    
    try {
      // Check if we have prefetched data for this opinion
      if (prefetchedData[opinionToUse]) {
        const cachedData = prefetchedData[opinionToUse]!;
        
        // Use the prefetched data
        setReviewedItems(cachedData.items);
        setNoItemsAvailable(cachedData.noItemsAvailable);
        
        if (cachedData.finalRanking) {
          setFinalRanking(cachedData.finalRanking);
        }
        
        // If there are no items available, mark as complete
        if (cachedData.noItemsAvailable) {
          setComparisonsComplete(true);
        } else if (cachedData.items.length > 0) {
          // Set up binary search with prefetched items
          if (cachedData.items.length === 1) {
            setLow(0);
            setHigh(0);
            setMid(0);
            setCurrentComparisonItem(cachedData.items[0]);
          } else {
            // Initialize binary search pointers
            setLow(0);
            setHigh(cachedData.items.length - 1);
            
            // Set initial mid point
            const initialMid = Math.floor((0 + (cachedData.items.length - 1)) / 2);
            setMid(initialMid);
            
            // Set initial comparison item
            setCurrentComparisonItem(cachedData.items[initialMid]);
          }
        }
        
        // Mark data as ready
        setComparisonDataReady(true);
        setLoadingComparisons(false);
        return;
      }
      
      // If no prefetched data, fetch it now
      const data = await fetchComparisonDataForOpinion(opinionToUse);
      
      // Update the prefetched data cache
      setPrefetchedData(prev => ({
        ...prev,
        [opinionToUse]: data
      }));
      
      // Use the fetched data
      setReviewedItems(data.items);
      setNoItemsAvailable(data.noItemsAvailable);
      
      if (data.finalRanking) {
        setFinalRanking(data.finalRanking);
      }
      
      // If there are no items available, mark as complete
      if (data.noItemsAvailable) {
        setComparisonsComplete(true);
      } else if (data.items.length > 0) {
        // Set up binary search with fetched items
        if (data.items.length === 1) {
          setLow(0);
          setHigh(0);
          setMid(0);
          setCurrentComparisonItem(data.items[0]);
        } else {
          // Initialize binary search pointers
          setLow(0);
          setHigh(data.items.length - 1);
          
          // Set initial mid point
          const initialMid = Math.floor((0 + (data.items.length - 1)) / 2);
          setMid(initialMid);
          
          // Set initial comparison item
          setCurrentComparisonItem(data.items[initialMid]);
        }
      }
      
      // Set data ready flag at the very end when everything is loaded
      setComparisonDataReady(true);
      
    } catch (err) {
      console.error('Failed to fetch user reviewed items:', err);
      setError('Failed to load your reviewed items. Please try again.');
      setNoItemsAvailable(true);
      setComparisonDataReady(false); // Make sure data ready is false on error
    } finally {
      // Always make sure to reset loading state
      setLoadingComparisons(false);
    }
  };

  const startComparison = async (e: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    // Safety check - if no opinion is set, we can't start comparison
    if (!e) {
      return;
    }
    
    // Reset comparison-related states
    setComparisonsComplete(false);
    setNoItemsAvailable(false);
    setCurrentComparisonItem(null);
    setReviewedItems([]);
    setFinalRanking(null);
    setComparisonDataReady(false);
    
    // Set comparing to true to show the comparison UI
    setIsComparing(true);
    
    // Fetch items for comparison
    await fetchUserReviewedItems(e);
  };

  // Handle item selection for binary search
  const handleItemSelect = (isCurrentItemBetter: boolean) => {
    if (!currentComparisonItem) return;
    
    // Special case for single item comparison
    if (reviewedItems.length === 1) {
      let newRanking: number;
      
      if (isCurrentItemBetter) {
        // User thinks current item is better than the only item
        // Insert it before that item
        newRanking = reviewedItems[0].ranking;
      } else {
        // User thinks the only item is better than current item
        // Insert current item after that item
        newRanking = reviewedItems[0].ranking + 1;
      }
      
      setFinalRanking(newRanking);
      setComparisonsComplete(true);
      submitReview(newRanking);
      return;
    }
    
    // If binary search is complete (low >= high - 1), we've found our insertion point
    if (low >= high - 1) {
      // Determine final ranking based on the last comparison
      let newRanking: number;
      
      // Special case: if low is 0 and the user selected the current item as better,
      // this means the item should be at the very top (rank 1)
      if (low === 0 && isCurrentItemBetter) {
        // User thinks current item is better than the highest ranked item
        // It should get the top ranking (1)
        newRanking = 1;
      } else if (isCurrentItemBetter) {
        // User thinks current item is better than the high item
        // Insert it before the high item
        newRanking = reviewedItems[high].ranking;
      } else {
        // User thinks high item is better than current item
        // Insert current item after the high item
        newRanking = reviewedItems[high].ranking + 1;
      }
      
      setFinalRanking(newRanking);
      setComparisonsComplete(true);
      submitReview(newRanking);
      return;
    }
    
    // Update pointers based on selection
    if (isCurrentItemBetter) {
      // User thinks current item is better than mid item
      // Search in the lower half (better rankings)
      setHigh(mid);
    } else {
      // User thinks mid item is better than current item
      // Search in the upper half (worse rankings)
      setLow(mid + 1);
    }
  };

  const submitReview = (ranking?: number) => {
    // Set submitting state to show loading indicator
    setIsSubmitting(true);
    
    if (opinion) {
      let itemId = '';
      
      if (itemType === "track") {
        itemId = (item as UITrack).spotifyId;
      } else if (itemType === "album") {
        itemId = (item as UIAlbum).spotifyId;
      } else if (itemType === "artist") {
        itemId = (item as UIArtist).spotifyId;
      }
      
      const reviewData: ReviewData = {
        spotifyTrackId: itemId, // This will need to be updated when album/artist reviews are implemented
        opinion: opinion,
        description: review,
        ranking: ranking || finalRanking || 0,
        ...(existingReviewId && { id: existingReviewId })
      };
      
      // Call the API to save the review
      reviewApi.saveReview(reviewData)
        .then(response => {
          setIsSubmitted(true);
          setIsSubmitting(false);
          
          // Show success toast notification
          toast.success("Review submitted successfully!", {
            description: `Your ${itemType} review has been saved.`,
            duration: 3000,
          });
          
          // Call the callback if provided
          if (onAlbumReviewSaved) {
            onAlbumReviewSaved();
          }
          
          // Close the dialog after a short delay
          setTimeout(() => {
            handleClose();
          }, 200);
        })
        .catch(error => {
          console.error('Error saving review:', error);
          setError(`Failed to save review: ${error.response?.data?.error || error.message || 'Unknown error'}`);
          setIsSubmitting(false);
        });
    } else {
      // Simulate successful submission for now
      setTimeout(() => {
        setIsSubmitted(true);
        setIsSubmitting(false);
        
        // Show success toast notification
        toast.success("Review submitted successfully!", {
          description: `Your ${itemType} review has been saved.`,
          duration: 3000,
        });
        
        // Close the dialog after a short delay
        setTimeout(() => {
          handleClose();
        }, 200);
      }, 200);
    }
  };

  const onOpinionSelected = (e: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    // If we have review text, submit the review regardless of opinion change
    if (review.trim().length > 0) {
      setOpinion(e);
      submitReview();
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

  // Helper function to create a temporary UI item from a comparison item
  const createUIItem = (comparisonItem: ComparisonItem) => {
    if (itemType === "track") {
      return {
        spotifyId: comparisonItem.spotifyId,
        trackName: comparisonItem.trackName || '',
        artistName: comparisonItem.artistName || '',
        albumName: comparisonItem.albumName || '',
        albumId: comparisonItem.spotifyId,
        albumImageUrl: comparisonItem.albumImageUrl || 'https://via.placeholder.com/300',
      } as UITrack;
    } else if (itemType === "album") {
      return {
        spotifyId: comparisonItem.spotifyId,
        albumName: comparisonItem.albumName || '',
        artistName: comparisonItem.artistName || '',
        albumImageUrl: comparisonItem.albumImageUrl || 'https://via.placeholder.com/300',
      } as UIAlbum;
    } else {
      return {
        spotifyId: comparisonItem.spotifyId,
        artistName: comparisonItem.artistName || '',
        artistImageUrl: comparisonItem.artistImageUrl || 'https://via.placeholder.com/300',
      } as UIArtist;
    }
  };

  return (
    <>
      {children}
      <Dialog open={isOpen} onOpenChange={handleClose}>
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
                disabled={isSubmitting || isSubmitted}
              />
              <div className="text-sm text-muted-foreground text-right">
                {review.length}/{maxLength} characters
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
                        setTimeout(() => submitReview(1), 1500);
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
                        <MusicItem item={item} itemType={itemType} />
                      </div>
                      <div className="text-lg font-bold text-center text-align-center text-justify-center m-4">or</div>
                      <div onClick={() => handleItemSelect(false)} style={{ cursor: 'pointer' }} className="hover:opacity-80 transition-opacity">
                        {/* Create a temporary UI item from currentComparisonItem */}
                        <MusicItem 
                          item={createUIItem(currentComparisonItem)}
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