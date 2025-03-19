import { useState, useMemo } from "react";
import { TrackScrollArea } from "@/components/TrackScrollArea.tsx";
import { Separator } from "@/components/ui/separator";
import { reviewApi, spotifyApi, Track, TrackReview } from "@/api/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { SearchBar } from "@/components/ui/search-bar";

export default function ReviewedTracks() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  
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
  const trackIds = trackReviews?.map(review => review.trackId) || [];
  
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
          reviewsMap[review.trackId] = review;
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
  
  // Filter tracks based on search query
  const filteredTracks = useMemo(() => {
    if (!groupedTracks || !searchQuery.trim()) {
      return groupedTracks;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // Filter function to check if a track matches the search query
    const filterTrack = (track: Track) => {
      return (
        // Search in track name
        track.name.toLowerCase().includes(query) ||
        // Search in artist names
        track.artists.some(artist => artist.name.toLowerCase().includes(query)) ||
        // Search in album name
        track.album.name.toLowerCase().includes(query)
      );
    };
    
    return {
      liked: groupedTracks.liked.filter(filterTrack),
      neutral: groupedTracks.neutral.filter(filterTrack),
      disliked: groupedTracks.disliked.filter(filterTrack),
      reviewsMap: groupedTracks.reviewsMap
    };
  }, [groupedTracks, searchQuery]);
  
  // Function to refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trackReviews'] }),
        queryClient.invalidateQueries({ queryKey: ['tracks'] })
      ]);
      toast.success("Data refreshed", {
        description: "Your reviewed tracks have been updated"
      });
    } catch (error) {
      toast.error("Refresh failed", {
        description: "Failed to refresh your reviewed tracks"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Helper function to render a section
  const renderSection = (title: string, tracks: Track[]) => {
    if (!tracks || tracks.length === 0) return null;
    
    // Get reviews for these tracks
    const reviews = tracks
      .map(track => groupedTracks?.reviewsMap[track.id])
      .filter(Boolean) as TrackReview[];
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
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

  // Check if there are any tracks after filtering
  const hasFilteredTracks = filteredTracks && (
    filteredTracks.liked.length > 0 || 
    filteredTracks.neutral.length > 0 || 
    filteredTracks.disliked.length > 0
  );

  return (
    <div className="content-container">
      <div className="flex flex-col gap-4">
        <PageHeader 
          title="Your Reviewed Tracks" 
          onRefresh={refreshData}
          isRefreshing={isRefreshing}
          isLoading={isLoading}
          className="flex-wrap"
        />
        
        <div className="w-full mb-2">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tracks..."
            className="w-full max-w-[300px]"
          />
        </div>
      </div>
      
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading your tracks...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-red-500">
            <p>{(error as Error).message}</p>
          </div>
        ) : !hasFilteredTracks ? (
          <div className="flex justify-center items-center h-64">
            <p>
              {searchQuery.trim() 
                ? "No tracks match your search." 
                : "You haven't reviewed any tracks yet."}
            </p>
          </div>
        ) : (
          <div>
            {renderSection("Tracks You Liked", filteredTracks.liked)}
            {renderSection("Tracks You Feel Neutral About", filteredTracks.neutral)}
            {renderSection("Tracks You Disliked", filteredTracks.disliked)}
          </div>
        )}
      </div>
    </div>
  );
} 