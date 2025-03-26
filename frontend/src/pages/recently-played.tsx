import React, { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Track } from "@/types/spotify"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { spotifyApi, reviewApi } from "@/api/apiClient"
import { PageHeader } from "@/components/ui/page-header"
import { toast } from "sonner"
import { useRecentlyPlayed, useTrackReviews, useRefreshRecentlyPlayed } from "@/hooks/queryHooks"
import TrackScrollArea from "@/components/TrackScrollArea"

export default function RecentlyPlayed() {
  // Use custom hooks for queries
  const { 
    data: recentlyPlayedData, 
    isLoading: tracksLoading, 
    error: tracksError, 
    isError: isTracksError 
  } = useRecentlyPlayed(50);

  // Use custom hook for track reviews
  const { data: trackReviews } = useTrackReviews();

  // Use refresh hook
  const { refreshData, isRefreshing } = useRefreshRecentlyPlayed();

  // Extract just the tracks from the PlayHistoryItems
  const tracks = recentlyPlayedData?.items.map(item => item.track);

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader 
        title="Recently Played Tracks" 
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
        isLoading={tracksLoading}
      />
      
      <h2 className="text-sm text-muted-foreground mb-4">Your most recently played tracks on Spotify.</h2>
      
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
              <TrackScrollArea items={tracks as Track[]} reviews={trackReviews} showRating={true}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
