import { useState, useEffect } from "react";
import { TrackMusicScrollArea } from "./TrackMusicScrollArea";
import { UITrack, transformTrackForUI } from "@/types/spotify";
import { Separator } from "@/components/ui/separator";
import { reviewApi, spotifyApi } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

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

export default function Tracks() {
  const [likedTracks, setLikedTracks] = useState<(UITrack & { review?: Review })[]>([]);
  const [neutralTracks, setNeutralTracks] = useState<(UITrack & { review?: Review })[]>([]);
  const [dislikedTracks, setDislikedTracks] = useState<(UITrack & { review?: Review })[]>([]);
  const [userReviewsMap, setUserReviewsMap] = useState<Record<string, Review>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchReviewedTracks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all user reviews
      const userReviews = await reviewApi.getUserReviews();
      
      // If there are no reviews, return early
      if (userReviews.length === 0) {
        setLikedTracks([]);
        setNeutralTracks([]);
        setDislikedTracks([]);
        setLoading(false);
        return;
      }
      
      // Create a map of track IDs to reviews for easy lookup
      const reviewsMap = userReviews.reduce((acc, review) => {
        acc[review.spotifyTrackId] = review;
        return acc;
      }, {} as Record<string, Review>);
      
      setUserReviewsMap(reviewsMap);
      
      // Extract all track IDs from the reviews
      const trackIds = userReviews.map(review => review.spotifyTrackId);
      
      // Use the batch API to fetch all tracks at once
      let tracksData: Record<string, any> = {};
      
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
        tracksData = allTracks.reduce((acc, track) => {
          acc[track.id] = track;
          return acc;
        }, {} as Record<string, any>);
        
      } catch (batchError) {
        console.error('Failed to fetch tracks in batch:', batchError);
        // Fall back to individual fetches if batch fails
        for (const review of userReviews) {
          try {
            const trackData = await spotifyApi.getTrack(review.spotifyTrackId);
            tracksData[review.spotifyTrackId] = trackData;
          } catch (trackError) {
            console.error(`Failed to fetch track ${review.spotifyTrackId}:`, trackError);
          }
        }
      }
      
      // Group reviews by opinion
      const likedReviews = userReviews.filter(review => review.opinion === 'LIKED');
      const neutralReviews = userReviews.filter(review => review.opinion === 'NEUTRAL');
      const dislikedReviews = userReviews.filter(review => review.opinion === 'DISLIKE');
      
      // Transform tracks to UI format for each opinion group
      const transformReviewsToTracks = (reviews: typeof userReviews) => {
        return reviews
          .filter(review => tracksData[review.spotifyTrackId]) // Only include tracks that were successfully fetched
          .map(review => {
            const trackData = tracksData[review.spotifyTrackId];
            const uiTrack = transformTrackForUI(trackData);
            // Add the full review object to the track
            return {
              ...uiTrack,
              review: review
            };
          })
          .sort((a, b) => {
            const reviewA = reviews.find(r => r.spotifyTrackId === a.spotifyId);
            const reviewB = reviews.find(r => r.spotifyTrackId === b.spotifyId);
            return (reviewA?.ranking || 0) - (reviewB?.ranking || 0);
          });
      };
      
      // Set state for each category
      setLikedTracks(transformReviewsToTracks(likedReviews));
      setNeutralTracks(transformReviewsToTracks(neutralReviews));
      setDislikedTracks(transformReviewsToTracks(dislikedReviews));
    } catch (error) {
      console.error('Error fetching reviewed tracks:', error);
      setError('Failed to load reviewed tracks. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviewedTracks();
  }, []);  // Empty dependency array means this effect runs once on mount

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviewedTracks();
  };

  // Helper function to render a section
  const renderSection = (title: string, tracks: (UITrack & { review?: Review })[]) => {
    if (tracks.length === 0) return null;
    
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <div className="flex flex-col gap-2">
          <Separator />
          <TrackMusicScrollArea 
            items={tracks} 
            reviews={tracks.map(track => track.review).filter(Boolean) as Review[]}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="content-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Reviewed Tracks</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={loading || refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading your tracks...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64 text-red-500">
          <p>{error}</p>
        </div>
      ) : likedTracks.length === 0 && neutralTracks.length === 0 && dislikedTracks.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p>You haven't reviewed any tracks yet.</p>
        </div>
      ) : (
        <div>
          {renderSection("Tracks You Liked", likedTracks)}
          {renderSection("Tracks You Feel Neutral About", neutralTracks)}
          {renderSection("Tracks You Disliked", dislikedTracks)}
        </div>
      )}
    </div>
  );
} 