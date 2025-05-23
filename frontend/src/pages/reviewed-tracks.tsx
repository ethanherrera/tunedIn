import { useState, useMemo } from "react";
import { TrackScrollArea } from "@/components/TrackScrollArea.tsx";
import { Separator } from "@/components/ui/separator";
import { Track } from "@/api/apiClient";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBar } from "@/components/ui/search-bar";
import { useTrackReviews, useRefreshReviewedTracks } from '@/hooks/queryHooks';

export default function ReviewedTracks() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Use custom hook for track reviews
  const { 
    data: trackReviews, 
    isLoading: isTrackReviewsLoading, 
    error: trackReviewsError
  } = useTrackReviews();

  // Filter and group tracks based on search query
  const groupedTracks = useMemo(() => {
    if (!trackReviews) return null;

    const tracks = trackReviews.map(review => review.track);
    const query = searchQuery.toLowerCase().trim();
    
    // Filter function to check if a track matches the search query
    const filterTrack = (track: Track) => {
      if (!query) return true;
      return (
        track.name.toLowerCase().includes(query) ||
        track.artists.some(artist => artist.name.toLowerCase().includes(query)) ||
        track.album.name.toLowerCase().includes(query)
      );
    };

    // Group tracks by opinion
    const grouped = {
      liked: [] as Track[],
      neutral: [] as Track[],
      disliked: [] as Track[]
    };

    // Group tracks based on their reviews
    trackReviews.forEach(review => {
      const track = review.track;
      if (!filterTrack(track)) return;
      
      switch (review.opinion) {
        case 'LIKED':
          grouped.liked.push(track);
          break;
        case 'NEUTRAL':
          grouped.neutral.push(track);
          break;
        case 'DISLIKE':
          grouped.disliked.push(track);
          break;
      }
    });

    return grouped;
  }, [trackReviews, searchQuery]);

  // Use the refresh hook for data management
  const { refreshData, isRefreshing } = useRefreshReviewedTracks();
  
  // Helper function to render a section
  const renderSection = (title: string, tracks: Track[]) => {
    if (!tracks || tracks.length === 0) return null;
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <div className="flex flex-col gap-2">
          <Separator />
          <TrackScrollArea
            items={tracks}
            reviews={trackReviews}
            showRating={true}
          />
        </div>
      </div>
    );
  };

  // Check if there are any tracks after filtering
  const hasFilteredTracks = groupedTracks && (
    groupedTracks.liked.length > 0 || 
    groupedTracks.neutral.length > 0 || 
    groupedTracks.disliked.length > 0
  );

  return (
    <div className="content-container">
      <div className="flex flex-col gap-4">
        <PageHeader 
          title="Your Reviewed Tracks" 
          onRefresh={refreshData}
          isRefreshing={isRefreshing}
          isLoading={isTrackReviewsLoading}
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
        {isTrackReviewsLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading your tracks...</p>
          </div>
        ) : trackReviewsError ? (
          <div className="flex justify-center items-center h-64 text-red-500">
            <p>{(trackReviewsError as Error).message}</p>
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
            {renderSection("Tracks You Liked", groupedTracks.liked)}
            {renderSection("Tracks You Feel Neutral About", groupedTracks.neutral)}
            {renderSection("Tracks You Disliked", groupedTracks.disliked)}
          </div>
        )}
      </div>
    </div>
  );
}