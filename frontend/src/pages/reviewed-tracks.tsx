import { useState } from "react";
import { TrackScrollArea } from "@/components/TrackScrollArea.tsx";
import { Separator } from "@/components/ui/separator";
import { reviewApi, spotifyApi, Track, TrackReview } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";

export default function ReviewedTracks() {
  // React Query for all track reviews
  const { 
    data: trackReviews, 
    isLoading: isTrackReviewsLoading, 
    error: trackReviewsError
  } = useQuery({
    queryKey: ['trackReviews'],
    queryFn: () => reviewApi.getUserReviews(),
  });
  
  // Extract track IDs from reviews for batch fetching
  const trackIds = trackReviews?.map(review => review.spotifyTrackId) || [];
  
  // React Query for fetching tracks in batch with data transformation
  const { 
    data: groupedTracks, 
    isLoading: isTracksLoading, 
    error: tracksError 
  } = useQuery({
    queryKey: ['tracks', trackIds],
    queryFn: async () => {
      // If no track IDs, return empty result
      if (trackIds.length === 0) {
        return { 
          liked: [], 
          neutral: [], 
          disliked: [], 
          reviewsMap: {} 
        };
      }
      
      // Fetch tracks in batch
      const tracksData = await spotifyApi.getTracksBatch(trackIds);
      
      // Create a map of track IDs to review objects
      const reviewsMap: Record<string, TrackReview> = {};
      if (trackReviews) {
        trackReviews.forEach(review => {
          reviewsMap[review.spotifyTrackId] = review;
        });
      }
      
      // Group tracks by opinion based on their associated reviews
      const liked: Track[] = [];
      const neutral: Track[] = [];
      const disliked: Track[] = [];
      
      tracksData.tracks.forEach(track => {
        const review = reviewsMap[track.id];
        if (review) {
          if (review.opinion === 'LIKED') {
            liked.push(track);
          } else if (review.opinion === 'NEUTRAL') {
            neutral.push(track);
          } else if (review.opinion === 'DISLIKE') {
            disliked.push(track);
          }
        }
      });
      
      return {
        liked,
        neutral,
        disliked,
        reviewsMap
      };
    },
    enabled: trackIds.length > 0, // Only run query if we have track IDs
  });
  
  // Helper function to render a section
  const renderSection = (title: string, tracks: Track[]) => {
    if (!tracks || tracks.length === 0) return null;
    
    // Get reviews for these tracks
    const reviews = tracks
      .map(track => groupedTracks?.reviewsMap[track.id])
      .filter(Boolean) as TrackReview[];
    
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <div className="flex flex-col gap-2">
          <Separator />
          <TrackScrollArea
            items={tracks} 
            reviews={reviews}
          />
        </div>
      </div>
    );
  };

  // Determine if we're still loading
  const isLoading = isTrackReviewsLoading || isTracksLoading;
  // Determine if there's an error
  const error = trackReviewsError || tracksError;

  return (
    <div className="content-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Reviewed Tracks</h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading your tracks...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64 text-red-500">
          <p>{error.message}</p>
        </div>
      ) : !groupedTracks || (
          groupedTracks.liked.length === 0 && 
          groupedTracks.neutral.length === 0 && 
          groupedTracks.disliked.length === 0
        ) ? (
        <div className="flex justify-center items-center h-64">
          <p>You haven't reviewed any tracks yet.</p>
        </div>
      ) : (
        <div>
          {renderSection("Tracks You Liked", groupedTracks.liked)}
          {renderSection("Tracks You Feel Neutral About", groupedTracks.neutral)}
          {renderSection("Tracks You Disliked", groupedTracks.disliked)}
        </div>
      )}
    </div>
  );
} 