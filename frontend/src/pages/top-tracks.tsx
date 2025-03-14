import React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import MusicScrollArea from "@/components/MusicScrollArea.tsx"
import { Separator } from "@/components/ui/separator"
import { UITrack, UIArtist, transformTrackForUI, transformArtistForUI, Track, Artist, PagingObject } from "@/types/spotify"
import { useQuery } from "@tanstack/react-query"
import { spotifyApi, reviewApi } from "@/api/apiClient"

interface FilterOptions {
  timeRange: 'short_term' | 'medium_term' | 'long_term';
  limit: number;
  offset: number;
}

export default function TopTracks() {
  const [tracksFilters, setTracksFilters] = React.useState<FilterOptions>({
    timeRange: 'medium_term',
    limit: 50,
    offset: 0
  });

  const [artistsFilters, setArtistsFilters] = React.useState<FilterOptions>({
    timeRange: 'medium_term',
    limit: 50,
    offset: 0
  });

  // React Query for top tracks
  const { 
    data: tracksData, 
    isLoading: tracksLoading, 
    error: tracksError, 
    isError: isTracksError 
  } = useQuery({
    queryKey: ['topTracks', tracksFilters],
    queryFn: () => spotifyApi.getTopItems('tracks', tracksFilters),
  });

  // React Query for top artists
  const { 
    data: artistsData, 
    isLoading: artistsLoading, 
    error: artistsError, 
    isError: isArtistsError 
  } = useQuery({
    queryKey: ['topArtists', artistsFilters],
    queryFn: () => spotifyApi.getTopItems('artists', artistsFilters),
  });

  // React Query for all track reviews
  const { data: trackReviews } = useQuery({
    queryKey: ['trackReviews'],
    queryFn: () => reviewApi.getUserReviews(),
  });

  const handleTracksTimeRangeChange = (value: string) => {
    setTracksFilters(prev => ({
      ...prev,
      timeRange: value as 'short_term' | 'medium_term' | 'long_term'
    }));
  };

  const handleArtistsTimeRangeChange = (value: string) => {
    setArtistsFilters(prev => ({
      ...prev,
      timeRange: value as 'short_term' | 'medium_term' | 'long_term'
    }));
  };

  const timeRangeLabels = {
    'short_term': 'Last 4 Weeks',
    'medium_term': 'Last 6 Months',
    'long_term': 'Last Year'
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-primary">Your Top Tracks</h1>
          <h2 className="text-sm text-muted-foreground">You can see your top spotify tracks from the last 4 weeks, 6 months, or all time.</h2>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <Select
            value={tracksFilters.timeRange}
            onValueChange={handleTracksTimeRangeChange}
          >
            <SelectTrigger className="w-[12vw] min-w-[130px] p-2">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short_term">{timeRangeLabels.short_term}</SelectItem>
              <SelectItem value="medium_term">{timeRangeLabels.medium_term}</SelectItem>
              <SelectItem value="long_term">{timeRangeLabels.long_term}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isTracksError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shrink-0">
          {(tracksError as Error)?.message || 'Failed to load top tracks. Please try again later.'}
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
              <MusicScrollArea items={tracksData?.items as Track[]} itemType="track" reviews={trackReviews} showRating={true}/>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-primary">Your Top Artists</h1>
          <h2 className="text-sm text-muted-foreground">You can see your top spotify artists from the last 4 weeks, 6 months, or all time.</h2>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <Select
            value={artistsFilters.timeRange}
            onValueChange={handleArtistsTimeRangeChange}
          >
            <SelectTrigger className="w-[12vw] min-w-[130px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short_term">{timeRangeLabels.short_term}</SelectItem>
              <SelectItem value="medium_term">{timeRangeLabels.medium_term}</SelectItem>
              <SelectItem value="long_term">{timeRangeLabels.long_term}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isArtistsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shrink-0">
          {(artistsError as Error)?.message || 'Failed to load top artists. Please try again later.'}
        </div>
      )}
      
      <div className="flex-1 w-full">
        {artistsLoading ? (
          <div className="w-full h-full">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : (
          <div>
            <div className="flex flex-col gap-2">
              <Separator />
              <MusicScrollArea items={artistsData?.items as Artist[]} itemType="artist"/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 