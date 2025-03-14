import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import MusicScrollArea from "@/components/MusicScrollArea.tsx"
import { Separator } from "@/components/ui/separator"
import { Track } from "@/types/spotify"
import { useQuery } from "@tanstack/react-query"
import { spotifyApi, reviewApi } from "@/api/apiClient"

export default function RecentlyPlayed() {
  // React Query for recently played tracks
  const { 
    data: recentlyPlayedData, 
    isLoading: tracksLoading, 
    error: tracksError, 
    isError: isTracksError 
  } = useQuery({
    queryKey: ['recentlyPlayed'],
    queryFn: () => spotifyApi.getRecentlyPlayed({ limit: 50 }),
  });

  // React Query for all track reviews
  const { data: trackReviews } = useQuery({
    queryKey: ['trackReviews'],
    queryFn: () => reviewApi.getUserReviews(),
  });

  // Extract just the tracks from the PlayHistoryItems
  const tracks = recentlyPlayedData?.items.map(item => item.track);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-primary">Recently Played Tracks</h1>
          <h2 className="text-sm text-muted-foreground">Your most recently played tracks on Spotify.</h2>
        </div>
      </div>
      
      {isTracksError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shrink-0">
          {(tracksError as Error)?.message || 'Failed to load recently played tracks. Please try again later.'}
        </div>
      )}
      
      <div className="flex-1 w-full">
        {tracksLoading ? (
          <div className="w-full h-full">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : (
          <div>
            <div className="flex flex-col gap-2">
              <Separator />
              <MusicScrollArea items={tracks as Track[]} itemType="track" reviews={trackReviews} showRating={true}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
